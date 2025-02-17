import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CALL_MINUTES_THRESHOLD = 750;

interface CompanyDetails {
  avgTotalCallMinutes: string;
  tcmScore: ScoreLevel;
  avgCallEfficiency: string;
  ceScore: ScoreLevel;
  avgTotalSales: string;
  tsScore: ScoreLevel;
  avgRatioBetweenSkadeAndLiv: string;
  rbslScore: ScoreLevel;
  avgTotalScore: number;
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

const calculateTCMScore = async (): Promise<ScoreMatrix | null> => {
  const inputs = await prisma.inputs.findFirst()
  if (!inputs) return null

  const benchmark = inputs.team_score_tcm_benchmark || 0
  const interval = inputs.team_score_tcm_interval || 0

  return {
    benchmark,
    interval,
    levels: Array.from({ length: 10 }, (_, i) => {
      const level = 10 - i
      if (level === 1) return { level, score: "-" }
      const steps = level - 5
      const score = benchmark + steps * interval
      return { level, score }
    }),
  }
}

const calculateCEScore = async (): Promise<ScoreMatrix | null> => {
  const inputs = await prisma.inputs.findFirst()
  if (!inputs) return null

  const benchmark = Number.parseFloat(inputs.team_score_ce_benchmark || "0")
  const interval = Number.parseFloat(inputs.team_score_ce_interval || "0")

  return {
    benchmark,
    interval,
    levels: Array.from({ length: 10 }, (_, i) => {
      const level = 10 - i
      if (level === 10) return { level, score: 0 }
      if (level > 5) {
        return { level, score: benchmark - (level - 5) * interval }
      }
      if (level === 5) return { level, score: benchmark }
      return { level, score: benchmark + (5 - level) * interval }
    }),
  }
}

const calculateTSScore = async (): Promise<ScoreMatrix | null> => {
  const inputs = await prisma.inputs.findFirst()
  if (!inputs) return null

  const benchmark = inputs.team_score_ts_benchmark || 0
  const interval = inputs.team_score_ts_interval || 0

  return {
    benchmark,
    interval,
    levels: Array.from({ length: 10 }, (_, i) => {
      const level = 10 - i
      if (level === 1) return { level, score: "-" }
      const steps = level - 5
      const score = benchmark + steps * interval
      return { level, score }
    }),
  }
}

const calculateRBSLScore = async (): Promise<ScoreMatrix | null> => {
  const inputs = await prisma.inputs.findFirst()
  if (!inputs) return null

  const benchmark = Number.parseFloat(inputs.team_score_rbsl_benchmark || "0")
  const interval = Number.parseFloat(inputs.team_score_rbsl_interval || "0")

  return {
    benchmark,
    interval,
    levels: Array.from({ length: 10 }, (_, i) => {
      const level = 10 - i
      if (level === 10) {
        return { level, score: benchmark + 5 * interval }
      } else if (level > 5) {
        return { level, score: benchmark + (level - 5) * interval }
      } else if (level === 5) {
        return { level, score: benchmark }
      } else if (level === 1) {
        return { level, score: 0 }
      } else {
        return { level, score: benchmark - (5 - level) * interval }
      }
    }),
  }
}

const getScoreForValue = (
  value: number,
  scoreMatrix: ScoreMatrix | null,
  isDescending = true,
  isRBSL = false,
): ScoreLevel => {
  if (!scoreMatrix) return { level: 1, score: "-" }

  if (isRBSL) {
    const valueAsPercent = value * 100
    const sortedLevels = scoreMatrix.levels
      .filter(({ score }) => score !== "-")
      .sort((a, b) => {
        const aScore = Number(a.score)
        const bScore = Number(b.score)
        return bScore - aScore
      })

    const matchedLevel = sortedLevels.find(({ score }) => valueAsPercent >= Number(score))
    return matchedLevel || { level: 1, score: "0" }
  }

  const sortedLevels = scoreMatrix.levels
    .filter(({ score }) => score !== "-")
    .sort((a, b) => {
      const aScore = Number(a.score)
      const bScore = Number(b.score)
      return isDescending ? bScore - aScore : aScore - bScore
    })

  const matchedLevel = sortedLevels.find(({ score }) =>
    isDescending ? value >= Number(score) : value <= Number(score),
  )

  return matchedLevel || { level: 1, score: "-" }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const months = url.searchParams.getAll("months");
    const year = Number.parseInt(
      url.searchParams.get("year") || new Date().getFullYear().toString()
    );

    const [tcmScoreMatrix, ceScoreMatrix, tsScoreMatrix, rbslScoreMatrix] =
      await Promise.all([
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

        const individualDataMap = new Map<
          string,
          {
            totalCallMinutes: number;
            totalOutgoingCalls: number;
            totalSales: number;
            livSales: number;
            skadeSales: number;
          }
        >();

        // Process incoming and outgoing calls
        [...incomingCalls, ...outgoingCalls].forEach((call) => {
          const normalizedName = call.navn.trim().replace(/\s+/g, " ");
          const data = individualDataMap.get(normalizedName) || {
            totalCallMinutes: 0,
            totalOutgoingCalls: 0,
            totalSales: 0,
            livSales: 0,
            skadeSales: 0,
          };

          if ("min" in call) {
            data.totalCallMinutes += call.min || 0;
          } else {
            data.totalCallMinutes +=
              Number.parseInt(call.regular_call_time_min) || 0;
            data.totalOutgoingCalls += Number.parseInt(call.outgoing) || 0;
          }

          individualDataMap.set(normalizedName, data);
        });

        // Process activity logs
        activityLogs.forEach((log) => {
          const normalizedName = log.name.trim().replace(/\s+/g, " ");
          const data = individualDataMap.get(normalizedName) || {
            totalCallMinutes: 0,
            totalOutgoingCalls: 0,
            totalSales: 0,
            livSales: 0,
            skadeSales: 0,
          };

          const value = log.verdi || 0;
          data.totalSales += value;
          
          if (log.activity === "2. liv") {
            data.livSales += value;
          } else if (log.activity === "1. skade") {
            data.skadeSales += value;
          }

          individualDataMap.set(normalizedName, data);
        });

        // Calculate company-level metrics for qualified individuals (> 750 minutes)
        const qualifiedData = Array.from(individualDataMap.values()).filter(
          (data) => data.totalCallMinutes > CALL_MINUTES_THRESHOLD
        );

        const avgTotalCallMinutes =
          qualifiedData.reduce((sum, data) => sum + data.totalCallMinutes, 0) /
          qualifiedData.length;

        const avgCallEfficiency =
          qualifiedData.reduce(
            (sum, data) => sum + data.totalOutgoingCalls / data.totalCallMinutes,
            0
          ) / qualifiedData.length;

        const avgTotalSales =
          qualifiedData.reduce((sum, data) => sum + data.totalSales, 0) /
          qualifiedData.length;

        // Calculate ratio between Skade and Liv
        const totalLivSales = qualifiedData.reduce((sum, data) => sum + data.livSales, 0);
        const totalSkadeSales = qualifiedData.reduce((sum, data) => sum + data.skadeSales, 0);
        const avgRatioBetweenSkadeAndLiv = totalSkadeSales > 0 ? totalLivSales / totalSkadeSales : 0;

        const tcmScore = getScoreForValue(avgTotalCallMinutes, tcmScoreMatrix, true);
        const ceScore = getScoreForValue(avgCallEfficiency, ceScoreMatrix, false);
        const tsScore = getScoreForValue(avgTotalSales, tsScoreMatrix, true);
        const rbslScore = getScoreForValue(
          avgRatioBetweenSkadeAndLiv,
          rbslScoreMatrix,
          true,
          true
        );

        const avgTotalScore =
          (tcmScore.level + ceScore.level + tsScore.level + rbslScore.level) / 4;

        return {
          avgTotalCallMinutes: formatNumber(avgTotalCallMinutes),
          tcmScore,
          avgCallEfficiency: formatDecimal(avgCallEfficiency),
          ceScore,
          avgTotalSales: formatNumber(avgTotalSales),
          tsScore,
          avgRatioBetweenSkadeAndLiv: formatRatio(avgRatioBetweenSkadeAndLiv),
          rbslScore,
          avgTotalScore,
          month,
        };
      })
    );

    return NextResponse.json(
      {
        company: monthlyData,
        metadata: {
          formatVersion: "1.0",
          timestamp: new Date().toISOString(),
          totalRecords: monthlyData.length,
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
    console.error("Error fetching and processing company data:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        details:
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : undefined,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}