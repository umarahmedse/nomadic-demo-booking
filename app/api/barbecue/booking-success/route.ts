import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("session_id")
    if (!sessionId) return NextResponse.json({ error: "Missing session_id" }, { status: 400 })

    const db = await getDatabase()
    const booking = await db.collection("barbecue_bookings").findOne({ stripeSessionId: sessionId })
    if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 })

    return NextResponse.json({ booking })
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
