import { db } from "@/lib/db";
import { NextResponse } from "next/server";

interface IncomingCall {
  navn: string;
  min: number;
  year: string;
  monthName: string;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { calls } = body;

    const createdCalls = await db.incomingCalls.createMany({
      data: calls.map((call: IncomingCall) => ({
        navn: call.navn,
        min: call.min,
        year: parseInt(call.year),
        monthName: call.monthName,
      })),
    });

    return NextResponse.json({ 
      success: true, 
      count: createdCalls.count 
    });
  } catch (error) {
    console.error("Error uploading incoming calls:", error);
    return NextResponse.json(
      { success: false, message: "Failed to upload incoming calls" },
      { status: 500 }
    );
  }
}
