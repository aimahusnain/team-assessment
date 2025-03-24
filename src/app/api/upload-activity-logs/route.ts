import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST(req: Request) {
  try {
    const { logs } = await req.json()

    if (!logs || !Array.isArray(logs) || logs.length === 0) {
      return NextResponse.json({ success: false, message: "No valid logs provided" }, { status: 400 })
    }

    // Filter out invalid entries
    const validLogs = logs.filter((log) => {
      // Check if log has all required fields and they're not empty
      return log && log.name && log.team && log.activity && log.verdi && log.department && log.year && log.monthName
    })

    if (validLogs.length === 0) {
      return NextResponse.json({ success: false, message: "No valid logs found after filtering" }, { status: 400 })
    }

    // Fetch all alternative name mappings
    const alternativeNameMappings = await db.alternativeNames.findMany()

    // Create lookup maps for quick access
    const nameToAltMap = new Map()
    const altToNameMap = new Map()

    alternativeNameMappings.forEach((mapping) => {
      // Store mappings in both directions but in separate maps to maintain correct ordering
      nameToAltMap.set(mapping.name, mapping.altName)
      altToNameMap.set(mapping.altName, mapping.name)
    })

    // Process each log and apply alternative name mappings with correct ordering
    const processedLogs = validLogs.map((log) => {
      const originalName = log.name
      const originalAltName = log.alternativeNames || ""
      let finalName = originalName
      let finalAltName = originalAltName

      // Case 1: Primary name is in the 'name' column of AlternativeNames
      if (nameToAltMap.has(originalName)) {
        finalAltName = nameToAltMap.get(originalName)
      }
      // Case 2: Primary name is in the 'altName' column of AlternativeNames
      else if (altToNameMap.has(originalName)) {
        // Swap the names to maintain consistency
        finalName = altToNameMap.get(originalName)
        finalAltName = originalName
      }
      // Case 3: Alternative name is in the 'name' column of AlternativeNames
      else if (originalAltName && nameToAltMap.has(originalAltName)) {
        // Swap the names to maintain consistency
        finalName = originalAltName
        finalAltName = originalName
      }
      // Case 4: Alternative name is in the 'altName' column of AlternativeNames
      else if (originalAltName && altToNameMap.has(originalAltName)) {
        finalName = altToNameMap.get(originalAltName)
        finalAltName = originalAltName
      }

      return {
        ...log,
        name: finalName,
        alternativeNames: finalAltName,
      }
    })

    // Process in batches
    const batchSize = 20
    let totalCreated = 0

    for (let i = 0; i < processedLogs.length; i += batchSize) {
      const batch = processedLogs.slice(i, i + batchSize)

      try {
        // Try to use createMany without the skipDuplicates option
        const result = await db.activityLog.createMany({
          data: batch.map((log) => ({
            name: log.name,
            alternativeNames: log.alternativeNames,
            team: log.team,
            activity: log.activity,
            verdi: Number.parseInt(log.verdi.toString()),
            department: log.department,
            year: Number.parseInt(log.year.toString()),
            monthName: log.monthName,
          })),
        })

        totalCreated += result.count
      } catch (batchError) {
        console.log("Batch createMany failed, falling back to individual creates:", batchError)

        // Fallback: create records one by one if createMany fails
        for (const log of batch) {
          try {
            await db.activityLog.create({
              data: {
                name: log.name,
                alternativeNames: log.alternativeNames,
                team: log.team,
                activity: log.activity,
                verdi: Number.parseInt(log.verdi.toString()),
                department: log.department,
                year: Number.parseInt(log.year.toString()),
                monthName: log.monthName,
              },
            })
            totalCreated++
          } catch (createError) {
            // Skip duplicate entries or log other errors
            console.log("Error creating individual log:", createError)
          }
        }
      }
    }

    // If some logs were filtered out, include that in the response
    const filteredCount = logs.length - validLogs.length
    const message =
      filteredCount > 0
        ? `Successfully created ${totalCreated} activity logs. ${filteredCount} invalid entries were skipped.`
        : `Successfully created ${totalCreated} activity logs`

    return NextResponse.json({
      success: true,
      count: totalCreated,
      message,
      skipped: filteredCount,
    })
  } catch (error) {
    console.error("Error uploading activity logs:", error)
    return NextResponse.json({ success: false, message: "Failed to upload activity logs" }, { status: 500 })
  }
}

