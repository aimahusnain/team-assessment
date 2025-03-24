import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST(req: Request) {
  try {
    const { ids, alternativeName, primaryName } = await req.json()

    // Update the activity logs
    const updatePromises = ids.map((id: string) =>
      db.activityLog.update({
        where: { id },
        data: { alternativeNames: alternativeName },
      }),
    )

    await Promise.all(updatePromises)

    // Check if this mapping already exists in AlternativeNames
    const existingMapping = await db.alternativeNames.findFirst({
      where: {
        OR: [
          { name: primaryName, altName: alternativeName },
          { name: alternativeName, altName: primaryName },
        ],
      },
    })

    // If no mapping exists, create one with the correct order
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
      message: `Successfully updated ${ids.length} entries`,
    })
  } catch (error) {
    console.error("Error updating alternative names:", error)
    return NextResponse.json({
      success: false,
      message: `Something went wrong! ${error}`,
    })
  }
}

