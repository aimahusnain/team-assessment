import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import type { ScoreLevel, ScoreMatrix } from "@/types"
import { formatDecimal, formatNumber, formatRatio } from "@/lib/utils"

interface NameDetails {
  name: string
  team: string | null
  department: string | null
  totalCallMinutes: string
  tcmScore: ScoreLevel
  callEfficiency: string
  ceScore: ScoreLevel
  totalSales: string
  tsScore: ScoreLevel
  livRatio: string
  rbslScore: ScoreLevel
  month: string
  alternativeNames: string
}

const normalizeAndTrim = (str: string | null | undefined): string => {
  if (!str) return ""
  return str.trim().replace(/\s+/g, " ")
}

const calculateTCMScore = async (): Promise<ScoreMatrix | null> => {
  const inputs = await db.inputs.findFirst()
  if (!inputs) return null

  const benchmark = inputs.individual_score_tcm_benchmark || 0
  const interval = inputs.individual_score_tcm_interval || 0

  console.log("Individual TCM Score Calculation:")
  console.log("Benchmark:", benchmark)
  console.log("Interval:", interval)

  return {
    benchmark,
    interval,
    levels: Array.from({ length: 10 }, (_, i) => {
      const level = 10 - i
      if (level === 1) return { level, score: "-" }
      const steps = level - 5
      const score = benchmark + steps * interval
      console.log(`Level ${level}: ${score} (Benchmark ${benchmark} + ${steps} intervals)`)
      return { level, score }
    }),
  }
}

const calculateCEScore = async (): Promise<ScoreMatrix | null> => {
  const inputs = await db.inputs.findFirst()
  if (!inputs) return null

  const benchmark = Number.parseFloat(inputs.individual_score_ce_benchmark || "0") // 35%
  const interval = Number.parseFloat(inputs.individual_score_ce_interval || "0") // 3%

  console.log("Individual CE Score Calculation:")
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
  const inputs = await db.inputs.findFirst()
  if (!inputs) return null

  const benchmark = inputs.individual_score_ts_benchmark || 0
  const interval = inputs.individual_score_ts_interval || 0

  console.log("Individual TS Score Calculation:")
  console.log("Benchmark:", benchmark)
  console.log("Interval:", interval)

  return {
    benchmark,
    interval,
    levels: Array.from({ length: 10 }, (_, i) => {
      const level = 10 - i
      if (level === 1) return { level, score: "-" }
      const steps = level - 5
      const score = benchmark + steps * interval
      console.log(`Level ${level}: ${score} (Benchmark ${benchmark} + ${steps} intervals)`)
      return { level, score }
    }),
  }
}

