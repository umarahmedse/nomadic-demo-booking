//@ts-nocheck
import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { getDatabase } from "@/lib/mongodb"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("session_id")

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID required" }, { status: 400 })
    }

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (!session.metadata?.bookingId) {
      return NextResponse.json({ error: "Booking ID not found" }, { status: 404 })
    }

    // Get booking from database
    const db = await getDatabase()
    const booking = await db.collection("bookings").findOne({
      stripeSessionId: sessionId,
    })

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    return NextResponse.json({ booking })
  } catch (error) {
    console.error("Error fetching booking success:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
