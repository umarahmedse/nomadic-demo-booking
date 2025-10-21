import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const { bookingType, startDate, endDate } = await request.json()

    const db = await getDatabase()
    const collectionName = bookingType === "camping" ? "bookings" : "barbecue_bookings"

    // Fetch bookings within date range
    const bookings = await db
      .collection(collectionName)
      .find({
        bookingDate: {
          $gte: new Date(startDate),
          $lte: new Date(new Date(endDate).getTime() + 24 * 60 * 60 * 1000),
        },
        isPaid: true,
      })
      .toArray()

    if (bookings.length === 0) {
      return NextResponse.json({ error: "No bookings found for the selected date range" }, { status: 404 })
    }

    const csvContent = generateCSV(bookings, bookingType)

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="invoices-${bookingType}-${startDate}-to-${endDate}.csv"`,
      },
    })
  } catch (error) {
    console.error("Error generating bulk invoices:", error)
    return NextResponse.json({ error: "Failed to generate invoices" }, { status: 500 })
  }
}

function generateCSV(bookings: any[], bookingType: string): string {
  const headers = [
    "Invoice Number",
    "Customer Name",
    "Email",
    "Phone",
    "Booking Date",
    "Booking Type",
    "Subtotal",
    "VAT",
    "Total",
  ]

  const rows = bookings.map((booking: any) => [
    `INV-${new Date().getFullYear()}-${String(booking._id).slice(-6).toUpperCase()}`,
    booking.customerName,
    booking.customerEmail,
    booking.customerPhone,
    new Date(booking.bookingDate).toLocaleDateString("en-GB"),
    bookingType === "camping" ? "Desert Camping" : "Desert Barbecue",
    booking.subtotal.toFixed(2),
    booking.vat.toFixed(2),
    booking.total.toFixed(2),
  ])

  const csvRows = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(","))

  return csvRows.join("\n")
}
