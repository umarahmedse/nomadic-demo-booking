import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { invoiceData, booking, bookingType, emailTo, emailAdmin } = await request.json()

    // For now, just return success - email functionality requires SMTP configuration
    // In production, you would integrate with your email service here
    console.log("Invoice email request:", {
      invoiceNumber: invoiceData.invoiceNumber,
      emailTo,
      emailAdmin,
    })

    return NextResponse.json({
      success: true,
      message: "Invoice email functionality requires SMTP configuration. Please set up email environment variables.",
    })
  } catch (error) {
    console.error("Error processing invoice email:", error)
    return NextResponse.json({ error: "Failed to process invoice email" }, { status: 500 })
  }
}
