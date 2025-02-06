import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { incomingCallId } = body;

    await db.incomingCalls.delete({
      where: {
        id: incomingCallId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting incoming call:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete incoming call" },
      { status: 500 }
    );
  }
}
