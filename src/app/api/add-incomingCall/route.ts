import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

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
        const { navn, min, year, monthName } = record
        if (!navn || !min || !year || !monthName) {
          return NextResponse.json(
            { success: false, message: "Missing required fields in one or more records" },
            { status: 400 },
          )
        }
      }

      // Process the batch
      const createdRecords = await prisma.incomingCalls.createMany({
        data: body.map((record) => ({
          navn: record.navn,
          min: Number.parseInt(record.min),
          year: Number.parseInt(record.year),
          monthName: record.monthName,
        })),
      })

      return NextResponse.json({ success: true, data: { count: createdRecords.count } }, { status: 201 })
    } else {
      // Single record upload
      const { navn, min, year, monthName } = body

      if (!navn || !min || !year || !monthName) {
        return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 })
      }

      const newIncomingCall = await prisma.incomingCalls.create({
        data: {
          navn,
          min: Number.parseInt(min),
          year: Number.parseInt(year),
          monthName,
        },
      })

      return NextResponse.json({ success: true, data: newIncomingCall }, { status: 201 })
    }
  } catch (error) {
    console.error("Error adding incoming call:", error)
    return NextResponse.json({ success: false, message: "Error adding incoming call" }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

