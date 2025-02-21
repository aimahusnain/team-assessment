// app/api/add-activityLog/route.ts

import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// Interface for the expected request data
interface ActivityLogData {
  name: string
  team: string
  activity: string
  verdi: string | number
  department: string
  year: string | number
  monthName: string
}

function validateActivityLogData(data: any): data is ActivityLogData {
  return (
    typeof data === 'object' &&
    typeof data.name === 'string' && data.name.trim() !== '' &&
    typeof data.team === 'string' && data.team.trim() !== '' &&
    typeof data.activity === 'string' && data.activity.trim() !== '' &&
    (typeof data.verdi === 'string' || typeof data.verdi === 'number') &&
    typeof data.department === 'string' && data.department.trim() !== '' &&
    (typeof data.year === 'string' || typeof data.year === 'number') &&
    typeof data.monthName === 'string' && data.monthName.trim() !== ''
  )
}

export async function POST(req: Request) {
  try {
    const data = await req.json()

    // Validate data
    if (!validateActivityLogData(data)) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Invalid data format",
          details: "All fields are required and must be of correct type"
        }, 
        { status: 400 }
      )
    }

    // Convert string values to numbers where needed
    const verdiNumber = typeof data.verdi === 'string' ? parseInt(data.verdi, 10) : data.verdi
    const yearNumber = typeof data.year === 'string' ? parseInt(data.year, 10) : data.year

    // Validate number conversions
    if (isNaN(verdiNumber) || isNaN(yearNumber)) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Invalid numeric values",
          details: "verdi and year must be valid numbers"
        }, 
        { status: 400 }
      )
    }

    // Create activity log
    const activityLog = await prisma.activityLog.create({
      data: {
        name: data.name.trim(),
        team: data.team.trim(),
        activity: data.activity.trim(),
        verdi: verdiNumber,
        department: data.department.trim(),
        year: yearNumber,
        monthName: data.monthName.trim(),
      },
    })

    return NextResponse.json({ 
      success: true, 
      data: activityLog 
    })

  } catch (error) {
    console.error("Error adding activity log:", error)
    
    // Handle Prisma-specific errors
    if (error instanceof Error) {
      return NextResponse.json({ 
        success: false, 
        message: "Failed to add activity log",
        error: error.message 
      }, { 
        status: 500 
      })
    }

    // Handle unknown errors
    return NextResponse.json({ 
      success: false, 
      message: "An unexpected error occurred" 
    }, { 
      status: 500 
    })
  } finally {
    // Disconnect Prisma client
    await prisma.$disconnect()
  }
}