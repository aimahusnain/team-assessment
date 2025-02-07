import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function DELETE(request: Request) {
  try {
    const body = await request.json()
    const { outgoingCallId } = body

    await db.outgoingCalls.delete({
      where: {
        id: outgoingCallId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting outgoing call:", error)
    return NextResponse.json({ success: false, error: "Failed to delete outgoing call" }, { status: 500 })
  }
}

