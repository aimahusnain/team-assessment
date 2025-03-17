import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST(req: Request) {
  try {
    const data = await req.json()

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

    return NextResponse.json({ success: true, data: activityLog })
  } catch (error) {
    console.error("Error adding activity log:", error)
    return NextResponse.json({ success: false, message: "Failed to add activity log" }, { status: 500 })
  }
}
