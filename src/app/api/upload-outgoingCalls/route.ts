import { db } from "@/lib/db"
import { NextResponse } from "next/server"

interface CallData {
  navn: string;
  outgoing: boolean;
  regular: number;
  company: number;
  regular_call_time_min: number;
  company_call_time_min: number;
  year: string;
  monthName: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { calls } = body

    const createdCalls = await db.outgoingCalls.createMany({
      data: calls.map((call: CallData) => ({
        navn: call.navn,
        outgoing: call.outgoing,
        regular: call.regular,
        company: call.company,
        regular_call_time_min: call.regular_call_time_min,
        company_call_time_min: call.company_call_time_min,
        year: Number.parseInt(call.year),
        monthName: call.monthName,
      })),
    })

    return NextResponse.json({ success: true, count: createdCalls.count })
  } catch (error) {
    console.error("Error uploading outgoing calls:", error)
    return NextResponse.json({ success: false, error: "Failed to upload outgoing calls" }, { status: 500 })
  }
}

