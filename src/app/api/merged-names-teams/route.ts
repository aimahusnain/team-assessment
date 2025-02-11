import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CALL_MINUTES_THRESHOLD = 750;

interface TeamDetails {
  team: string;
  department: string | null;
  avgTotalCallMinutes: string;
  tcmScore: ScoreLevel;
  avgCallEfficiency: string;
  ceScore: ScoreLevel;
  avgTotalSales: string;
  tsScore: ScoreLevel;
  avgRatioBetweenSkadeAndLiv: string;
  rbslScore: ScoreLevel;
  // avgTotalScore: number;
  month: string;
}

interface ScoreLevel {
  level: number;
  score: number | string;
}

interface ScoreMatrix {
  benchmark: number;
  interval: number;
  levels: ScoreLevel[];
}

const formatNumber = (num: number): string => {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

const formatDecimal = (num: number): string => {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
    style: "percent",
  }).format(num);
};

const formatRatio = (num: number): string => {
  return (num * 100).toFixed(1) + "%";
};

const normalizeAndTrim = (str: string | null | undefined): string => {
  if (!str) return "";
  return str.trim().replace(/\s+/g, " ");
};

const calculateTCMScore = async (): Promise<ScoreMatrix | null> => {
  const inputs = await prisma.inputs.findFirst();
  if (!inputs) return null;

  const benchmark = inputs.team_score_tcm_benchmark || 0;
  const interval = inputs.team_score_tcm_interval || 0;

  return {
    benchmark,
    interval,
    levels: Array.from({ length: 10 }, (_, i) => {
      const level = 10 - i;
      if (level === 1) return { level, score: "-" };
      const steps = level - 5;
      const score = benchmark + steps * interval;
      return { level, score };
    }),
  };
};

const calculateCEScore = async (): Promise<ScoreMatrix | null> => {
  const inputs = await prisma.inputs.findFirst();
  if (!inputs) return null;

  const benchmark = Number.parseFloat(inputs.team_score_ce_benchmark || "0");
  const interval = Number.parseFloat(inputs.team_score_ce_interval || "0");

  return {
    benchmark,
    interval,
    levels: Array.from({ length: 10 }, (_, i) => {
      const level = 10 - i;
      if (level === 10) return { level, score: 0 };
      if (level > 5) {
        return { level, score: benchmark - (level - 5) * interval };
      }
      if (level === 5) return { level, score: benchmark };
      return { level, score: benchmark + (5 - level) * interval };
    }),
  };
};

const calculateTSScore = async (): Promise<ScoreMatrix | null> => {
  const inputs = await prisma.inputs.findFirst();
  if (!inputs) return null;

  const benchmark = inputs.team_score_ts_benchmark || 0;
  const interval = inputs.team_score_ts_interval || 0;

  return {
    benchmark,
    interval,
    levels: Array.from({ length: 10 }, (_, i) => {
      const level = 10 - i;
      if (level === 1) return { level, score: "-" };
      const steps = level - 5;
      const score = benchmark + steps * interval;
      return { level, score };
    }),
  };
};

const calculateRBSLScore = async (): Promise<ScoreMatrix | null> => {
  const inputs = await prisma.inputs.findFirst();
  if (!inputs) return null;

  const benchmark = Number.parseFloat(inputs.team_score_rbsl_benchmark || "0");
  const interval = Number.parseFloat(inputs.team_score_rbsl_interval || "0");

  return {
    benchmark,
    interval,
    levels: Array.from({ length: 10 }, (_, i) => {
      const level = 10 - i;
      if (level === 10) {
        return { level, score: benchmark + 5 * interval };
      } else if (level > 5) {
        return { level, score: benchmark + (level - 5) * interval };
      } else if (level === 5) {
        return { level, score: benchmark };
      } else if (level === 1) {
        return { level, score: 0 };
      } else {
        return { level, score: benchmark - (5 - level) * interval };
      }
    }),
  };
};

