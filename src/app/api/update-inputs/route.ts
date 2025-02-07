import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      id,
      call_mins_thr,
      team_members_thr,
      score_tcm_weightage,
      score_ce_weightage,
      score_ts_weightage,
      score_rbsl_weightage,
      individual_score_tcm_benchmark,
      individual_score_tcm_interval,
      individual_score_ce_benchmark,
      individual_score_ce_interval,
      individual_score_ts_benchmark,
      individual_score_ts_interval,
      individual_score_rbsl_benchmark,
      individual_score_rbsl_interval,
      team_score_tcm_benchmark,
      team_score_tcm_interval,
      team_score_ce_benchmark,
      team_score_ce_interval,
      team_score_ts_benchmark,
      team_score_ts_interval,
      team_score_rbsl_benchmark,
      team_score_rbsl_interval,
    } = body;

    // Validate required fields
    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID is required" },
        { status: 400 }
      );
    }

    // Update the configuration in the database
    const updatedInput = await db.inputs.update({
      where: { id },
      data: {
        call_mins_thr: Number(call_mins_thr),
        team_members_thr: String(team_members_thr),
        score_tcm_weightage: String(score_tcm_weightage),
        score_ce_weightage: String(score_ce_weightage),
        score_ts_weightage: String(score_ts_weightage),
        score_rbsl_weightage: String(score_rbsl_weightage),

        // Convert nullable Int fields
        individual_score_tcm_benchmark: individual_score_tcm_benchmark ? Number(individual_score_tcm_benchmark) : null,
        individual_score_tcm_interval: individual_score_tcm_interval ? Number(individual_score_tcm_interval) : null,

        individual_score_ce_benchmark: String(individual_score_ce_benchmark),
        individual_score_ce_interval: String(individual_score_ce_interval),

        individual_score_ts_benchmark: individual_score_ts_benchmark ? Number(individual_score_ts_benchmark) : null,
        individual_score_ts_interval: individual_score_ts_interval ? Number(individual_score_ts_interval) : null,

        individual_score_rbsl_benchmark: String(individual_score_rbsl_benchmark),
        individual_score_rbsl_interval: String(individual_score_rbsl_interval),

        team_score_tcm_benchmark: team_score_tcm_benchmark ? Number(team_score_tcm_benchmark) : null,
        team_score_tcm_interval: team_score_tcm_interval ? Number(team_score_tcm_interval) : null,

        team_score_ce_benchmark: String(team_score_ce_benchmark),
        team_score_ce_interval: String(team_score_ce_interval),

        team_score_ts_benchmark: team_score_ts_benchmark ? Number(team_score_ts_benchmark) : null,
        team_score_ts_interval: team_score_ts_interval ? Number(team_score_ts_interval) : null,

        team_score_rbsl_benchmark: String(team_score_rbsl_benchmark),
        team_score_rbsl_interval: String(team_score_rbsl_interval),
      },
    });

    return NextResponse.json({ success: true, data: updatedInput });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: `Something went wrong! ${error}`,
      },
      { status: 500 }
    );
  }
}