const calculateRBSLScore = async (): Promise<ScoreMatrix | null> => {
  const inputs = await db.inputs.findFirst()
  if (!inputs) return null

  const benchmark = Number.parseFloat(inputs.individual_score_rbsl_benchmark || "0")
  const interval = Number.parseFloat(inputs.individual_score_rbsl_interval || "0")

  console.log("Individual RBSL Score Calculation:")
  console.log("Benchmark:", benchmark + "%")
  console.log("Interval:", interval + "%")

  return {
    benchmark,
    interval,
    levels: Array.from({ length: 10 }, (_, i) => {
      const level = 10 - i
      let score: number

      if (level === 10) {
        score = benchmark + 5 * interval
        console.log(`Level ${level}: ${score}% (Benchmark ${benchmark}% + 5 intervals)`)
      } else if (level > 5) {
        score = benchmark + (level - 5) * interval
        console.log(`Level ${level}: ${score}% (Benchmark ${benchmark}% + ${level - 5} intervals)`)
      } else if (level === 5) {
        score = benchmark
        console.log(`Level ${level}: ${score}% (Benchmark)`)
      } else if (level === 1) {
        score = 0
        console.log(`Level ${level}: ${score}% (Fixed at 0%)`)
      } else {
        score = benchmark - (5 - level) * interval
        console.log(`Level ${level}: ${score}% (Benchmark ${benchmark}% - ${5 - level} intervals)`)
      }

      return { level, score }
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

  // For CE scores (when isDescending is false)
  if (!isDescending) {
    console.log("\nIndividual CE Score Determination:")
    console.log("Input value:", (value * 100).toFixed(2) + "%")

    // Special case: if value is 0 or very close to 0, return level 10
    if (value === 0 || value < 0.001) {
      console.log("Value is 0 or very small - returning Level 10")
      return { level: 10, score: "0" }
    }

    const valueAsPercent = value * 100
    const sortedLevels = scoreMatrix.levels
      .filter(({ score }) => score !== "-")
      .sort((a, b) => {
        const aScore = Number(a.score)
        const bScore = Number(b.score)
        return bScore - aScore // Sort descending for CE
      })

    console.log("Checking against sorted levels:")
    sortedLevels.forEach(({ level, score }) => {
      console.log(`Level ${level}: ${score}%`)
    })

    // For CE, we want to find the first level where the value is GREATER than the score
    // This gives higher levels (better scores) for lower CE percentages
    const matchedLevel = sortedLevels.find(({ score }) => valueAsPercent > Number(score))
    console.log("Matched level:", matchedLevel?.level || 1)

    return matchedLevel || { level: 1, score: "47" }
  }

  // For RBSL scores
  if (isRBSL) {
    console.log("\nIndividual RBSL Score Determination:")
    console.log("Input value:", (value * 100).toFixed(2) + "%")

    const valueAsPercent = value * 100
    const sortedLevels = scoreMatrix.levels
      .filter(({ score }) => score !== "-")
      .sort((a, b) => {
        const aScore = Number(a.score)
        const bScore = Number(b.score)
        return bScore - aScore
      })

    console.log("Checking against sorted levels:")
    sortedLevels.forEach(({ level, score }) => {
      console.log(`Level ${level}: ${score}%`)
    })

    const matchedLevel = sortedLevels.find(({ score }) => valueAsPercent >= Number(score))
    console.log("Matched level:", matchedLevel?.level || 1)

    return matchedLevel || { level: 1, score: "0" }
  }

  // For TCM and TS scores
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
    const url = new URL(request.url)
    const months = url.searchParams.getAll("months")
    const year = Number.parseInt(url.searchParams.get("year") || new Date().getFullYear().toString())

    // Fetch all alternative name mappings from the dedicated model
    const alternativeNameMappings = await db.alternativeNames.findMany()

    // Create maps for name lookups
    const nameToLookupKeyMap = new Map<string, string>()

    // First, process the AlternativeNames model entries
    alternativeNameMappings.forEach((mapping) => {
      const normalizedName = normalizeAndTrim(mapping.name)
      const normalizedAltName = normalizeAndTrim(mapping.altName)

      if (normalizedName && normalizedAltName) {
        // Always use the shorter name as the primary name (lookup key)
        // This ensures "Gaute Liff" is preferred over "Gaute Eivind Floan Liff"
        const primaryName = normalizedName.length <= normalizedAltName.length ? normalizedName : normalizedAltName

        // Map both names to the primary name as lookup key
        nameToLookupKeyMap.set(normalizedName, primaryName)
        nameToLookupKeyMap.set(normalizedAltName, primaryName)
      }
    })

    // Fetch team and department data without month and year filters
    const allActivityLogs = await db.activityLog.findMany({
      select: {
        name: true,
        alternativeNames: true,
        team: true,
        department: true,
      },
    })

    // Create mappings for team, department, and alternative names
    const nameToTeamDeptMap = new Map<string, { team: string | null; department: string | null }>()
    const lookupKeyToAltNameMap = new Map<string, string | null>()

    // Process activity logs for names not in AlternativeNames model
    allActivityLogs.forEach((log) => {
      const normalizedName = normalizeAndTrim(log.name)
      const normalizedAltName = normalizeAndTrim(log.alternativeNames || "")

      if (normalizedName) {
        // Store team and department info
        nameToTeamDeptMap.set(normalizedName, {
          team: log.team,
          department: log.department,
        })

        // If this name is not already in our lookup map (from AlternativeNames model)
        if (!nameToLookupKeyMap.has(normalizedName)) {
          // If it has an alternative name in the activity log
          if (normalizedAltName) {
            // Always use the shorter name as the primary name (lookup key)
            const primaryName = normalizedName.length <= normalizedAltName.length ? normalizedName : normalizedAltName
            const altName = normalizedName.length <= normalizedAltName.length ? normalizedAltName : normalizedName

            // Map both names to the primary name as lookup key
            nameToLookupKeyMap.set(normalizedName, primaryName)
            nameToLookupKeyMap.set(normalizedAltName, primaryName)

            // Store the alternative name for this lookup key
            lookupKeyToAltNameMap.set(primaryName, altName)
          } else {
            // No alternative name, use itself as lookup key
            nameToLookupKeyMap.set(normalizedName, normalizedName)
          }
        }
      }
    })

    // Now process the AlternativeNames model again to store alternative names for lookup keys
    alternativeNameMappings.forEach((mapping) => {
      const normalizedName = normalizeAndTrim(mapping.name)
      const normalizedAltName = normalizeAndTrim(mapping.altName)

      if (normalizedName && normalizedAltName) {
        // Get the lookup key for this name (which we determined earlier)
        const lookupKey = nameToLookupKeyMap.get(normalizedName)

        if (lookupKey) {
          // The alternative name is the one that's not the lookup key
          const altName = lookupKey === normalizedName ? normalizedAltName : normalizedName
          lookupKeyToAltNameMap.set(lookupKey, altName)
        }
      }
    })

    const monthlyData = await Promise.all(
      months.map(async (month) => {
        const [activityLogs, incomingCalls, outgoingCalls] = await Promise.all([
          db.activityLog.findMany({
            where: { monthName: month, year },
            select: {
              name: true,
              verdi: true,
              activity: true,
              alternativeNames: true,
            },
          }),
          db.incomingCalls.findMany({
            where: { monthName: month, year },
            select: {
              navn: true,
              min: true,
            },
          }),
          db.outgoingCalls.findMany({
            where: { monthName: month, year },
            select: {
              navn: true,
              outgoing: true,
              regular_call_time_min: true,
            },
          }),
        ])

        const [tcmScoreMatrix, ceScoreMatrix, tsScoreMatrix, rbslScoreMatrix] = await Promise.all([
          calculateTCMScore(),
          calculateCEScore(),
          calculateTSScore(),
          calculateRBSLScore(),
        ])

        // Maps to store aggregated data by lookup key
        const incomingMinutesMap = new Map<string, number>()
        const outgoingMinutesMap = new Map<string, number>()
        const outgoingCallsMap = new Map<string, number>()
        const totalSalesMap = new Map<string, number>()
        const livSalesMap = new Map<string, number>()

        // Process activity logs using lookup keys
        activityLogs.forEach((log) => {
          const normalizedName = normalizeAndTrim(log.name)
          if (normalizedName) {
            // Get the lookup key for this name
            const lookupKey = nameToLookupKeyMap.get(normalizedName) || normalizedName

            const currentSales = totalSalesMap.get(lookupKey) || 0
            totalSalesMap.set(lookupKey, currentSales + log.verdi)

            if (log.activity === "2. liv") {
              const currentLivSales = livSalesMap.get(lookupKey) || 0
              livSalesMap.set(lookupKey, currentLivSales + log.verdi)
            }
          }
        })

        // Process incoming calls using lookup keys
        incomingCalls.forEach((call) => {
          const normalizedName = normalizeAndTrim(call.navn)
          if (normalizedName) {
            // Get the lookup key for this name
            const lookupKey = nameToLookupKeyMap.get(normalizedName) || normalizedName

            const currentMinutes = incomingMinutesMap.get(lookupKey) || 0
            incomingMinutesMap.set(lookupKey, currentMinutes + (call.min || 0))
          }
        })

        // Process outgoing calls using lookup keys
        outgoingCalls.forEach((call) => {
          const normalizedName = normalizeAndTrim(call.navn)
          if (normalizedName) {
            // Get the lookup key for this name
            const lookupKey = nameToLookupKeyMap.get(normalizedName) || normalizedName

            const currentMinutes = outgoingMinutesMap.get(lookupKey) || 0
            const currentCalls = outgoingCallsMap.get(lookupKey) || 0

            outgoingMinutesMap.set(lookupKey, currentMinutes + (Number.parseInt(call.regular_call_time_min) || 0))
            outgoingCallsMap.set(lookupKey, currentCalls + (Number.parseInt(call.outgoing) || 0))
          }
        })

        // Get unique lookup keys from all data sources
        const uniqueLookupKeys = new Set([
          ...Array.from(nameToLookupKeyMap.values()),
          ...Array.from(incomingMinutesMap.keys()),
          ...Array.from(outgoingMinutesMap.keys()),
          ...Array.from(totalSalesMap.keys()),
        ])

        // Process the data for each unique lookup key
        const monthDetails: NameDetails[] = Array.from(uniqueLookupKeys)
          .filter(Boolean)
          .map((lookupKey) => {
            const teamDept = nameToTeamDeptMap.get(lookupKey) || { team: null, department: null }
            const alternativeName = lookupKeyToAltNameMap.get(lookupKey) || null

            const incomingMinutes = incomingMinutesMap.get(lookupKey) || 0
            const outgoingMinutes = outgoingMinutesMap.get(lookupKey) || 0
            const totalCallMinutes = incomingMinutes + outgoingMinutes
            const totalOutgoingCalls = outgoingCallsMap.get(lookupKey) || 0
            const callEfficiency = totalCallMinutes > 0 ? Number(totalOutgoingCalls / totalCallMinutes) : 0
            const totalSales = totalSalesMap.get(lookupKey) || 0
            const livSales = livSalesMap.get(lookupKey) || 0
            const livRatio = totalSales > 0 ? Number(livSales / totalSales) : 0

            return {
              name: lookupKey,
              team: teamDept.team,
              department: teamDept.department,
              totalCallMinutes: formatNumber(totalCallMinutes),
              tcmScore: getScoreForValue(totalCallMinutes, tcmScoreMatrix, true),
              callEfficiency: formatDecimal(callEfficiency),
              ceScore: getScoreForValue(callEfficiency, ceScoreMatrix, false),
              totalSales: formatNumber(totalSales),
              tsScore: getScoreForValue(totalSales, tsScoreMatrix, true),
              livRatio: formatRatio(livRatio),
              rbslScore: getScoreForValue(livRatio, rbslScoreMatrix, true, true),
              month,
              alternativeNames: alternativeName || lookupKey, // Use the name itself when alternative name is null
            }
          })

        return monthDetails
      }),
    )

    const combinedData = monthlyData.flat()

    return NextResponse.json(
      {
        names: combinedData,
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
    console.error("Error fetching and processing names:", error)
    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: process.env.NODE_ENV === "development" ? (error as Error).message : undefined,
      },
      { status: 500 },
    )
  }
}

