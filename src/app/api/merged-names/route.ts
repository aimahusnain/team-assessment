import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface ScoreLevel {
  level: number;
  score: number | string;
}

interface ScoreMatrix {
  benchmark: number;
  interval: number;
  levels: ScoreLevel[];
}

interface NameDetails {
  name: string;
  team: string | null;
  department: string | null;
  totalCallMinutes: string;
  tcmScore: ScoreLevel;
  callEfficiency: string;
  ceScore: ScoreLevel;
  totalSales: string;
  tsScore: ScoreLevel;
  livRatio: string;
  rbslScore: ScoreLevel;
}

const formatNumber = (num: number): string => {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

const formatDecimal = (num: number): string => {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

const formatRatio = (num: number): string => {
  return (num * 100).toFixed(1) + "%";
};

const safeTrim = (str: string | null | undefined): string => {
  return (str || "").trim();
};

const calculateTCMScore = async (): Promise<ScoreMatrix | null> => {
  const inputs = await prisma.inputs.findFirst();
  if (!inputs) return null;

  const benchmark = inputs.individual_score_tcm_benchmark || 0;
  const interval = inputs.individual_score_tcm_interval || 0;

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

  const benchmark = parseFloat(inputs.individual_score_ce_benchmark || "0");
  const interval = parseFloat(inputs.individual_score_ce_interval || "0");

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

  const benchmark = inputs.individual_score_ts_benchmark || 0;
  const interval = inputs.individual_score_ts_interval || 0;

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

  const benchmark = parseFloat(inputs.individual_score_rbsl_benchmark || "0");
  const interval = parseFloat(inputs.individual_score_rbsl_interval || "0");

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

const getScoreForValue = (
  value: number,
  scoreMatrix: ScoreMatrix | null,
  isDescending = true
): ScoreLevel => {
  if (!scoreMatrix) return { level: 1, score: "-" };

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

export async function GET() {
  try {
    const [activityLogs, incomingCalls, outgoingCalls] = await Promise.all([
      prisma.activityLog.findMany({
        select: {
          name: true,
          team: true,
          department: true,
          verdi: true,
          activity: true,
        },
      }),
      prisma.incomingCalls.findMany({
        select: { navn: true, min: true },
        distinct: ["navn"],
      }),
      prisma.outgoingCalls.findMany({
        select: { navn: true, outgoing: true, regular_call_time_min: true },
      }),
    ]);

    const [tcmScoreMatrix, ceScoreMatrix, tsScoreMatrix, rbslScoreMatrix] =
      await Promise.all([
        calculateTCMScore(),
        calculateCEScore(),
        calculateTSScore(),
        calculateRBSLScore(),
      ]);

    const nameDetailsMap = new Map<
      string,
      { team: string; department: string }
    >();
    const incomingMinutesMap = new Map<string, number>();
    const outgoingMinutesMap = new Map<string, number>();
    const outgoingCallsMap = new Map<string, number>();
    const totalSalesMap = new Map<string, number>();
    const livSalesMap = new Map<string, number>();

    activityLogs.forEach((log) => {
      const trimmedName = safeTrim(log.name);
      if (trimmedName) {
        nameDetailsMap.set(trimmedName, {
          team: log.team,
          department: log.department,
        });

        const currentSales = totalSalesMap.get(trimmedName) || 0;
        totalSalesMap.set(trimmedName, currentSales + log.verdi);

        if (log.activity === "2. liv") {
          const currentLivSales = livSalesMap.get(trimmedName) || 0;
          livSalesMap.set(trimmedName, currentLivSales + log.verdi);
        }
      }
    });

    incomingCalls.forEach((call) => {
      const trimmedName = safeTrim(call.navn);
      if (trimmedName) {
        incomingMinutesMap.set(trimmedName, parseInt(call.min) || 0);
      }
    });

    outgoingCalls.forEach((call) => {
      const trimmedName = safeTrim(call.navn);
      if (trimmedName) {
        const currentMinutes = outgoingMinutesMap.get(trimmedName) || 0;
        const currentCalls = outgoingCallsMap.get(trimmedName) || 0;

        outgoingMinutesMap.set(
          trimmedName,
          currentMinutes + (parseInt(call.regular_call_time_min) || 0)
        );
        outgoingCallsMap.set(
          trimmedName,
          currentCalls + (parseInt(call.outgoing) || 0)
        );
      }
    });

    const allNameDetails: NameDetails[] = [
      ...new Set([
        ...activityLogs.map((log) => safeTrim(log.name)),
        ...incomingCalls.map((call) => safeTrim(call.navn)),
        ...outgoingCalls.map((call) => safeTrim(call.navn)),
      ]),
    ]
      .filter(Boolean)
      .map((name) => {
        const details = nameDetailsMap.get(name);
        const incomingMinutes = incomingMinutesMap.get(name) || 0;
        const outgoingMinutes = outgoingMinutesMap.get(name) || 0;
        const totalCallMinutes = incomingMinutes + outgoingMinutes;
        const totalOutgoingCalls = outgoingCallsMap.get(name) || 0;
        const callEfficiency =
          totalCallMinutes > 0
            ? Number((totalOutgoingCalls / totalCallMinutes).toFixed(2))
            : 0;
        const totalSales = totalSalesMap.get(name) || 0;
        const livSales = livSalesMap.get(name) || 0;
        const livRatio = totalSales > 0 ? Number(livSales / totalSales) : 0;

        return {
          name,
          team: details?.team || null,
          department: details?.department || null,
          totalCallMinutes: formatNumber(totalCallMinutes),
          tcmScore: getScoreForValue(totalCallMinutes, tcmScoreMatrix, true),
          callEfficiency: formatDecimal(callEfficiency),
          ceScore: getScoreForValue(callEfficiency, ceScoreMatrix, false),
          totalSales: formatNumber(totalSales),
          tsScore: getScoreForValue(totalSales, tsScoreMatrix, true),
          livRatio: formatRatio(livRatio),
          rbslScore: getScoreForValue(livRatio, rbslScoreMatrix, true),
        };
      });

    const processedDetails = allNameDetails.sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    return NextResponse.json(
      {
        names: processedDetails,
        metadata: {
          formatVersion: "1.0",
          timestamp: new Date().toISOString(),
          totalRecords: processedDetails.length,
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
    console.error("Error fetching and processing names:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        details:
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : undefined,
      },
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } finally {
    await prisma.$disconnect();
  }
}
