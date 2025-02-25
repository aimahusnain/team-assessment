import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function POST(req: Request) {
  try {
    const { logs } = await req.json()
    let successCount = 0
    const batchSize = 20

    // Process logs in batches of 20
    for (let i = 0; i < logs.length; i += batchSize) {
      const batch = logs.slice(i, i + batchSize)

      try {
        // Try to create multiple records at once
        await prisma.activityLog.createMany({
          data: batch.map((log:any) => ({
            name: log.name,
            team: log.team,
            activity: log.activity,
            verdi: Number.parseInt(log.verdi),
            department: log.department,
            year: Number.parseInt(log.year),
            monthName: log.monthName,
          })),
        })
        successCount += batch.length
      } catch (error) {
        console.error("Batch insert failed, falling back to individual inserts:", error)

        // Fallback: Try to insert records one by one
        for (const log of batch) {
          try {
            await prisma.activityLog.create({
              data: {
                name: log.name,
                team: log.team,
                activity: log.activity,
                verdi: Number.parseInt(log.verdi),
                department: log.department,
                year: Number.parseInt(log.year),
                monthName: log.monthName,
              },
            })
            successCount++
          } catch (error) {
            console.error("Failed to insert individual record:", error)
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      count: successCount,
      message: `Successfully added ${successCount} out of ${logs.length} activity logs`,
    })
  } catch (error) {
    console.error("Error uploading activity logs:", error)
    return NextResponse.json({ success: false, message: "Failed to upload activity logs" }, { status: 500 })
  }
}