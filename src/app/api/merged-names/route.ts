import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Helper function to safely trim strings
const safeTrim = (str: string | null | undefined): string => {
  return (str || "").trim();
};

export async function GET() {
  try {
    // Fetch and trim names from ActivityLog
    const activityLogs = await prisma.activityLog.findMany({
      select: { name: true },
      distinct: ["name"],
    });

    // Fetch and trim navn from IncomingCalls
    const incomingCalls = await prisma.incomingCalls.findMany({
      select: { navn: true },
      distinct: ["navn"],
    });

    // Fetch and trim navn from OutgoingCalls
    const outgoingCalls = await prisma.outgoingCalls.findMany({
      select: { navn: true },
      distinct: ["navn"],
    });

    // Merge all names, applying trim
    const allNames = [
      ...activityLogs.map((log) => safeTrim(log.name)),
      ...incomingCalls.map((call) => safeTrim(call.navn)),
      ...outgoingCalls.map((call) => safeTrim(call.navn)),
    ];

    // Process the merged names: remove empty strings and duplicates
    const processedNames = [...new Set(allNames.filter(Boolean))];

    // Return the processed names
    return NextResponse.json({ names: processedNames });
  } catch (error) {
    console.error("Error fetching and processing names:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
