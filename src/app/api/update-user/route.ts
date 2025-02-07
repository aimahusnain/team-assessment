import { db } from "@/lib/db"
import { NextResponse } from "next/server"

export async function PUT(request: Request) {
  try {
    const { id, username, email, picture } = await request.json()

    const updatedUser = await db.user.update({
      where: { id: Number.parseInt(id) },
      data: { username, email, picture },
    })

    return NextResponse.json({
      success: true,
      data: updatedUser,
    })
  } catch (e) {
    console.error("Error updating user:", e)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update user. Please try again.",
      },
      { status: 500 },
    )
  }
}

