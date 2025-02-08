// api/merged-names/router.ts
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
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
    style: "percent",
  }).format(num);
};

const formatRatio = (num: number): string => {
  return (num * 100).toFixed(1) + "%";
};

// Enhanced name normalization function
const normalizeAndTrim = (str: string | null | undefined): string => {
  if (!str) return "";
  // Remove leading/trailing spaces and replace multiple spaces with single space
  return str.trim().replace(/\s+/g, " ");
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

  const benchmark = Number.parseFloat(
    inputs.individual_score_ce_benchmark || "0"
  );
  const interval = Number.parseFloat(
    inputs.individual_score_ce_interval || "0"
  );

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

  const benchmark = Number.parseFloat(
    inputs.individual_score_rbsl_benchmark || "0"
  );
  const interval = Number.parseFloat(
    inputs.individual_score_rbsl_interval || "0"
  );

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
    // Get query parameters
    const url = new URL(request.url);
    const month = url.searchParams.get("month");
    const year = parseInt(
      url.searchParams.get("year") || new Date().getFullYear().toString()
    );

    const [activityLogs, incomingCalls, outgoingCalls] = await Promise.all([
      prisma.activityLog.findMany({
        where: {
          ...(month && { monthName: month }),
          year: year,
        },
        select: {
          name: true,
          team: true,
          department: true,
          verdi: true,
          activity: true,
          monthName: true,
          year: true,
        },
      }),
      prisma.incomingCalls.findMany({
        where: {
          ...(month && { monthName: month }),
          year: year,
        },
        select: {
          navn: true,
          min: true,
          monthName: true,
          year: true,
        },
      }),
      prisma.outgoingCalls.findMany({
        where: {
          ...(month && { monthName: month }),
          year: year,
        },
        select: {
          navn: true,
          outgoing: true,
          regular_call_time_min: true,
          monthName: true,
          year: true,
        },
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

    // Process activity logs with normalized names
    activityLogs.forEach((log) => {
      const normalizedName = normalizeAndTrim(log.name);
      if (normalizedName) {
        nameDetailsMap.set(normalizedName, {
          team: log.team || "",
          department: log.department || "",
        });

        const currentSales = totalSalesMap.get(normalizedName) || 0;
        totalSalesMap.set(normalizedName, currentSales + log.verdi);

        if (log.activity === "2. liv") {
          const currentLivSales = livSalesMap.get(normalizedName) || 0;
          livSalesMap.set(normalizedName, currentLivSales + log.verdi);
        }
      }
    });

    // Process incoming calls with normalized names
    incomingCalls.forEach((call) => {
      const normalizedName = normalizeAndTrim(call.navn);
      if (normalizedName) {
        const currentMinutes = incomingMinutesMap.get(normalizedName) || 0;
        incomingMinutesMap.set(
          normalizedName,
          currentMinutes + (call.min || 0)
        );
      }
    });

    // Process outgoing calls with normalized names
    outgoingCalls.forEach((call) => {
      const normalizedName = normalizeAndTrim(call.navn);
      if (normalizedName) {
        const currentMinutes = outgoingMinutesMap.get(normalizedName) || 0;
        const currentCalls = outgoingCallsMap.get(normalizedName) || 0;

        outgoingMinutesMap.set(
          normalizedName,
          currentMinutes + (Number.parseInt(call.regular_call_time_min) || 0)
        );
        outgoingCallsMap.set(
          normalizedName,
          currentCalls + (Number.parseInt(call.outgoing) || 0)
        );
      }
    });

    // Create a unified set of normalized names
    const uniqueNames = new Set([
      ...Array.from(nameDetailsMap.keys()),
      ...Array.from(incomingMinutesMap.keys()),
      ...Array.from(outgoingMinutesMap.keys()),
    ]);

    const allNameDetails: NameDetails[] = Array.from(uniqueNames)
      .filter(Boolean)
      .map((name) => {
        const details = nameDetailsMap.get(name);
        const incomingMinutes = incomingMinutesMap.get(name) || 0;
        const outgoingMinutes = outgoingMinutesMap.get(name) || 0;
        const totalCallMinutes = incomingMinutes + outgoingMinutes;
        const totalOutgoingCalls = outgoingCallsMap.get(name) || 0;
        const callEfficiency =
          totalCallMinutes > 0
            ? Number(totalOutgoingCalls / totalCallMinutes)
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
          rbslScore: getScoreForValue(livRatio, rbslScoreMatrix, true, true),
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
