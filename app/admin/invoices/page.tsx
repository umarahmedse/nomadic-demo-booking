"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { FileText, Calendar } from "lucide-react"
import InvoiceForm from "@/components/invoice/invoice-form"
import BulkInvoiceDownload from "@/components/invoice/bulk-invoice-download"
import type { Booking } from "@/lib/types"

type BookingType = "camping" | "barbecue"

export default function InvoiceGeneratorPage() {
  const [step, setStep] = useState<"select-type" | "select-booking" | "generate-invoice">("select-type")
  const [bookingType, setBookingType] = useState<BookingType | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  const fetchConfirmedBookings = async (type: BookingType) => {
    setLoading(true)
    try {
      const endpoint = type === "camping" ? "/api/bookings" : "/api/barbecue/bookings"
      const response = await fetch(`${endpoint}?limit=100`)
      const data = await response.json()
      const allBookings = data.bookings || []
      // Filter for paid bookings
      const paidBookings = allBookings.filter((b: any) => b.isPaid === true)
      setBookings(paidBookings)
      if (paidBookings.length === 0) {
        toast.info("No confirmed bookings found for this type")
      }
    } catch (error) {
      console.error("Error fetching bookings:", error)
      toast.error("Failed to fetch bookings")
    } finally {
      setLoading(false)
    }
  }

  const handleSelectType = (type: BookingType) => {
    setBookingType(type)
    fetchConfirmedBookings(type)
    setStep("select-booking")
  }

  const handleSelectBooking = (booking: Booking) => {
    setSelectedBooking(booking)
    setStep("generate-invoice")
  }

  const handleBack = () => {
    if (step === "generate-invoice") {
      setStep("select-booking")
      setSelectedBooking(null)
    } else if (step === "select-booking") {
      setStep("select-type")
      setBookingType(null)
      setBookings([])
    }
  }

  const filteredBookings = bookings.filter((booking: any) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      booking.customerName?.toLowerCase().includes(searchLower) ||
      booking.customerEmail?.toLowerCase().includes(searchLower) ||
      booking.customerPhone?.includes(searchTerm)
    )
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FBF9D9] via-[#E6CFA9] to-[#D3B88C]">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#3C2317] mb-2">Invoice Generator</h1>
              <p className="text-[#3C2317]/80">Generate, view, email, and download invoices for confirmed bookings</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-[#3C2317] to-[#5D4037] rounded-xl flex items-center justify-center shadow-lg">
              <FileText className="w-6 h-6 text-[#FBF9D9]" />
            </div>
          </div>
        </div>

        {/* Bulk Download Section */}
        {/* {step === "select-type" && <BulkInvoiceDownload />} */}

        {/* Step 1: Select Booking Type */}
        {step === "select-type" && (
          <Card className="bg-white/95 backdrop-blur-sm border-[#D3B88C]/30 shadow-xl mb-8">
            <CardHeader className="border-b border-[#D3B88C]/20 p-6">
              <CardTitle className="text-[#3C2317] text-xl font-semibold">Step 1: Select Booking Type</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button
                  onClick={() => handleSelectType("camping")}
                  className="p-6 border-2 border-[#D3B88C]/50 rounded-xl hover:border-[#3C2317] hover:bg-[#FBF9D9]/50 transition-all duration-300 text-left group"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-[#0891b2] to-[#0e7490] rounded-lg flex items-center justify-center mb-4 group-hover:shadow-lg transition-all">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#3C2317] mb-2">Desert Camping</h3>
                  <p className="text-[#3C2317]/70 text-sm">Generate invoices for camping bookings</p>
                </button>

                <button
                  onClick={() => handleSelectType("barbecue")}
                  className="p-6 border-2 border-[#D3B88C]/50 rounded-xl hover:border-[#3C2317] hover:bg-[#FBF9D9]/50 transition-all duration-300 text-left group"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-[#84cc16] to-[#65a30d] rounded-lg flex items-center justify-center mb-4 group-hover:shadow-lg transition-all">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#3C2317] mb-2">Desert Barbecue</h3>
                  <p className="text-[#3C2317]/70 text-sm">Generate invoices for BBQ bookings</p>
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Select Booking */}
        {step === "select-booking" && (
          <Card className="bg-white/95 backdrop-blur-sm border-[#D3B88C]/30 shadow-xl mb-8">
            <CardHeader className="border-b border-[#D3B88C]/20 p-6">
              <CardTitle className="text-[#3C2317] text-xl font-semibold">
                Step 2: Select a {bookingType === "camping" ? "Camping" : "Barbecue"} Booking
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="mb-6">
                <Label className="text-[#3C2317] mb-2 block">Search Bookings</Label>
                <Input
                  placeholder="Search by customer name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-[#D3B88C] bg-white"
                />
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block">
                    <div className="w-8 h-8 border-4 border-[#3C2317]/20 rounded-full animate-spin">
                      <div className="absolute inset-0 w-8 h-8 border-4 border-t-[#3C2317] rounded-full animate-spin"></div>
                    </div>
                  </div>
                </div>
              ) : filteredBookings.length === 0 ? (
                <div className="text-center py-12 text-[#3C2317]/60">
                  <p>No bookings found</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredBookings.map((booking: any) => (
                    <button
                      key={booking._id}
                      onClick={() => handleSelectBooking(booking)}
                      className="w-full p-4 border border-[#D3B88C]/50 rounded-lg hover:bg-[#FBF9D9]/50 hover:border-[#3C2317] transition-all text-left"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-semibold text-[#3C2317]">{booking.customerName}</div>
                          <div className="text-sm text-[#3C2317]/60">{booking.customerEmail}</div>
                          <div className="text-xs text-[#3C2317]/50 mt-1">
                            {new Date(booking.bookingDate).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-[#0891b2]">AED {booking.total.toFixed(2)}</div>
                          <div className="text-xs text-green-600 font-medium">Paid</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-6 flex gap-3">
                <Button
                  onClick={handleBack}
                  variant="outline"
                  className="border-[#D3B88C] text-[#3C2317] bg-transparent"
                >
                  Back
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Generate Invoice */}
        {step === "generate-invoice" && selectedBooking && (
          <InvoiceForm booking={selectedBooking} bookingType={bookingType!} onBack={handleBack} />
        )}
      </div>
    </div>
  )
}
