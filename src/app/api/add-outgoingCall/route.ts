import { db } from "@/lib/db"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Check if it's a batch upload or single record
    if (Array.isArray(body)) {
      // Batch upload
      if (!body.length) {
        return NextResponse.json({ success: false, message: "Empty batch" }, { status: 400 })
      }

      // Validate each record in the batch
      for (const record of body) {
        const { navn, outgoing, regular, company, regular_call_time_min, company_call_time_min, year, monthName } =
          record
        if (
          !navn ||
          !outgoing ||
          !regular ||
          !company ||
          !regular_call_time_min ||
          !company_call_time_min ||
          !year ||
          !monthName
        ) {
          return NextResponse.json(
            { success: false, message: "Missing required fields in one or more records" },
            { status: 400 },
          )
        }
      }

      // Process the batch using createMany for efficiency
      const createdRecords = await db.outgoingCalls.createMany({
        data: body.map((record) => ({
          navn: record.navn,
          outgoing: record.outgoing,
          regular: record.regular,
          company: record.company,
          regular_call_time_min: record.regular_call_time_min,
          company_call_time_min: record.company_call_time_min,
          year: Number.parseInt(record.year),
          monthName: record.monthName,
        })),
      })

      return NextResponse.json(
        {
          success: true,
          data: { count: createdRecords.count },
          message: "Batch upload successful",
        },
        { status: 201 },
      )
    } else {
      // Single record upload
      const { navn, outgoing, regular, company, regular_call_time_min, company_call_time_min, year, monthName } = body

      if (
        !navn ||
        !outgoing ||
        !regular ||
        !company ||
        !regular_call_time_min ||
        !company_call_time_min ||
        !year ||
        !monthName
      ) {
        return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 })
      }

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
    }
  } catch (error) {
    console.error("Error adding outgoing call:", error)
    return NextResponse.json({ success: false, message: "Failed to add outgoing call" }, { status: 500 })
  }
}

