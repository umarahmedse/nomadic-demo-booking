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

  const formatAddOns = (addOns: any) => {
    if (!addOns || Object.keys(addOns).length === 0) return <em className="text-[#8B6E58]">None</em>
    
    const list = Object.entries(addOns)
      .filter(([_, value]) => value)
      .map(([key]) => {
        const label = key === "charcoal" ? "🔥 Charcoal" 
          : key === "firewood" ? "🪵 Firewood"
          : key === "portableToilet" ? "🚻 Portable Toilet"
          : key
        return label
      })
      .join(", ")
    
    return list || <em className="text-[#8B6E58]">None</em>
  }

  const formatSleeping = (arrangements: any[]) => {
    if (!arrangements?.length) return <em className="text-[#8B6E58]">Not specified</em>
    
    const filtered = arrangements.filter((a) => a.arrangement !== "custom")
    if (!filtered.length) return <em className="text-[#8B6E58]">Not specified</em>
    
    return filtered.map((a, i) => {
      const arr = a.arrangement === "all-singles" ? "All Single Beds (4 singles)"
        : a.arrangement === "two-doubles" ? "Two Double Beds (2 doubles)"
        : a.arrangement === "mix" ? "Mixed (1 double + 2 singles)"
        : a.arrangement === "double-bed" ? "Double Bed (1 double)"
        : a.arrangement
      return (
        <div key={i} className="text-sm">
          Tent {a.tentNumber}: {arr}
        </div>
      )
    })
  }

  return (
    <Card className="bg-white border-[#EADAC1] shadow-xl">
      <CardHeader className="border-b border-[#EADAC1] bg-gradient-to-r from-[#D2A679] to-[#F6E4C1] p-6">
        <CardTitle className="text-[#3C2317]">Invoice Preview</CardTitle>
      </CardHeader>
      <CardContent className="p-8 bg-[#FFF7E8]">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl overflow-hidden shadow-lg">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#D2A679] to-[#F6E4C1] px-10 py-8 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white rounded-xl p-2 shadow-md">
                <img src="/logo.png" alt="Nomadic Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-[#3C2317]">NOMADIC بدوي</h1>
                <p className="text-[#3C2317]/80 text-sm mt-1">Glamping & Desert Experiences</p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-4xl font-bold text-[#3C2317]">INVOICE</h2>
              <p className="text-[#3C2317]/70 text-sm mt-1 font-medium">{invoiceData.invoiceNumber}</p>
            </div>
          </div>

          <div className="p-10">
            {/* Invoice Details */}
            <div className="bg-[#FFF9F0] border border-[#EADAC1] rounded-xl p-6 mb-6 flex justify-between">
              <div>
                <h3 className="font-semibold text-[#3C2317] mb-3 text-xs uppercase tracking-wider">Bill To:</h3>
                <div className="text-[#3C2317] text-sm space-y-1.5">
                  <p className="font-semibold">{invoiceData.customerName}</p>
                  <p>📧 {invoiceData.customerEmail}</p>
                  <p>📞 {invoiceData.customerPhone}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-[#8B6E58] text-xs uppercase tracking-wider font-semibold block">Invoice Date</span>
                    <p className="font-semibold text-[#3C2317] mt-1">{formatDate(invoiceData.invoiceDate)}</p>
                  </div>
                  <div>
                    <span className="text-[#8B6E58] text-xs uppercase tracking-wider font-semibold block">Due Date</span>
                    <p className="font-semibold text-[#3C2317] mt-1">{formatDate(invoiceData.dueDate)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Booking Details Section */}
            <div className="bg-[#FDF7EC] border border-[#EADAC1] rounded-xl p-6 mb-6">
              <h3 className="font-semibold text-[#3C2317] mb-4 text-base">Booking Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-[#8B6E58] font-semibold">📅 Date:</span>
                  <span className="text-[#3C2317]">{formatDate(invoiceData.bookingDate)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#8B6E58] font-semibold">📍 Location:</span>
                  <span className="text-[#3C2317]">{booking.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#8B6E58] font-semibold">🕓 Arrival:</span>
                  <span className="text-[#3C2317]">{booking.arrivalTime}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#8B6E58] font-semibold">👨‍👩‍👧 Guests:</span>
                  <span className="text-[#3C2317]">{booking.adults} adults{booking.children ? `, ${booking.children} children` : ""}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#8B6E58] font-semibold">⛺ Tents:</span>
                  <span className="text-[#3C2317]">{booking.numberOfTents}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[#8B6E58] font-semibold whitespace-nowrap">🛏️ Sleeping:</span>
                  <div className="text-[#3C2317]">{formatSleeping(booking.sleepingArrangements)}</div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-[#EADAC1]">
                <span className="text-[#8B6E58] font-semibold text-sm">Add-ons: </span>
                <span className="text-[#3C2317] text-sm">{formatAddOns(booking.addOns)}</span>
              </div>
            </div>

            {/* Booking Details Table */}
            <div className="mb-6 border border-[#EADAC1] rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-[#E5C79E] to-[#F7E8C9]">
                    <th className="text-left py-4 px-4 text-[#3C2317] font-semibold">Description</th>
                    <th className="text-right py-4 px-4 text-[#3C2317] font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-4 px-4 text-[#3C2317]">
                      <div className="font-semibold mb-1">
                        {bookingType === "camping" ? "Desert Camping Experience" : "Desert Barbecue Experience"}
                      </div>
                      <div className="text-[#8B6E58] text-xs leading-relaxed">
                        {booking.numberOfTents ? `${booking.numberOfTents} tent(s) for ${booking.adults} adults${booking.children ? ` and ${booking.children} children` : ""}` : `${booking.groupSize} people`}
                        <br />
                        Location: {booking.location} | Arrival: {booking.arrivalTime}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right text-[#3C2317] font-semibold">
                      AED {invoiceData.subtotal.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end mb-6">
              <div className="w-80 border border-[#EADAC1] rounded-xl overflow-hidden">
                <div className="flex justify-between py-3 px-4 bg-[#FDF7EC] border-b border-[#EADAC1]">
                  <span className="text-[#3C2317]">Subtotal:</span>
                  <span className="font-semibold text-[#3C2317]">AED {invoiceData.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-3 px-4 border-b border-[#EADAC1]">
                  <span className="text-[#3C2317]">VAT (5%):</span>
                  <span className="font-semibold text-[#3C2317]">AED {invoiceData.vat.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-4 px-4 bg-gradient-to-r from-[#1B8F5A] to-[#2BC480] text-white font-bold text-lg">
                  <span>TOTAL DUE:</span>
                  <span>AED {invoiceData.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Payment Status */}
            <div className={`text-center py-5 px-4 rounded-xl border mb-6 ${
              booking.isPaid 
                ? 'bg-[#E8F5E9] border-[#2BC480]' 
                : 'bg-[#FFF3E0] border-[#FF9800]'
            }`}>
              <p className="font-semibold text-base">
                {booking.isPaid ? '✅ PAID' : '⏳ PAYMENT PENDING'}
              </p>
            </div>

            {/* Notes */}
            {invoiceData.notes && (
              <div className="mb-6 p-5 bg-[#FFF9F0] rounded-xl border border-[#EADAC1]">
                <h4 className="font-semibold text-[#3C2317] mb-3 text-sm">Additional Notes:</h4>
                <p className="text-[#3C2317]/80 text-sm whitespace-pre-wrap leading-relaxed">{invoiceData.notes}</p>
              </div>
            )}

            {/* Terms */}
            <div className="mb-6 p-5 bg-[#FFF9F0] rounded-xl border border-[#EADAC1]">
              <h4 className="font-semibold text-[#3C2317] mb-3 text-sm">Invoice Terms & Conditions:</h4>
              <div className="text-[#3C2317]/80 text-xs leading-relaxed space-y-1.5">
                <p>• This is a digitally generated invoice and does not require a physical signature.</p>
                <p>• This invoice was generated on request for the booking reference {invoiceData.invoiceNumber}.</p>
                <p>• Payment must be received by the due date specified above.</p>
                <p>• All prices are in UAE Dirhams (AED) and include 5% VAT where applicable.</p>
                <p>• This invoice is issued by Badawi Leisure & Sport Equipment Rental (License No: 979490).</p>
                <p>• For any queries regarding this invoice, please contact us at yalla@nomadic.ae or +971 58 527 1420.</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-[#EADAC1] bg-[#FDF7EC] px-10 py-6 text-center">
            <p className="font-semibold text-[#3C2317] text-sm mb-1">Nomadic بدوي</p>
            <p className="text-[#8B6E58] text-xs mb-1">Commercial Manager – Badawi Leisure & Sport Equipment Rental | License No: 979490</p>
            <p className="text-[#8B6E58] text-xs mb-1">📞 0585271420 | ✉️ yalla@nomadic.ae | 🌐 www.nomadic.ae</p>
            <p className="text-[#8B6E58] text-xs">🏢 Empire Heights A, 9th Floor, Business Bay, Dubai</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
