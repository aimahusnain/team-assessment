import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST(req: Request) {
  try {
    const { ids, alternativeName } = await req.json()

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ success: false, message: "No valid IDs provided" }, { status: 400 })
    }

    // Update all selected activity logs with the new alternative name
    const updatePromises = ids.map((id) =>
      db.activityLog.update({
        where: { id: id.toString() },
        data: { alternativeNames: alternativeName },
      }),
    )

    await Promise.all(updatePromises)

    return NextResponse.json({
      success: true,
      message: `Updated ${ids.length} activity logs`,
    })
  } catch (error) {
    console.error("Error updating alternative names:", error)
    return NextResponse.json({ success: false, message: "Failed to update alternative names" }, { status: 500 })
  }
}