const getScoreForValue = (
  value: number,
  scoreMatrix: ScoreMatrix | null,
  isDescending = true,
  isRBSL = false
): ScoreLevel => {
  if (!scoreMatrix) return { level: 1, score: "-" };

  if (isRBSL) {
    const valueAsPercent = value * 100;
    const sortedLevels = scoreMatrix.levels
      .filter(({ score }) => score !== "-")
      .sort((a, b) => {
        const aScore = Number(a.score);
        const bScore = Number(b.score);
        return bScore - aScore;
      });

    const matchedLevel = sortedLevels.find(
      ({ score }) => valueAsPercent >= Number(score)
    );
    return matchedLevel || { level: 1, score: "0" };
  }

  const sortedLevels = scoreMatrix.levels
    .filter(({ score }) => score !== "-")
    .sort((a, b) => {
      const aScore = Number(a.score);
      const bScore = Number(b.score);
      return isDescending ? bScore - aScore : aScore - bScore;
    });

  const matchedLevel = sortedLevels.find(({ score }) =>
    isDescending ? value >= Number(score) : value <= Number(score)
  );

  return matchedLevel || { level: 1, score: "-" };
};

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const months = url.searchParams.getAll("months");
    const year = parseInt(url.searchParams.get("year") || new Date().getFullYear().toString());

    const [tcmScoreMatrix, ceScoreMatrix, tsScoreMatrix, rbslScoreMatrix] = await Promise.all([
      calculateTCMScore(),
      calculateCEScore(),
      calculateTSScore(),
      calculateRBSLScore(),
    ]);

    const monthlyData = await Promise.all(
      months.map(async (month) => {
        const [activityLogs, incomingCalls, outgoingCalls] = await Promise.all([
          prisma.activityLog.findMany({
            where: { monthName: month, year },
            select: {
              name: true,
              verdi: true,
              activity: true,
              team: true,
              department: true,
            },
          }),
          prisma.incomingCalls.findMany({
            where: { monthName: month, year },
            select: {
              navn: true,
              min: true,
            },
          }),
          prisma.outgoingCalls.findMany({
            where: { monthName: month, year },
            select: {
              navn: true,
              outgoing: true,
              regular_call_time_min: true,
            },
          }),
        ]);

        const teamDetailsMap = new Map<string, { department: string; members: Set<string> }>();
        const teamTotalCallMinutesMap = new Map<string, number[]>();
        const teamCallEfficiencyMap = new Map<string, number[]>();
        const teamTotalSalesMap = new Map<string, number[]>();
        const teamLivRatioMap = new Map<string, number[]>();

        // Process activity logs
        activityLogs.forEach((log) => {
          const normalizedName = normalizeAndTrim(log.name);
          const normalizedTeam = normalizeAndTrim(log.team);
          if (normalizedName && normalizedTeam) {
            if (!teamDetailsMap.has(normalizedTeam)) {
              teamDetailsMap.set(normalizedTeam, { department: log.department || "", members: new Set() });
            }
            teamDetailsMap.get(normalizedTeam)!.members.add(normalizedName);
          }
        });

        // Calculate total call minutes and call efficiency for each individual
        const individualDataMap = new Map<string, { totalCallMinutes: number; totalOutgoingCalls: number; totalSales: number; livSales: number }>();

        incomingCalls.forEach((call) => {
          const normalizedName = normalizeAndTrim(call.navn);
          if (normalizedName) {
            const data = individualDataMap.get(normalizedName) || { totalCallMinutes: 0, totalOutgoingCalls: 0, totalSales: 0, livSales: 0 };
            data.totalCallMinutes += call.min || 0;
            individualDataMap.set(normalizedName, data);
          }
        });

        outgoingCalls.forEach((call) => {
          const normalizedName = normalizeAndTrim(call.navn);
          if (normalizedName) {
            const data = individualDataMap.get(normalizedName) || { totalCallMinutes: 0, totalOutgoingCalls: 0, totalSales: 0, livSales: 0 };
            data.totalCallMinutes += Number.parseInt(call.regular_call_time_min) || 0;
            data.totalOutgoingCalls += Number.parseInt(call.outgoing) || 0;
            individualDataMap.set(normalizedName, data);
          }
        });

        activityLogs.forEach((log) => {
          const normalizedName = normalizeAndTrim(log.name);
          if (normalizedName) {
            const data = individualDataMap.get(normalizedName) || { totalCallMinutes: 0, totalOutgoingCalls: 0, totalSales: 0, livSales: 0 };
            data.totalSales += log.verdi;
            if (log.activity === "2. liv") {
              data.livSales += log.verdi;
            }
            individualDataMap.set(normalizedName, data);
          }
        });

        // Calculate team-level metrics
        teamDetailsMap.forEach((details, team) => {
          const teamData: number[] = [];
          const teamCallEfficiency: number[] = [];
          const teamTotalSales: number[] = [];
          const teamLivRatio: number[] = [];

          details.members.forEach((member) => {
            const data = individualDataMap.get(member);
            if (data && data.totalCallMinutes > CALL_MINUTES_THRESHOLD) {
              teamData.push(data.totalCallMinutes);
              teamCallEfficiency.push(data.totalOutgoingCalls / data.totalCallMinutes);
              teamTotalSales.push(data.totalSales);
              teamLivRatio.push(data.livSales / data.totalSales);
            }
          });

          teamTotalCallMinutesMap.set(team, teamData);
          teamCallEfficiencyMap.set(team, teamCallEfficiency);
          teamTotalSalesMap.set(team, teamTotalSales);
          teamLivRatioMap.set(team, teamLivRatio);
        });

        const teamDetails: TeamDetails[] = Array.from(teamDetailsMap.entries())
          .map(([team, details]) => {
            const avgTotalCallMinutes = teamTotalCallMinutesMap.get(team) || [];
            const avgCallEfficiency = teamCallEfficiencyMap.get(team) || [];
            const avgTotalSales = teamTotalSalesMap.get(team) || [];
            const avgRatioBetweenSkadeAndLiv = teamLivRatioMap.get(team) || [];

            const avgTCM = avgTotalCallMinutes.reduce((a, b) => a + b, 0) / avgTotalCallMinutes.length || 0;
            const avgCE = avgCallEfficiency.reduce((a, b) => a + b, 0) / avgCallEfficiency.length || 0;
            const avgTS = avgTotalSales.reduce((a, b) => a + b, 0) / avgTotalSales.length || 0;
            const avgRBSL = avgRatioBetweenSkadeAndLiv.reduce((a, b) => a + b, 0) / avgRatioBetweenSkadeAndLiv.length || 0;

            const tcmScore = getScoreForValue(avgTCM, tcmScoreMatrix, true);
            const ceScore = getScoreForValue(avgCE, ceScoreMatrix, false);
            const tsScore = getScoreForValue(avgTS, tsScoreMatrix, true);
            const rbslScore = getScoreForValue(avgRBSL, rbslScoreMatrix, true, true);

            // const avgTotalScore = (tcmScore.level + ceScore.level + tsScore.level + rbslScore.level) / 4;

            return {
              team,
              department: details.department,
              avgTotalCallMinutes: formatNumber(avgTCM),
              tcmScore,
              avgCallEfficiency: formatDecimal(avgCE),
              ceScore,
              avgTotalSales: formatNumber(avgTS),
              tsScore,
              avgRatioBetweenSkadeAndLiv: formatRatio(avgRBSL),
              rbslScore,
              month,
            };
          });

        return teamDetails;
      })
    );

    const combinedData = monthlyData.flat();

    return NextResponse.json(
      {
        teams: combinedData,
        metadata: {
          formatVersion: "1.0",
          timestamp: new Date().toISOString(),
          totalRecords: combinedData.length,
          months: months,
          year: year,
        },
      },
      {
        headers: {
          "Cache-Control": "public, max-age=300",
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching and processing team data:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: process.env.NODE_ENV === "development" ? (error as Error).message : undefined,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
