"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function BarbecueSuccessPage() {
  const [booking, setBooking] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const url = new URL(window.location.href)
    const sessionId = url.searchParams.get("session_id")
    if (!sessionId) return
    ;(async () => {
      const res = await fetch(`/api/barbecue/booking-success?session_id=${sessionId}`)
      if (!res.ok) {
        setError("Could not load booking.")
        return
      }
      const data = await res.json()
      setBooking(data.booking)
    })()
  }, [])

  return (
    <main className="min-h-screen bg-background">
      <section className="max-w-2xl mx-auto p-6 md:p-10">
        <Card>
          <CardHeader>
            <CardTitle>Desert Barbecue Setup – Confirmed 🎉</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {error && <p className="text-red-600">{error}</p>}
            {booking ? (
              <>
                <p>Thanks {booking.customerName}! Your BBQ setup is confirmed.</p>
                <p>
                  Date:{" "}
                  {new Date(booking.bookingDate?.$date || booking.bookingDate).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                <p>Arrival: 6:00 PM</p>
                <p>Group size: {booking.groupSize}</p>
                <p>
                  Total: <strong>AED {Number(booking.total).toFixed(2)}</strong>
                </p>
              </>
            ) : (
              <p>Loading your booking details…</p>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
