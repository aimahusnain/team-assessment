"use server"

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export type MonthData = {
  id: number
  name: string
  hasData: boolean
}

// Map of month names to their numeric IDs
const monthMap: Record<string, number> = {
  January: 1,
  February: 2,
  March: 3,
  April: 4,
  May: 5,
  June: 6,
  July: 7,
  August: 8,
  September: 9,
  October: 10,
  November: 11,
  December: 12,
}

export async function getMonthsWithData(year: number) {
  try {
    // Get all months that have data in any of the three tables
    const [activityMonths, incomingMonths, outgoingMonths] = await Promise.all([
      prisma.activityLog.findMany({
        where: { year },
        select: { monthName: true },
        distinct: ["monthName"],
      }),
      prisma.incomingCalls.findMany({
        where: { year },
        select: { monthName: true },
        distinct: ["monthName"],
      }),
      prisma.outgoingCalls.findMany({
        where: { year },
        select: { monthName: true },
        distinct: ["monthName"],
      }),
    ])

    // Combine all unique months
    const uniqueMonths = new Set<string>()

    activityMonths.forEach((m) => uniqueMonths.add(m.monthName))
    incomingMonths.forEach((m) => uniqueMonths.add(m.monthName))
    outgoingMonths.forEach((m) => uniqueMonths.add(m.monthName))

    // Convert to array and sort by month number
    const monthsArray = Array.from(uniqueMonths)
      .map((name) => ({
        id: monthMap[name] || 0,
        name,
        hasData: true,
      }))
      .sort((a, b) => a.id - b.id)

    return { success: true, data: monthsArray }
  } catch (error) {
    console.error("Error fetching months with data:", error)
    return { success: false, data: [], error: "Failed to fetch months data" }
  } finally {
    await prisma.$disconnect()
  }
}