import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET() {
  try {
    const logs = await prisma.activityLog.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 30,
    })
    return Response.json(logs)
  } catch (error) {
    console.log("err", error)
    return Response.json({ error: "Failed to fetch activity logs" }, { status: 500 })
  }
}