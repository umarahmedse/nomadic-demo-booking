//@ts-nocheck
import { type NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

export async function POST(request: NextRequest) {
  try {
    const {
      bookingId,
      customerName,
      customerEmail,
      bookingDate,
      location,
      numberOfTents,
      pricing,
    } = await request.json();
    const metadata = {
      bookingId: bookingId.toString(),
      customerName,
      location,
      numberOfTents: numberOfTents.toString(),
      bookingDate,
    };
    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      metadata, // stored on Checkout Session
      payment_intent_data: {
        metadata, // stored on PaymentIntent (so it shows in dashboard + webhooks)
      },
      line_items: [
        {
          price_data: {
            currency: "aed",
            product_data: {
              name: `Desert Camping - ${location}`,
              description: `${numberOfTents} tent${numberOfTents > 1 ? "s" : ""} for ${new Date(bookingDate).toLocaleDateString()}`,
            },
            unit_amount: Math.round(pricing.total * 100), // Convert to fils (smallest currency unit)
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/booking/failed?cancelled=true`,
      customer_email: customerEmail,
    });

    // Update booking with Stripe session ID
    const db = await getDatabase();
    await db.collection("bookings").updateOne(
      { _id: new ObjectId(bookingId) },
      {
        $set: {
          stripeSessionId: session.id,
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
