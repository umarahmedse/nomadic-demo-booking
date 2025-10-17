import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

// 🚀 This disables Next.js + Vercel caching for this route
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const db = await getDatabase()
    if (!db) {
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 500 }
      )
    }

    const allBookings = await db.collection("bookings").find({}).toArray()
    const paidBookings = allBookings.filter((b) => b.isPaid === true)

    const stats = {
      totalBookings: paidBookings.length,
      paidBookings: paidBookings.length,
      totalRevenue: paidBookings.reduce((sum, b) => sum + (b.total || 0), 0),
      pendingBookings: allBookings.filter((b) => b.isPaid === false).length,
    }

    return NextResponse.json(stats, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    })
  } catch (error) {
    console.error("Error fetching stats:", error)
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store, max-age=0",
          "Pragma": "no-cache",
          "Expires": "0",
        },
      }
    )
  }
}
