import type { Booking } from "./types"

export async function generateInvoicePDF(booking: Booking, fileName = "invoice.pdf") {
  try {
    // Dynamically import jsPDF to avoid module loading issues
    const { jsPDF } = await import("jspdf")

    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 15
    let yPosition = margin

    // Header
    doc.setFontSize(20)
    doc.setTextColor(60, 35, 23) // #3C2317
    doc.text("NOMADIC BOOKINGS", margin, yPosition)
    yPosition += 10

    // Invoice title
    doc.setFontSize(14)
    doc.text("Invoice", margin, yPosition)
    yPosition += 8

    // Invoice details
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(`Invoice Date: ${new Date().toLocaleDateString()}`, margin, yPosition)
    yPosition += 5
    doc.text(`Booking ID: ${booking._id || "N/A"}`, margin, yPosition)
    yPosition += 10

    // Customer details
    doc.setFontSize(11)
    doc.setTextColor(60, 35, 23)
    doc.text("Customer Details:", margin, yPosition)
    yPosition += 6

    doc.setFontSize(10)
    doc.setTextColor(0, 0, 0)
    doc.text(`Name: ${booking.customerName}`, margin + 5, yPosition)
    yPosition += 5
    doc.text(`Email: ${booking.customerEmail}`, margin + 5, yPosition)
    yPosition += 5
    doc.text(`Phone: ${booking.customerPhone}`, margin + 5, yPosition)
    yPosition += 10

    // Booking details
    doc.setFontSize(11)
    doc.setTextColor(60, 35, 23)
    doc.text("Booking Details:", margin, yPosition)
    yPosition += 6

    doc.setFontSize(10)
    doc.setTextColor(0, 0, 0)
    doc.text(`Location: ${booking.location}`, margin + 5, yPosition)
    yPosition += 5
    doc.text(`Date: ${new Date(booking.bookingDate).toLocaleDateString()}`, margin + 5, yPosition)
    yPosition += 5
    doc.text(`Number of Tents: ${booking.numberOfTents}`, margin + 5, yPosition)
    yPosition += 5
    doc.text(`Guests: ${booking.adults} adults, ${booking.children} children`, margin + 5, yPosition)
    yPosition += 5
    doc.text(`Arrival Time: ${booking.arrivalTime}`, margin + 5, yPosition)
    yPosition += 10

    // Pricing breakdown
    doc.setFontSize(11)
    doc.setTextColor(60, 35, 23)
    doc.text("Pricing Breakdown:", margin, yPosition)
    yPosition += 6

    doc.setFontSize(10)
    doc.setTextColor(0, 0, 0)

    const lineHeight = 5
    const valueX = pageWidth - margin - 40

    doc.text("Subtotal:", margin + 5, yPosition)
    doc.text(`AED ${booking.subtotal.toFixed(2)}`, valueX, yPosition)
    yPosition += lineHeight

    doc.text("VAT (5%):", margin + 5, yPosition)
    doc.text(`AED ${booking.vat.toFixed(2)}`, valueX, yPosition)
    yPosition += lineHeight

    // Total
    doc.setFontSize(12)
    doc.setTextColor(60, 35, 23)
    doc.setFont(undefined, "bold")
    doc.text("Total:", margin + 5, yPosition)
    doc.text(`AED ${booking.total.toFixed(2)}`, valueX, yPosition)
    yPosition += 10

    // Payment status
    doc.setFontSize(10)
    if (booking.isPaid) {
      doc.setTextColor(34, 139, 34) // Green for paid
    } else {
      doc.setTextColor(220, 20, 60) // Red for pending
    }
    doc.text(`Payment Status: ${booking.isPaid ? "PAID" : "PENDING"}`, margin, yPosition)
    yPosition += 10

    // Footer
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text("Thank you for booking with Nomadic Bookings!", margin, pageHeight - 10)

    // Save the PDF
    doc.save(fileName)
  } catch (error) {
    console.error("Error generating PDF:", error)
    throw new Error("Failed to generate invoice PDF")
  }
}
