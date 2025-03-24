import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST(req: Request) {
  try {
    const { ids, alternativeName, primaryName } = await req.json()

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

    // Also store the mapping in the AlternativeNames model
    // First check if this mapping already exists
    const existingMapping = await db.alternativeNames.findFirst({
      where: {
        OR: [
          { name: primaryName, altName: alternativeName },
          { name: alternativeName, altName: primaryName },
        ],
      },
    })

    // If mapping doesn't exist, create it
    if (!existingMapping && primaryName && alternativeName) {
      await db.alternativeNames.create({
        data: {
          name: primaryName,
          altName: alternativeName,
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${ids.length} activity logs and stored name mapping`,
    })
  } catch (error) {
    console.error("Error updating alternative names:", error)
    return NextResponse.json({ success: false, message: "Failed to update alternative names" }, { status: 500 })
  }
}

