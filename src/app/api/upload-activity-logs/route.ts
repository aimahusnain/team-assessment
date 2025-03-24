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

    // Create a lookup map for quick access
    const nameMap = new Map()
    alternativeNameMappings.forEach((mapping) => {
      // Map in both directions for easy lookup
      nameMap.set(mapping.name, mapping.altName)
      nameMap.set(mapping.altName, mapping.name)
    })

    // Process each log and apply alternative name mappings
    const processedLogs = validLogs.map((log) => {
      const originalName = log.name

      // Check if this name has an alternative mapping
      if (nameMap.has(originalName)) {
        // Set the alternative name
        return {
          ...log,
          alternativeNames: nameMap.get(originalName),
        }
      }

      return log
    })

    // Process in batches as in the original code
    const batchSize = 20
    let totalCreated = 0

    // Process in batches
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

