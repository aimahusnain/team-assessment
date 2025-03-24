import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST(req: Request) {
  try {
    const data = await req.json()

    // Check if the name has an alternative mapping
    const alternativeMapping = await db.alternativeNames.findFirst({
      where: {
        OR: [{ name: data.name }, { altName: data.name }],
      },
    })

    // If a mapping exists, set the alternative name
    if (alternativeMapping) {
      if (alternativeMapping.name === data.name) {
        data.alternativeNames = alternativeMapping.altName
      } else {
        data.alternativeNames = alternativeMapping.name
      }
    }

    // Create the activity log
    const activityLog = await db.activityLog.create({
      data: {
        name: data.name,
        alternativeNames: data.alternativeNames,
        team: data.team,
        activity: data.activity,
        verdi: Number.parseInt(data.verdi),
        department: data.department,
        year: Number.parseInt(data.year),
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

