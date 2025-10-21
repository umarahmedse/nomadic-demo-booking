"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { generateInvoicePDF } from "@/lib/invoice-utils"

interface QuickInvoiceDownloadProps {
  booking: any
  bookingType: "camping" | "barbecue"
  className?: string
}

export default function QuickInvoiceDownload({ booking, bookingType, className = "" }: QuickInvoiceDownloadProps) {
  const [loading, setLoading] = useState(false)

  const handleDownload = async () => {
    try {
      setLoading(true)

      const invoiceData = {
        invoiceNumber: `INV-${new Date().getFullYear()}-${String(booking._id).slice(-6).toUpperCase()}`,
        invoiceDate: new Date().toISOString().split("T")[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        customerName: booking.customerName,
        customerEmail: booking.customerEmail,
        customerPhone: booking.customerPhone,
        bookingDate: new Date(booking.bookingDate).toISOString().split("T")[0],
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
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleDownload}
      disabled={loading}
      size="sm"
      variant="outline"
      className={`border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white h-9 px-3 ${className}`}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Download className="w-4 h-4 mr-2" />
          Invoice
        </>
      )}
    </Button>
  )
}
