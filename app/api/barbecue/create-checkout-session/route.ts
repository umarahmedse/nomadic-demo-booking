import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" })

export async function POST(request: NextRequest) {
  try {
    const { bookingId, customerName, customerEmail, bookingDate, groupSize, pricing } = await request.json()

    const metadata = {
      bookingId: bookingId.toString(),
      customerName,
      bookingDate,
      groupSize: String(groupSize),
      collection: "barbecue_bookings", // help webhook route collection
    }

    const origin = new URL(request.url).origin

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      metadata,
      payment_intent_data: { metadata },
      line_items: [
        {
          price_data: {
            currency: "aed",
            product_data: {
              name: `Desert Barbecue Setup`,
              description: `${groupSize} people · ${new Date(bookingDate).toLocaleDateString()}`,
            },
            unit_amount: Math.round(pricing.total * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/barbecue/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/barbecue/failed?cancelled=true`,
      customer_email: customerEmail,
    })

    const db = await getDatabase()
    await db
      .collection("barbecue_bookings")
      .updateOne({ _id: new ObjectId(bookingId) }, { $set: { stripeSessionId: session.id, updatedAt: new Date() } })

    return NextResponse.json({ url: session.url })
  } catch (e) {
    console.error("BBQ checkout error:", e)
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 })
  }
}
