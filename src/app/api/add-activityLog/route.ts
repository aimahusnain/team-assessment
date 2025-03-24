import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST(req: Request) {
  try {
    const data = await req.json()

    // Check if the name or alternativeNames exist in the AlternativeNames model
    let primaryName = data.name
    let altName = data.alternativeNames || ""

    // Check if either name exists in the AlternativeNames model
    const nameMapping = await db.alternativeNames.findFirst({
      where: {
        OR: [{ name: primaryName }, { altName: primaryName }],
      },
    })

    // If the primary name is found in the mapping
    if (nameMapping) {
      if (nameMapping.name === primaryName) {
        // If it's in the name column, use the altName from the mapping
        altName = nameMapping.altName
      } else {
        // If it's in the altName column, swap them to maintain consistency
        altName = primaryName
        primaryName = nameMapping.name
      }
    } else if (altName) {
      // Check if the alternative name exists in the mapping
      const altNameMapping = await db.alternativeNames.findFirst({
        where: {
          OR: [{ name: altName }, { altName: altName }],
        },
      })

      if (altNameMapping) {
        if (altNameMapping.name === altName) {
          // If it's in the name column, swap them to maintain consistency
          const temp = primaryName
          primaryName = altName
          altName = temp
        } else {
          // If it's in the altName column, use the name from the mapping
          primaryName = altNameMapping.name
        }
      }
    }

    // Create the activity log with the correctly ordered names
    const activityLog = await db.activityLog.create({
      data: {
        name: primaryName,
        alternativeNames: altName,
        team: data.team,
        activity: data.activity,
        verdi: Number.parseInt(data.verdi.toString()),
        department: data.department,
        year: Number.parseInt(data.year.toString()),
        monthName: data.monthName,
      },
    })

    return NextResponse.json({
      success: true,
      data: activityLog,
    })
  } catch (error) {
    console.error("Error creating activity log:", error)
    return NextResponse.json({
      success: false,
      message: `Something went wrong! ${error}`,
    })
  }
}

