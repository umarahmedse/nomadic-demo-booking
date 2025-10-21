import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date")
    if (!date) return NextResponse.json({ error: "Date required" }, { status: 400 })

    const db = await getDatabase()
    const day = new Date(date)
    const dayMid = new Date(day.getFullYear(), day.getMonth(), day.getDate())

    // Check admin block for barbecue scope
    const block = await db.collection("dateBlocks").findOne({ date: dayMid, scope: "barbecue" })
    if (block) {
      return NextResponse.json({
        booked: false,
        arrivalOptions: ["6:00 PM"],
        location: "Desert",
        blocked: true,
        blockedReason: block.reason || null,
      })
    }

    const existing = await db.collection("barbecue_bookings").find({ bookingDate: dayMid, isPaid: true }).toArray()

    return NextResponse.json({
      booked: existing.length > 0,
      arrivalOptions: ["6:00 PM"],
      location: "Desert",
      blocked: false,
      blockedReason: null,
    })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
