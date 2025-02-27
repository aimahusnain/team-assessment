import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET() {
  try {
    const [incomingCalls, outgoingCalls] = await Promise.all([
      prisma.incomingCalls.findMany({
        orderBy: {
          createdAt: "desc",
        },
        take: 30,
      }),
      prisma.outgoingCalls.findMany({
        orderBy: {
          createdAt: "desc",
        },
        take: 30,
      }),
    ])
    return Response.json({ incomingCalls, outgoingCalls })
  } catch (error) {
    console.log("err", error)
    return Response.json({ error: "Failed to fetch calls data" }, { status: 500 })
  }
}

