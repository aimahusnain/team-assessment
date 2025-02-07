import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const outgoingCalls = await db.outgoingCalls.findMany({
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json({ success: true, data: outgoingCalls })
  } catch (error) {
    console.error("Error fetching outgoing calls:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch outgoing calls" }, { status: 500 })
  }
}

