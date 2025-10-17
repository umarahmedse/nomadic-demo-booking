//@ts-nocheck
import { type NextRequest, NextResponse } from "next/server"
import { sendBookingConfirmation, sendAdminNotification } from "@/lib/email"
import type { Booking } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    const { type, email } = await request.json()

    // Create a test booking object
    const testBooking: Booking = {
      _id: "test-booking-id",
      customerName: "John Doe",
      customerEmail: email || "test@example.com",
      customerPhone: "+971 50 123 4567",
      bookingDate: new Date("2024-02-15"),
      location: "Desert",
      numberOfTents: 2,
      addOns: {
        charcoal: true,
        firewood: false,
        portableToilet: true,
      },
      hasChildren: true,
      notes: "Looking forward to the adventure!",
      subtotal: 800,
      vat: 40,
      total: 840,
      isPaid: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    if (type === "confirmation") {
      await sendBookingConfirmation(testBooking)
      return NextResponse.json({ message: "Test confirmation email sent successfully" })
    } else if (type === "admin") {
      await sendAdminNotification(testBooking)
      return NextResponse.json({ message: "Test admin notification sent successfully" })
    } else {
      return NextResponse.json({ error: "Invalid email type" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error sending test email:", error)
    return NextResponse.json({ error: "Failed to send test email" }, { status: 500 })
  }
}
