//@ts-nocheck
"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, MapPin, Calendar, Users, Mail, Shield } from "lucide-react"
import Link from "next/link"
import type { Booking } from "@/lib/types"
import { DotLottieReact } from "@lottiefiles/dotlottie-react"
import Image from "next/image"

export default function BookingSuccessPage() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session_id")
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (sessionId) {
      fetchBookingDetails()
    }
  }, [sessionId])

  const fetchBookingDetails = async () => {
    try {
      const response = await fetch(`/api/booking-success?session_id=${sessionId}`)
      if (response.ok) {
        const data = await response.json()
        setBooking(data.booking)
      }
    } catch (error) {
      console.error("Error fetching booking details:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FBF9D9] via-[#E6CFA9] to-[#D3B88C] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3C2317] mx-auto mb-4"></div>
          <p className="text-[#3C2317]">Loading your booking details...</p>
        </div>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FBF9D9] via-[#E6CFA9] to-[#D3B88C] flex items-center justify-center">
        <Card className="max-w-md border-[#D3B88C]/50 bg-[#FBF9D9]/80 backdrop-blur-sm">
          <CardContent className="text-center p-6">
            <p className="text-[#3C2317] mb-4">Unable to load booking details</p>
            <Button
              asChild
              className="bg-gradient-to-r from-[#3C2317] to-[#5D4037] hover:from-[#3C2317]/90 hover:to-[#5D4037]/90 text-[#FBF9D9]"
            >
              <Link href="/">Return Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-[#3C2317]/90 backdrop-blur-md border-b border-[#3C2317]/50 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-4 group">
              <Image src="/logo.png" alt="NOMADIC" width={140} height={45} className="h-10 w-auto" />
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* Success Header */}
        <div className="text-center mb-6">
          <div className="w-full flex justify-center">
            <div className="w-64">
              <DotLottieReact src="/tent.lottie" loop autoplay />
            </div>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#3C2317] mb-3">
            Nomadic Booking <span className="text-[#D3B88C]">Confirmed!</span>
          </h1>
          <p className="text-base text-[#3C2317]/80">
            Thank you for choosing Nomadic. Your camping rental setup is booked and confirmed🎉
          </p>
        </div>

        {/* Booking Details */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="border-[#D3B88C]/50 shadow-xl bg-[#FBF9D9]/80 backdrop-blur-sm !py-0 !gap-0">
            <CardHeader className="bg-gradient-to-r from-[#D3B88C]/20 to-[#E6CFA9]/20 px-2 sm:px-3 lg:px-4 h-8 sm:h-10 py-1.5 sm:py-2 border-b border-[#D3B88C]/30">
              <CardTitle className="text-[#3C2317] flex items-center text-sm sm:text-sm lg:text-base font-bold tracking-wide">
                Booking Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-[#3C2317]" />
                <div>
                  <p className="font-medium text-[#3C2317] text-sm">Date</p>
                  <p className="text-[#3C2317]/80 text-sm">
                    {new Date(booking.bookingDate).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-[#3C2317]" />
                <div>
                  <p className="font-medium text-[#3C2317] text-sm">Location</p>
                  <p className="text-[#3C2317]/80 text-sm">{booking.location}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-[#3C2317]" />
                <div>
                  <p className="font-medium text-[#3C2317] text-sm">Arrival Time</p>
                  <p className="text-[#3C2317]/80 text-sm">{booking.arrivalTime || "Not specified"}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-[#3C2317]" />
                <div>
                  <p className="font-medium text-[#3C2317] text-sm">Tents</p>
                  <p className="text-[#3C2317]/80 text-sm">
                    {booking.numberOfTents} tent
                    {booking.numberOfTents > 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              {(booking.addOns.charcoal || booking.addOns.firewood || booking.addOns.portableToilet) && (
                <div>
                  <p className="font-medium text-[#3C2317] text-sm mb-1">Add-ons</p>
                  <ul className="text-[#3C2317]/80 text-sm space-y-0.5">
                    {booking.addOns.charcoal && <li>• Premium Charcoal</li>}
                    {booking.addOns.firewood && <li>• Premium Firewood</li>}
                    {booking.addOns.portableToilet && <li>• Luxury Portable Toilet</li>}
                  </ul>
                </div>
              )}

              {booking.notes && (
                <div>
                  <p className="font-medium text-[#3C2317] text-sm">Special Requests</p>
                  <p className="text-[#3C2317]/80 text-sm">{booking.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-[#D3B88C]/50 shadow-xl bg-[#FBF9D9]/80 backdrop-blur-sm !py-0  !gap-0">
            <CardHeader className="bg-gradient-to-r from-[#D3B88C]/20 to-[#E6CFA9]/20 px-2 sm:px-3 lg:px-4 h-8 sm:h-10 py-1.5 sm:py-2 border-b border-[#D3B88C]/30">
              <CardTitle className="text-[#3C2317] flex items-center text-sm sm:text-base lg:text-base font-bold tracking-wide">
                Payment Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[#3C2317] text-sm">Subtotal</span>
                  <span className="text-[#3C2317] text-sm">AED {booking.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-[#3C2317]/80">
                  <span>VAT (5%)</span>
                  <span>AED {booking.vat.toFixed(2)}</span>
                </div>
                <div className="border-t border-[#D3B88C] pt-1.5">
                  <div className="flex justify-between font-bold text-[#3C2317]">
                    <span className="text-base">Total Paid</span>
                    <span className="text-base">AED {booking.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-[#84cc16]/20 to-[#65a30d]/20 p-3 rounded-lg border border-[#84cc16]/30">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-[#3f6212]" />
                  <span className="font-medium text-[#365314] text-sm">Payment Successful</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Next Steps */}
<Card className="mt-6 border-[#D3B88C]/50 shadow-xl bg-[#FBF9D9]/80 backdrop-blur-sm !py-0 !gap-0">
  <CardHeader className="bg-gradient-to-r from-[#D3B88C]/20 to-[#E6CFA9]/20 px-2 sm:px-3 lg:px-4 h-8 sm:h-10 py-1.5 sm:py-2 border-b border-[#D3B88C]/30">
    <CardTitle className="text-[#3C2317] flex items-center text-sm sm:text-base lg:text-base font-bold tracking-wide">
      What Happens Next?
    </CardTitle>
  </CardHeader>
  <CardContent className="p-4 space-y-3">
    
    <div className="flex items-start space-x-2">
      <Mail className="w-4 h-4 text-[#3C2317] mt-0.5" />
      <div>
        <p className="font-medium text-[#3C2317] text-sm">Confirmation Email</p>
        <p className="text-[#3C2317]/80 text-sm">
          You'll receive a detailed confirmation email at{" "}
          <span className="font-medium">{booking.customerEmail}</span> within the next few minutes. 
          This will include full booking details, meeting point location and your arrival time. 
        </p>
      </div>
    </div>

    <div className="flex items-start space-x-2">
      <Calendar className="w-4 h-4 text-[#3C2317] mt-0.5" />
      <div>
        <p className="font-medium text-[#3C2317] text-sm">Pre-Trip Contact</p>
        <p className="text-[#3C2317]/80 text-sm">
          Our team will contact you 24–48 hours before your setup to say hello, 
          reshare details, and make sure you have everything you need.
        </p>
      </div>
    </div>

    <div className="flex items-start space-x-2">
      <Shield className="w-4 h-4 text-[#3C2317] mt-0.5" />
      <div>
        <p className="font-medium text-[#3C2317] text-sm">Camping Day</p>
        <p className="text-[#3C2317]/80 text-sm">
          Arrive at the designated meeting point at the pre-arranged time 
          and get ready for an unforgettable desert experience! <br />
          <span className="font-medium">Note:</span> Late arrival of more than 1 hour will be classed as a 
          <span className="font-medium"> “No-Show”</span> and your booking may be cancelled, 
          so please ensure you arrive on time.
        </p>
      </div>
    </div>

  </CardContent>
</Card>


        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
          <Button
            asChild
            size="lg"
            className="bg-gradient-to-r from-[#3C2317] to-[#5D4037] hover:from-[#3C2317]/90 hover:to-[#5D4037]/90 text-[#FBF9D9] font-bold py-3 text-base shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            <Link href="https://nomadic.ae/">Return Home</Link>
          </Button>
             <Button
                                onClick={() =>
                                  window.open(
                                    "https://wa.me/971585271420?text=Hi%21%20I%20have%20a%20question%20about%20the%20Nomadic%20camping%20setup.",
                                    "_blank",
                                  )
                                }
                                className="bg-[#25D366] hover:bg-[#25D366] text-white !px-8 !py-4  flex items-center justify-center gap-2 text-sm font-medium shadow-md hover:shadow-lg transition cursor-pointer"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 32 32"
                                  fill="currentColor"
                                  className="w-5 h-5"
                                >
                                  <path d="M16 0C7.2 0 0 7.2 0 16c0 2.8.7 5.5 2.1 7.9L0 32l8.3-2.2c2.3 1.3 4.9 2 7.7 2 8.8 0 16-7.2 16-16S24.8 0 16 0zm0 29c-2.5 0-4.9-.7-7-2l-.5-.3-4.9 1.3 1.3-4.8-.3-.5C3.4 21.6 3 18.8 3 16 3 8.8 8.8 3 16 3s13 5.8 13 13-5.8 13-13 13zm7.4-9.4c-.4-.2-2.3-1.1-2.6-1.2-.4-.2-.6-.2-.9.2-.3.4-1 1.2-1.2 1.4-.2.2-.4.3-.8.1-.4-.2-1.6-.6-3-1.9-1.1-1-1.9-2.2-2.1-2.6-.2-.4 0-.6.2-.8.2-.2.4-.4.6-.6.2-.2.3-.4.5-.6.2-.2.2-.4.1-.7s-.9-2.1-1.3-2.9c-.3-.7-.6-.6-.9-.6h-.8c-.3 0-.7.1-1.1.5-.4.4-1.5 1.4-1.5 3.4s1.6 3.9 1.8 4.2c.2.3 3.1 4.7 7.7 6.6 1.1.5 2 .8 2.7 1 .6.2 1.1.2 1.6.1.5-.1 1.6-.6 1.8-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.7-.4z" />
                                </svg>
                                Got a Question?
                              </Button>
        </div>

        {/* Conversion Tracking */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Google Analytics conversion tracking
              if (typeof gtag !== 'undefined') {
                gtag('event', 'purchase', {
                  transaction_id: '${booking._id}',
                  value: ${booking.total},
                  currency: 'AED',
                  items: [{
                    item_id: 'camping-${booking.location.toLowerCase()}',
                    item_name: 'Desert Camping - ${booking.location}',
                    category: 'Camping',
                    quantity: ${booking.numberOfTents},
                    price: ${booking.total}
                  }]
                });
              }
              
              // Facebook Pixel conversion tracking
              if (typeof fbq !== 'undefined') {
                fbq('track', 'Purchase', {
                  value: ${booking.total},
                  currency: 'AED',
                  content_ids: ['camping-${booking.location.toLowerCase()}'],
                  content_type: 'product'
                });
              }
            `,
          }}
        />
      </div>
    </div>
  )
}
