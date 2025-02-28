import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import type { ScoreLevel, ScoreMatrix } from "@/types"
import { formatDecimal, formatNumber, formatRatio } from "@/lib/utils"

// Constants
const CALL_MINUTES_THRESHOLD = 750
const prisma = new PrismaClient()

// Types
interface TeamMemberDetails {
  name: string
  totalSales: number
  formattedTotalSales: string
}

interface TeamDetails {
  team: string
  department: string | null
  avgTotalCallMinutes: string
  tcmScore: ScoreLevel
  avgCallEfficiency: string
  ceScore: ScoreLevel
  avgTotalSales: string
  tsScore: ScoreLevel
  avgRatioBetweenSkadeAndLiv: string
  rbslScore: ScoreLevel
  month: string
  members: TeamMemberDetails[]
  teamTotalSales: string
}

interface IndividualData {
  totalCallMinutes: number
  totalOutgoingCalls: number
  totalSales: number
  livSales: number
}

interface TeamMetrics {
  department: string
  members: Set<string>
}

/**
 * Utility Functions
 */
const normalizeAndTrim = (str: string | null | undefined): string => {
  if (!str) return ""
  return str.trim().replace(/\s+/g, " ")
}

/**
 * Score Matrix Calculation Functions
 */
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

  const benchmark = Number.parseFloat(inputs.team_score_ce_benchmark || "0") // 35%
  const interval = Number.parseFloat(inputs.team_score_ce_interval || "0") // 3%

  console.log("CE Score Calculation:")
  console.log("Benchmark:", benchmark + "%")
  console.log("Interval:", interval + "%")

  return {
    benchmark,
    interval,
    levels: Array.from({ length: 10 }, (_, i) => {
      const level = 10 - i
      let score: number

      if (level === 10) {
        score = 0 // Level 10 is always 0%
        console.log(`Level ${level}: ${score}% (Fixed at 0%)`)
      } else if (level > 5) {
        // For levels 6-9: Subtract interval for each level above 5
        score = benchmark - (level - 5) * interval
        console.log(`Level ${level}: ${score}% (Benchmark ${benchmark}% - ${level - 5} intervals)`)
      } else if (level === 5) {
        score = benchmark // Level 5 is benchmark
        console.log(`Level ${level}: ${score}% (Benchmark)`)
      } else {
        // For levels 1-4: Add interval for each level below 5
        score = benchmark + (5 - level) * interval
        console.log(`Level ${level}: ${score}% (Benchmark ${benchmark}% + ${5 - level} intervals)`)
      }

      return { level, score }
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

/**
 * Score Calculation Helper
 */
const getScoreForValue = (
  value: number,
  scoreMatrix: ScoreMatrix | null,
  isDescending = true,
  isRBSL = false,
): ScoreLevel => {
  if (!scoreMatrix) return { level: 1, score: "-" }

  // For CE scores (when isDescending is false)
  if (!isDescending) {
    console.log("\nCE Score Determination:")
    console.log("Input value:", (value * 100).toFixed(2) + "%")

    const valueAsPercent = value * 100
    const sortedLevels = scoreMatrix.levels
      .filter(({ score }) => score !== "-")
      .sort((a, b) => {
        const aScore = Number(a.score)
        const bScore = Number(b.score)
        return aScore - bScore // Sort ascending for CE
      })

    console.log("Checking against sorted levels:")
    sortedLevels.forEach(({ level, score }) => {
      console.log(`Level ${level}: ${score}%`)
    })

    const matchedLevel = sortedLevels.find(({ score }) => valueAsPercent <= Number(score))
    console.log("Matched level:", matchedLevel?.level || 1)

    return matchedLevel || { level: 1, score: "47" }
  }

  // Original logic for other scores...
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



/**
 * Data Processing Functions
 */
const processActivityLogs = (
  activityLogs: any[],
  teamDetailsMap: Map<string, TeamMetrics>,
  teamMembersMap: Map<string, Map<string, number>>,
  individualDataMap: Map<string, IndividualData>,
) => {
  activityLogs.forEach((log) => {
    const normalizedName = normalizeAndTrim(log.name)
    const normalizedTeam = normalizeAndTrim(log.team)

    // Process team details
    if (normalizedName && normalizedTeam) {
      if (!teamDetailsMap.has(normalizedTeam)) {
        teamDetailsMap.set(normalizedTeam, {
          department: log.department || "",
          members: new Set(),
        })
        teamMembersMap.set(normalizedTeam, new Map<string, number>())
      }

      teamDetailsMap.get(normalizedTeam)!.members.add(normalizedName)

      // Track individual sales within teams
      const memberSalesMap = teamMembersMap.get(normalizedTeam)!
      const currentSales = memberSalesMap.get(normalizedName) || 0
      memberSalesMap.set(normalizedName, currentSales + log.verdi)
    }

    // Process individual data
    if (normalizedName) {
      const data = individualDataMap.get(normalizedName) || {
        totalCallMinutes: 0,
        totalOutgoingCalls: 0,
        totalSales: 0,
        livSales: 0,
      }

      data.totalSales += log.verdi
      if (log.activity === "2. liv") {
        data.livSales += log.verdi
      }

      individualDataMap.set(normalizedName, data)
    }
  })
}

const processIncomingCalls = (incomingCalls: any[], individualDataMap: Map<string, IndividualData>) => {
  incomingCalls.forEach((call) => {
    const normalizedName = normalizeAndTrim(call.navn)
    if (normalizedName) {
      const data = individualDataMap.get(normalizedName) || {
        totalCallMinutes: 0,
        totalOutgoingCalls: 0,
        totalSales: 0,
        livSales: 0,
      }

      data.totalCallMinutes += call.min || 0
      individualDataMap.set(normalizedName, data)
    }
  })
}

const processOutgoingCalls = (outgoingCalls: any[], individualDataMap: Map<string, IndividualData>) => {
  outgoingCalls.forEach((call) => {
    const normalizedName = normalizeAndTrim(call.navn)
    if (normalizedName) {
      const data = individualDataMap.get(normalizedName) || {
        totalCallMinutes: 0,
        totalOutgoingCalls: 0,
        totalSales: 0,
        livSales: 0,
      }

      data.totalCallMinutes += Number.parseInt(call.regular_call_time_min) || 0
      data.totalOutgoingCalls += Number.parseInt(call.outgoing) || 0
      individualDataMap.set(normalizedName, data)
    }
  })
}

const calculateTeamMetrics = (
  teamDetailsMap: Map<string, TeamMetrics>,
  individualDataMap: Map<string, IndividualData>,
) => {
  const teamTotalCallMinutesMap = new Map<string, number[]>()
  const teamCallEfficiencyMap = new Map<string, number[]>()
  const teamTotalSalesMap = new Map<string, number[]>()
  const teamLivRatioMap = new Map<string, number[]>()

  teamDetailsMap.forEach((details, team) => {
    const teamData: number[] = []
    const teamCallEfficiency: number[] = []
    const teamTotalSales: number[] = []
    const teamLivRatio: number[] = []

    details.members.forEach((member) => {
      const data = individualDataMap.get(member)
      if (data && data.totalCallMinutes > CALL_MINUTES_THRESHOLD) {
        teamData.push(data.totalCallMinutes)
        teamCallEfficiency.push(data.totalOutgoingCalls / data.totalCallMinutes)
        teamTotalSales.push(data.totalSales)
        teamLivRatio.push(data.livSales / data.totalSales)
      }
    })

    teamTotalCallMinutesMap.set(team, teamData)
    teamCallEfficiencyMap.set(team, teamCallEfficiency)
    teamTotalSalesMap.set(team, teamTotalSales)
    teamLivRatioMap.set(team, teamLivRatio)
  })

  return {
    teamTotalCallMinutesMap,
    teamCallEfficiencyMap,
    teamTotalSalesMap,
    teamLivRatioMap,
  }
}

const calculateTeamDetails = (
  teamDetailsMap: Map<string, TeamMetrics>,
  teamMembersMap: Map<string, Map<string, number>>,
  teamMetrics: {
    teamTotalCallMinutesMap: Map<string, number[]>
    teamCallEfficiencyMap: Map<string, number[]>
    teamTotalSalesMap: Map<string, number[]>
    teamLivRatioMap: Map<string, number[]>
  },
  scoreMatrices: {
    tcmScoreMatrix: ScoreMatrix | null
    ceScoreMatrix: ScoreMatrix | null
    tsScoreMatrix: ScoreMatrix | null
    rbslScoreMatrix: ScoreMatrix | null
  },
  month: string,
): TeamDetails[] => {
  const { teamTotalCallMinutesMap, teamCallEfficiencyMap, teamTotalSalesMap, teamLivRatioMap } = teamMetrics

  const { tcmScoreMatrix, ceScoreMatrix, tsScoreMatrix, rbslScoreMatrix } = scoreMatrices

  return Array.from(teamDetailsMap.entries()).map(([team, details]) => {
    const avgTotalCallMinutes = teamTotalCallMinutesMap.get(team) || []
    const avgCallEfficiency = teamCallEfficiencyMap.get(team) || []
    const avgTotalSales = teamTotalSalesMap.get(team) || []
    const avgRatioBetweenSkadeAndLiv = teamLivRatioMap.get(team) || []

    // Calculate averages
    const avgTCM =
      avgTotalCallMinutes.length > 0 ? avgTotalCallMinutes.reduce((a, b) => a + b, 0) / avgTotalCallMinutes.length : 0

    const avgCE =
      avgCallEfficiency.length > 0 ? avgCallEfficiency.reduce((a, b) => a + b, 0) / avgCallEfficiency.length : 0

    const avgTS = avgTotalSales.length > 0 ? avgTotalSales.reduce((a, b) => a + b, 0) / avgTotalSales.length : 0

    const avgRBSL =
      avgRatioBetweenSkadeAndLiv.length > 0
        ? avgRatioBetweenSkadeAndLiv.reduce((a, b) => a + b, 0) / avgRatioBetweenSkadeAndLiv.length
        : 0

    // Calculate scores
    const tcmScore = getScoreForValue(avgTCM, tcmScoreMatrix, true)
    const ceScore = getScoreForValue(avgCE, ceScoreMatrix, false)
    const tsScore = getScoreForValue(avgTS, tsScoreMatrix, true)
    const rbslScore = getScoreForValue(avgRBSL, rbslScoreMatrix, true, true)

    // Get individual member sales data
    const memberSalesMap = teamMembersMap.get(team) || new Map<string, number>()
    const members: TeamMemberDetails[] = Array.from(memberSalesMap.entries())
      .map(([name, sales]) => ({
        name,
        totalSales: sales,
        formattedTotalSales: formatNumber(sales),
      }))
      .sort((a, b) => b.totalSales - a.totalSales) // Sort by sales descending

    // Calculate team total sales (sum of all members)
    const teamTotalSales = members.reduce((sum, member) => sum + member.totalSales, 0)

    // Calculate TS as the average of all members' sales
    const ts = members.length > 0 ? teamTotalSales / members.length : 0

    return {
      team,
      department: details.department,
      avgTotalCallMinutes: formatNumber(avgTCM),
      tcmScore,
      avgCallEfficiency: formatDecimal(avgCE),
      ceScore,
      avgTotalSales: formatNumber(ts),
      tsScore: getScoreForValue(ts, tsScoreMatrix, true),
      avgRatioBetweenSkadeAndLiv: formatRatio(avgRBSL),
      rbslScore,
      month,
      members,
      teamTotalSales: formatNumber(teamTotalSales),
    }
  })
}

/**
 * Main API Handler
 */
export async function GET(request: Request) {
  try {
    // Parse request parameters
    const url = new URL(request.url)
    const months = url.searchParams.getAll("months")
    const year = Number.parseInt(url.searchParams.get("year") || new Date().getFullYear().toString())

    // Calculate score matrices (only once for all months)
    const [tcmScoreMatrix, ceScoreMatrix, tsScoreMatrix, rbslScoreMatrix] = await Promise.all([
      calculateTCMScore(),
      calculateCEScore(),
      calculateTSScore(),
      calculateRBSLScore(),
    ])

    const scoreMatrices = { tcmScoreMatrix, ceScoreMatrix, tsScoreMatrix, rbslScoreMatrix }

    // Process data for each month in parallel
    const monthlyData = await Promise.all(
      months.map(async (month) => {
        // Fetch data for the month
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
        ])

        // Initialize data structures
        const teamDetailsMap = new Map<string, TeamMetrics>()
        const teamMembersMap = new Map<string, Map<string, number>>()
        const individualDataMap = new Map<string, IndividualData>()

        // Process data
        processActivityLogs(activityLogs, teamDetailsMap, teamMembersMap, individualDataMap)
        processIncomingCalls(incomingCalls, individualDataMap)
        processOutgoingCalls(outgoingCalls, individualDataMap)

        // Calculate team metrics
        const teamMetrics = calculateTeamMetrics(teamDetailsMap, individualDataMap)

        // Calculate final team details
        return calculateTeamDetails(teamDetailsMap, teamMembersMap, teamMetrics, scoreMatrices, month)
      }),
    )

    // Combine data from all months
    const combinedData = monthlyData.flat()

    // Return response
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
      },
    )
  } catch (error) {
    console.error("Error fetching and processing team data:", error)
    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: process.env.NODE_ENV === "development" ? (error as Error).message : undefined,
      },
      { status: 500 },
    )
  } finally {
    await prisma.$disconnect()
  }
}