import { PrismaClient } from "@prisma/client"
import { NextResponse } from "next/server"

const prisma = new PrismaClient()

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const months = searchParams.get("months")?.split(",") || []
  const year = searchParams.get("year") || new Date().getFullYear().toString()

  try {
    // Fetch top 10 teams, individuals, and departments
    const topTeams = await prisma.activityLog.groupBy({
      by: ["team"],
        // verdi: true,
      where: {
        AND: [{ year: Number.parseInt(year) }, months.length === 12 ? {} : { monthName: { in: months } }],
      },
      orderBy: {
        _sum: {
          verdi: "desc",
        },
      },
      take: 10,
    })

    const topIndividuals = await prisma.activityLog.groupBy({
      by: ["name"],
      _sum: {
        verdi: true,
      },
      where: {
        AND: [{ year: Number.parseInt(year) }, months.length === 12 ? {} : { monthName: { in: months } }],
      },
      orderBy: {
        _sum: {
          verdi: "desc",
        },
      },
      take: 10,
    })

    const topDepartments = await prisma.activityLog.groupBy({
      by: ["department"],
      _sum: {
        verdi: true,
      },
      where: {
        AND: [{ year: Number.parseInt(year) }, months.length === 12 ? {} : { monthName: { in: months } }],
      },
      orderBy: {
        _sum: {
          verdi: "desc",
        },
      },
      take: 10,
    })

    return NextResponse.json({
      topTeams,
      topIndividuals,
      topDepartments,
    })
  } catch (error) {
    console.error("Error fetching dashboard data:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

