import { db } from "@/lib/db"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { navn, outgoing, regular, company, regular_call_time_min, company_call_time_min, year, monthName } = body

    const newOutgoingCall = await db.outgoingCalls.create({
      data: {
        navn,
        outgoing,
        regular,
        company,
        regular_call_time_min,
        company_call_time_min,
        year: Number.parseInt(year),
        monthName,
      },
    })

    return NextResponse.json({ success: true, data: newOutgoingCall })
  } catch (error) {
    console.error("Error adding outgoing call:", error)
    return NextResponse.json({ success: false, error: "Failed to add outgoing call" }, { status: 500 })
  }
}

