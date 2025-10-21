import { type NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"
import { generateInvoiceHTML } from "@/lib/invoice-email-utils"

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function POST(request: NextRequest) {
  try {
    const { invoiceData, booking, bookingType, emailTo, emailAdmin } = await request.json()

    // Check if SMTP is configured
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return NextResponse.json(
        { error: "Email service not configured. Please set SMTP environment variables." },
        { status: 500 },
      )
    }

    const invoiceHTML = generateInvoiceHTML(invoiceData, booking, bookingType)

    // Send to customer
    if (emailTo) {
      await transporter.sendMail({
        from: `"Nomadic Invoices" <${process.env.SMTP_USER}>`,
        to: emailTo,
        subject: `Invoice ${invoiceData.invoiceNumber} - Nomadic Bookings`,
        html: invoiceHTML,
      })
    }

    // Send to admin if requested
    if (emailAdmin && process.env.ADMIN_EMAIL) {
      await transporter.sendMail({
        from: `"Nomadic Invoices" <${process.env.SMTP_USER}>`,
        to: process.env.ADMIN_EMAIL,
        subject: `Invoice ${invoiceData.invoiceNumber} - ${booking.customerName}`,
        html: invoiceHTML,
      })
    }

    return NextResponse.json({
      success: true,
      message: "Invoice sent successfully",
    })
  } catch (error) {
    console.error("Error sending invoice email:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send invoice email" },
      { status: 500 },
    )
  }
}
