"use server"

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function deleteMonthData(monthName: string, year: number) {
  try {
    // Delete data from all three tables in a transaction
    const result = await prisma.$transaction([
      // Delete from ActivityLog
      prisma.activityLog.deleteMany({
        where: {
          monthName: monthName,
          year: year,
        },
      }),

      // Delete from IncomingCalls
      prisma.incomingCalls.deleteMany({
        where: {
          monthName: monthName,
          year: year,
        },
      }),

      // Delete from OutgoingCalls
      prisma.outgoingCalls.deleteMany({
        where: {
          monthName: monthName,
          year: year,
        },
      }),
    ])

    return { success: true, message: "Month data deleted successfully" }
  } catch (error) {
    console.error("Error deleting month data:", error)
    return { success: false, message: "Failed to delete month data" }
  } finally {
    await prisma.$disconnect()
  }
}

