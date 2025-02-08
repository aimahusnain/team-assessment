import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function POST(request: Request) {
  try {
    const body = await request.json()
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
  } catch (error) {
    console.error("Error adding incoming call:", error)
    return NextResponse.json({ success: false, message: "Error adding incoming call" }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

