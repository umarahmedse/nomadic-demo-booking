"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { calculateBarbecuePrice, type BarbecueGroupSize } from "@/lib/pricing-barbecue"

type Form = {
  customerName: string
  customerEmail: string
  customerPhone: string
  bookingDate: string
  arrivalTime: "6:00 PM"
  groupSize: BarbecueGroupSize
  addOns: { charcoal: boolean; firewood: boolean; portableToilet: boolean }
  notes?: string
}

export default function BarbecueBookingPage() {
  const [form, setForm] = useState<Form>({
    customerName: "",
    customerEmail: "",
    customerPhone: "+971",
    bookingDate: "",
    arrivalTime: "6:00 PM",
    groupSize: 10,
    addOns: { charcoal: false, firewood: false, portableToilet: false },
    notes: "",
  })
  const [pricing, setPricing] = useState(calculateBarbecuePrice(10, form.addOns))
  const [loading, setLoading] = useState(false)
  const [booked, setBooked] = useState<boolean | null>(null)
  const [blocked, setBlocked] = useState<boolean>(false)
  const [blockedReason, setBlockedReason] = useState<string | null>(null)

  useEffect(() => {
    setPricing(calculateBarbecuePrice(form.groupSize, form.addOns))
  }, [form.groupSize, form.addOns])

  useEffect(() => {
    if (!form.bookingDate) return
    ;(async () => {
      try {
        const res = await fetch(`/api/barbecue/date-constraints?date=${form.bookingDate}`)
        const data = await res.json()
        setBooked(!!data.booked)
        setBlocked(!!data.blocked)
        setBlockedReason(data.blockedReason || null)
      } catch {
        setBooked(null)
        setBlocked(false)
        setBlockedReason(null)
      }
    })()
  }, [form.bookingDate])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.customerName.trim()) return toast.error("Name is required")
    if (!form.customerEmail.trim() || !/\S+@\S+\.\S+/.test(form.customerEmail))
      return toast.error("Valid email required")
    if (!form.customerPhone.startsWith("+971")) return toast.error("Phone must start with +971")
    if (!form.bookingDate) return toast.error("Select a date")
    if (blocked) return toast.error(blockedReason || "This date is blocked")
    if (booked) return toast.error("This date is already booked")

    setLoading(true)
    try {
      const create = await fetch("/api/barbecue/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!create.ok) {
        const err = await create.json()
        throw new Error(err.error || "Failed to create booking")
      }
      const { bookingId } = await create.json()
      const checkout = await fetch("/api/barbecue/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          customerName: form.customerName,
          customerEmail: form.customerEmail,
          bookingDate: form.bookingDate,
          groupSize: form.groupSize,
          pricing,
        }),
      })
      if (!checkout.ok) throw new Error("Failed to create checkout session")
      const { url } = await checkout.json()
      window.location.href = url
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const minDate = (() => {
    const today = new Date()
    const min = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2)
    return min.toISOString().split("T")[0]
  })()

  return (
    <main className="min-h-screen bg-background">
      <section className="max-w-4xl mx-auto p-6 md:p-10">
        <header className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-balance">Nomadic Desert Barbecue Setup</h1>
          <p className="text-muted-foreground mt-2 text-pretty">
            Setup location: 40 minutes from Dubai. Arrival time fixed at 6:00 PM. One setup per day.
          </p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Book your private BBQ</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="grid gap-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={form.customerName}
                    onChange={(e) => setForm((p) => ({ ...p, customerName: e.target.value }))}
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.customerEmail}
                    onChange={(e) => setForm((p) => ({ ...p, customerEmail: e.target.value }))}
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone (+971…)</Label>
                  <Input
                    id="phone"
                    value={form.customerPhone}
                    onChange={(e) => setForm((p) => ({ ...p, customerPhone: e.target.value }))}
                    placeholder="+9715XXXXXXXX"
                  />
                </div>
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    min={minDate}
                    value={form.bookingDate}
                    onChange={(e) => setForm((p) => ({ ...p, bookingDate: e.target.value }))}
                  />
                  {blocked ? (
                    <p className="text-red-600 text-sm mt-1">
                      {blockedReason || "This date is unavailable (blocked by admin)."}
                    </p>
                  ) : (
                    booked && <p className="text-red-600 text-sm mt-1">This date is fully booked.</p>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-3">
                {[10, 15, 20].map((size) => (
                  <Button
                    key={size}
                    type="button"
                    variant={form.groupSize === size ? "default" : "outline"}
                    onClick={() => setForm((p) => ({ ...p, groupSize: size as BarbecueGroupSize }))}
                  >
                    Up to {size} people
                  </Button>
                ))}
              </div>

              <div>
                <Label>Arrival Time</Label>
                <div className="mt-2">
                  <Button type="button" variant="default" disabled>
                    6:00 PM (only)
                  </Button>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={form.addOns.charcoal}
                    onCheckedChange={(v) => setForm((p) => ({ ...p, addOns: { ...p.addOns, charcoal: !!v } }))}
                  />
                  Charcoal
                </label>
                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={form.addOns.firewood}
                    onCheckedChange={(v) => setForm((p) => ({ ...p, addOns: { ...p.addOns, firewood: !!v } }))}
                  />
                  Firewood
                </label>
                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={form.addOns.portableToilet}
                    onCheckedChange={(v) => setForm((p) => ({ ...p, addOns: { ...p.addOns, portableToilet: !!v } }))}
                  />
                  Portable toilet
                </label>
              </div>

              <div className="rounded-md border p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div>
                    <div className="text-sm text-muted-foreground">Subtotal</div>
                    <div className="font-medium">AED {pricing.subtotal.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">VAT (5%)</div>
                    <div className="font-medium">AED {pricing.vat.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Total</div>
                    <div className="font-bold text-[var(--color-accent)] text-lg">AED {pricing.total.toFixed(2)}</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button type="submit" disabled={loading || blocked}>
                  {loading ? "Processing..." : "Proceed to Payment"}
                </Button>
                <p className="text-sm text-muted-foreground">For groups over 20, please contact us directly.</p>
              </div>
            </form>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
