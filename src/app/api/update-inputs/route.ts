import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      id,
      call_mins_thr,
      team_members_thr,
      weights,
    } = body;

    if (!id || !weights) {
      return NextResponse.json({ success: false, message: "ID and weights are required" }, { status: 400 });
    }

    const updatedInput = await db.inputs.update({
      where: { id },
      data: {
        call_mins_thr: String(call_mins_thr),
        team_members_thr: String(team_members_thr),
        score_tcm_weightage: String(weights.tcm),
        score_ce_weightage: String(weights.ce),
        score_ts_weightage: String(weights.ts),
        score_rbsl_weightage: String(weights.rbsl),
      },
    });

    return NextResponse.json({ success: true, data: updatedInput });
  } catch (e) {
    return NextResponse.json({
      success: false,
      message: `Something went wrong! ${e}`,
    }, { status: 500 });
  }
}
