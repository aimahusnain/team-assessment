export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const alluser = await db.user.findMany();

    if (alluser.length > 0) {
      return NextResponse.json({
        success: true,
        data: alluser,
      });
    } else {
      return NextResponse.json({
        success: false,
        message: "No User found",
      });
    }
  } catch (e) {
    return NextResponse.json({
      success: false,
      message: `Something went wrong! Please try again ${e}`,
    });
  }
}
