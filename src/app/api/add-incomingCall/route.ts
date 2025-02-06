import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { navn, min, year, monthName } = body;

    const incomingCall = await db.incomingCalls.create({
      data: {
        navn,
        min,
        year: parseInt(year),
        monthName,
      },
    });

    return NextResponse.json({ success: true, data: incomingCall });
  } catch (error) {
    console.error("Error adding incoming call:", error);
    return NextResponse.json(
      { success: false, message: "Failed to add incoming call" },
      { status: 500 }
    );
  }
}
