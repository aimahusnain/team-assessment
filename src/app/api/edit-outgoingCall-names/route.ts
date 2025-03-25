import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function PUT(request: Request) {
  try {
    // Parse the request body
    const body = await request.json()
    const { ids, newName } = body

    // Validate the request
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ success: false, message: "Invalid or missing IDs" }, { status: 400 })
    }

    if (!newName || typeof newName !== "string" || newName.trim() === "") {
      return NextResponse.json({ success: false, message: "Invalid or missing new name" }, { status: 400 })
    }

    // For MongoDB, we need to update records one by one since updateMany doesn't return count
    let updatedCount = 0

    // Process updates in sequence
    for (const id of ids) {
      try {
        await prisma.outgoingCalls.update({
          where: {
            id: id, // In MongoDB, id is already a string
          },
          data: {
            navn: newName.trim(),
            updatedAt: new Date(),
          },
        })
        updatedCount++
      } catch (error) {
        console.error(`Error updating record with ID ${id}:`, error)
        // Continue with other records even if one fails
      }
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: "Names updated successfully",
      data: {
        count: updatedCount,
      },
    })
  } catch (error) {
    console.error("Error updating names:", error)

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "An error occurred while updating names",
      },
      { status: 500 },
    )
  }
}