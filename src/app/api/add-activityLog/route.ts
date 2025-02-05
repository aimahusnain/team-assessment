import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, team, activity, verdi, department, year, monthName } = body;

    // Validate required fields
    if (!name || !team || !activity || !verdi || !department || !year || !monthName) {
      return NextResponse.json(
        { success: false, message: "All fields are required" },
        { status: 400 }
      );
    }

    // Create activity log
    const activityLog = await db.activityLog.create({
      data: {
        name,
        team,
        activity,
        verdi: parseInt(verdi),
        department,
        year: parseInt(year),
        monthName,
      },
    });

    return NextResponse.json(
      { success: true, data: activityLog },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding activity log:", error);
    return NextResponse.json(
      { success: false, message: "Failed to add activity log" },
      { status: 500 }
    );
  }
}