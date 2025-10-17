"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface InvoicePreviewProps {
  invoiceData: any
  booking: any
  bookingType: "camping" | "barbecue"
}

export default function InvoicePreview({ invoiceData, booking, bookingType }: InvoicePreviewProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
  }

  return (
    <Card className="bg-white border-[#D3B88C]/30 shadow-xl">
      <CardHeader className="border-b border-[#D3B88C]/20 p-6">
        <CardTitle className="text-[#3C2317]">Invoice Preview</CardTitle>
      </CardHeader>
      <CardContent className="p-8">
        <div className="max-w-4xl mx-auto bg-white border-2 border-[#D3B88C]/50 rounded-lg p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-[#D3B88C]/30">
            <div>
              <h1 className="text-3xl font-bold text-[#3C2317]">NOMADIC</h1>
              <p className="text-[#3C2317]/70 text-sm">Glamping & Desert Experiences</p>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold text-[#3C2317]">INVOICE</h2>
              <p className="text-[#3C2317]/70 text-sm">{invoiceData.invoiceNumber}</p>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="font-semibold text-[#3C2317] mb-3">Bill To:</h3>
              <div className="text-[#3C2317]/80 text-sm space-y-1">
                <p className="font-medium">{invoiceData.customerName}</p>
                <p>{invoiceData.customerEmail}</p>
                <p>{invoiceData.customerPhone}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-[#3C2317]/70">Invoice Date:</span>
                  <p className="font-medium text-[#3C2317]">{formatDate(invoiceData.invoiceDate)}</p>
                </div>
                <div>
                  <span className="text-[#3C2317]/70">Due Date:</span>
                  <p className="font-medium text-[#3C2317]">{formatDate(invoiceData.dueDate)}</p>
                </div>
                <div>
                  <span className="text-[#3C2317]/70">Booking Date:</span>
                  <p className="font-medium text-[#3C2317]">{formatDate(invoiceData.bookingDate)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Booking Details Table */}
          <div className="mb-8">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-[#D3B88C]/50 bg-[#FBF9D9]/50">
                  <th className="text-left py-3 px-4 text-[#3C2317] font-semibold">Description</th>
                  <th className="text-right py-3 px-4 text-[#3C2317] font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-[#D3B88C]/20">
                  <td className="py-3 px-4 text-[#3C2317]">
                    <div className="font-medium">
                      {bookingType === "camping" ? "Desert Camping" : "Desert Barbecue"} Booking
                    </div>
                    <div className="text-[#3C2317]/70 text-xs">
                      {booking.numberOfTents ? `${booking.numberOfTents} tent(s)` : `${booking.groupSize} people`}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right text-[#3C2317] font-medium">
                    AED {invoiceData.subtotal.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-64">
              <div className="flex justify-between py-2 border-b border-[#D3B88C]/30">
                <span className="text-[#3C2317]">Subtotal:</span>
                <span className="font-medium text-[#3C2317]">AED {invoiceData.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#D3B88C]/30">
                <span className="text-[#3C2317]">VAT (5%):</span>
                <span className="font-medium text-[#3C2317]">AED {invoiceData.vat.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-3 bg-[#FBF9D9]/50 px-4 rounded font-bold text-lg">
                <span className="text-[#3C2317]">Total:</span>
                <span className="text-[#0891b2]">AED {invoiceData.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoiceData.notes && (
            <div className="mb-8 p-4 bg-[#FBF9D9]/30 rounded border border-[#D3B88C]/30">
              <h4 className="font-semibold text-[#3C2317] mb-2">Notes:</h4>
              <p className="text-[#3C2317]/80 text-sm whitespace-pre-wrap">{invoiceData.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="border-t-2 border-[#D3B88C]/30 pt-6 text-center text-xs text-[#3C2317]/70">
            <p>Thank you for your business!</p>
            <p className="mt-2">Nomadic - Glamping & Desert Experiences</p>
            <p>📞 0585271420 | ✉️ yalla@nomadic.ae | 🌐 www.nomadic.ae</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
