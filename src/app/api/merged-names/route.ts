import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const safeTrim = (str: string | null | undefined): string => {
  return (str || "").trim();
};

interface NameDetails {
  name: string;
  team: string | null;
  department: string | null;
  totalCallMinutes: number;
  callEfficiency: number;
  totalSales: number;
  livRatio: number;
}

export async function GET() {
  try {
    const activityLogs = await prisma.activityLog.findMany({
      select: { 
        name: true,
        team: true,
        department: true,
        verdi: true,
        activity: true
      }
    });

    const incomingCalls = await prisma.incomingCalls.findMany({
      select: { navn: true, min: true },
      distinct: ["navn"],
    });

    const outgoingCalls = await prisma.outgoingCalls.findMany({
      select: { 
        navn: true,
        outgoing: true,
        regular_call_time_min: true
      }
    });

    const nameDetailsMap = new Map<string, { team: string; department: string }>();
    const incomingMinutesMap = new Map<string, number>();
    const outgoingMinutesMap = new Map<string, number>();
    const outgoingCallsMap = new Map<string, number>();
    const totalSalesMap = new Map<string, number>();
    const livSalesMap = new Map<string, number>();

    activityLogs.forEach((log) => {
      const trimmedName = safeTrim(log.name);
      if (trimmedName) {
        nameDetailsMap.set(trimmedName, {
          team: log.team,
          department: log.department
        });
        
        // Update total sales
        const currentSales = totalSalesMap.get(trimmedName) || 0;
        totalSalesMap.set(trimmedName, currentSales + log.verdi);

        // Update liv sales if activity matches
        if (log.activity === "2. liv") {
          const currentLivSales = livSalesMap.get(trimmedName) || 0;
          livSalesMap.set(trimmedName, currentLivSales + log.verdi);
        }
      }
    });

    incomingCalls.forEach((call) => {
      const trimmedName = safeTrim(call.navn);
      if (trimmedName) {
        incomingMinutesMap.set(trimmedName, parseInt(call.min) || 0);
      }
    });

    outgoingCalls.forEach((call) => {
      const trimmedName = safeTrim(call.navn);
      if (trimmedName) {
        const currentMinutes = outgoingMinutesMap.get(trimmedName) || 0;
        const currentCalls = outgoingCallsMap.get(trimmedName) || 0;
        
        outgoingMinutesMap.set(trimmedName, currentMinutes + (parseInt(call.regular_call_time_min) || 0));
        outgoingCallsMap.set(trimmedName, currentCalls + (parseInt(call.outgoing) || 0));
      }
    });

    const allNameDetails: NameDetails[] = [
      ...new Set([
        ...activityLogs.map(log => safeTrim(log.name)),
        ...incomingCalls.map(call => safeTrim(call.navn)),
        ...outgoingCalls.map(call => safeTrim(call.navn))
      ])
    ].filter(Boolean).map(name => {
      const details = nameDetailsMap.get(name);
      const incomingMinutes = incomingMinutesMap.get(name) || 0;
      const outgoingMinutes = outgoingMinutesMap.get(name) || 0;
      const totalCallMinutes = incomingMinutes + outgoingMinutes;
      const totalOutgoingCalls = outgoingCallsMap.get(name) || 0;
      const totalSales = totalSalesMap.get(name) || 0;
      const livSales = livSalesMap.get(name) || 0;

      return {
        name,
        team: details?.team || null,
        department: details?.department || null,
        totalCallMinutes,
        callEfficiency: totalCallMinutes > 0 ? Number((totalOutgoingCalls / totalCallMinutes).toFixed(2)) : 0,
        totalSales,
        livRatio: totalSales > 0 ? Number((livSales / totalSales).toFixed(2)) : 0
      };
    });

    const processedDetails = allNameDetails.sort((a, b) => 
      a.name.localeCompare(b.name)
    );

    return NextResponse.json({ names: processedDetails });
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