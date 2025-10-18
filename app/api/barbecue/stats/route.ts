import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase()
    const collection = db.collection("barbecue_bookings")

    // Get all bookings
    const allBookings = await collection.find({}).toArray()

    // Calculate stats
    const totalBookings = allBookings.length
    const paidBookings = allBookings.filter((b: any) => b.isPaid).length
    const pendingBookings = allBookings.filter((b: any) => !b.isPaid).length
    const totalRevenue = allBookings
      .filter((b: any) => b.isPaid)
      .reduce((sum: number, b: any) => sum + (b.total || 0), 0)

    return NextResponse.json({
      totalBookings,
      paidBookings,
      pendingBookings,
      totalRevenue,
    })
  } catch (error) {
    console.error("Error fetching BBQ stats:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
