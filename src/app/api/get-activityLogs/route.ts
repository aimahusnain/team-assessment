export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const allActivityLogs = await db.activityLog.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (allActivityLogs.length > 0) {
      return NextResponse.json({
        success: true,
        data: allActivityLogs,
      });
    } else {
      return NextResponse.json({
        success: false,
        message: "No ActivityLogs found",
      });
    }
  } catch (e) {
    return NextResponse.json({
      success: false,
      message: `Something went wrong! Please try again ${e}`,
    });
  }
}
