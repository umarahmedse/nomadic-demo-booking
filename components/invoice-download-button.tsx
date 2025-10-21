"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { toast } from "sonner"
import { generateInvoicePDF } from "@/lib/invoice-utils"

interface InvoiceDownloadButtonProps {
  booking: any
  bookingType: "camping" | "barbecue"
  className?: string
}

export default function InvoiceDownloadButton({ booking, bookingType, className }: InvoiceDownloadButtonProps) {
  const handleDownload = async () => {
    try {
      const invoiceData = {
        invoiceNumber: `INV-${new Date().getFullYear()}-${String(booking._id).slice(-6).toUpperCase()}`,
        invoiceDate: new Date().toISOString().split("T")[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        bookingDate: booking.bookingDate,
        customerName: booking.customerName,
        customerEmail: booking.customerEmail,
        customerPhone: booking.customerPhone,
        subtotal: booking.subtotal,
        vat: booking.vat,
        total: booking.total,
        notes: booking.notes || "",
      }

      await generateInvoicePDF(invoiceData, booking, bookingType)
      toast.success("Invoice downloaded successfully")
    } catch (error) {
      console.error("Error downloading invoice:", error)
      toast.error("Failed to download invoice")
    }
  }

  return (
    <Button
      onClick={handleDownload}
      variant="outline"
      size="sm"
      className={`border-[#D3B88C] text-[#3C2317] hover:bg-[#D3B88C]/10 ${className}`}
    >
      <Download className="w-4 h-4 mr-2" />
      Download Invoice
    </Button>
  )
}
