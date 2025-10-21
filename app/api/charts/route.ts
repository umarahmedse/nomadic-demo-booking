//@ts-nocheck
import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

export async function GET() {
  try {
    const db = await getDatabase()
    if (!db) {
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 500 }
      )
    }

    const paidBookings = await db.collection("bookings").find({ isPaid: true }).toArray()

    // Generate monthly bookings data
    const monthlyData = paidBookings.reduce((acc, booking) => {
      const month = new Date(booking.bookingDate).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })
      if (!acc[month]) {
        acc[month] = { month, bookings: 0, revenue: 0 }
      }
      acc[month].bookings += 1
      acc[month].revenue += booking.total || 0
      return acc
    }, {})

    // Generate location stats data
    const locationData = paidBookings.reduce((acc, booking) => {
      if (!acc[booking.location]) {
        acc[booking.location] = {
          location: booking.location,
          bookings: 0,
          revenue: 0,
        }
      }
      acc[booking.location].bookings += 1
      acc[booking.location].revenue += booking.total || 0
      return acc
    }, {})

    const chartData = {
      monthlyBookings: Object.values(monthlyData),
      locationStats: Object.values(locationData),
    }

    return NextResponse.json(chartData, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    })
  } catch (error) {
    console.error("Error fetching chart data:", error)
    return NextResponse.json(
      { error: "Failed to fetch chart data" },
      { status: 500 }
    )
  }
}
