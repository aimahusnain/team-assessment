export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const inputs = await db.inputs.findMany();

    if (inputs.length > 0) {
      return NextResponse.json({
        success: true,
        data: inputs,
      });
    } else {
      return NextResponse.json({
        success: false,
        message: "No Inputs found",
      });
    }
  } catch (e) {
    return NextResponse.json({
      success: false,
      message: `Something went wrong! Please try again ${e}`,
    });
  }
}
