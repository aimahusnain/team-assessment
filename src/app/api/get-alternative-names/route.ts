import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const alternativeNames = await db.alternativeNames.findMany({
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json({
      success: true,
      data: alternativeNames,
    })
  } catch (error) {
    console.error("Error fetching alternative names:", error)
    return NextResponse.json({
      success: false,
      message: `Something went wrong! ${error}`,
    })
  }
}

export const dynamic = "force-dynamic"

