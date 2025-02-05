import { db } from "@/lib/db"
import { NextResponse } from "next/server"

export async function DELETE(req: Request) {
  try {
    const { activityLogId } = await req.json()

    if (!activityLogId) {
      return NextResponse.json({ success: false, message: "ActivityLog ID is required" }, { status: 400 })
    }

    // Check if the activityLog exists and has no seat assignments
    const activityLog = await db.activityLog.findUnique({
      where: { id: activityLogId },
    })

    if (!activityLog) {
      return NextResponse.json({ success: false, message: "ActivityLog not found" }, { status: 404 })
    }

    // Delete the activityLog
    await db.activityLog.delete({
      where: { id: activityLogId },
    })

    return NextResponse.json({ success: true, message: "ActivityLog deleted successfully" })
  } catch (error) {
    console.error("Failed to delete ActivityLog:", error)
    return NextResponse.json({ success: false, message: "Failed to delete ActivityLog" }, { status: 500 })
  }
}

