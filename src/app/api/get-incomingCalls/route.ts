import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const incomingCalls = await db.incomingCalls.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ success: true, data: incomingCalls });
  } catch (error) {
    console.error("Error fetching incoming calls:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch incoming calls" },
      { status: 500 }
    );
  }
}
