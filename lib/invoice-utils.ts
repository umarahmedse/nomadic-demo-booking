import { generateInvoiceHTML } from "./invoice-email-utils"

export async function generateInvoicePDF(formData: any, booking: any, bookingType: string): Promise<void> {
  try {
    // Generate the HTML invoice
    const invoiceHTML = generateInvoiceHTML(formData, booking, bookingType)

    // Create a blob from the HTML
    const blob = new Blob([invoiceHTML], { type: "text/html" })
    const url = URL.createObjectURL(blob)

    // Create a temporary link and trigger download
    const link = document.createElement("a")
    link.href = url
    link.download = `invoice-${formData.invoiceNumber}.html`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Clean up the URL object
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error("Error generating invoice PDF:", error)
    throw error
  }
}
