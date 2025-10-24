import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { calculateBarbecuePrice } from "@/lib/pricing-barbecue" // Fixed import path
import type { BarbecueGroupSize } from "@/lib/constants"

type BarbecueForm = {
  customerName: string
  customerEmail: string
  customerPhone: string
  bookingDate: string
  arrivalTime: "6:00 PM"
  groupSize: BarbecueGroupSize
  addOns: { charcoal: boolean; firewood: boolean; portableToilet: boolean }
  notes?: string
}

export async function POST(request: NextRequest) {
  try {
    const data = (await request.json()) as BarbecueForm

    // Basic validation
    if (
      !data.customerName ||
      !data.customerEmail ||
      !data.customerPhone ||
      !data.bookingDate ||
      !data.groupSize ||
      !data.arrivalTime
    ) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!data.customerPhone.startsWith("+971")) {
      return NextResponse.json({ error: "Phone number must start with +971" }, { status: 400 })
    }

    if (data.arrivalTime !== "6:00 PM") {
      return NextResponse.json({ error: "Only 6:00 PM arrival is available" }, { status: 400 })
    }

    if (![10, 15, 20].includes(Number(data.groupSize))) {
      return NextResponse.json({ error: "Invalid group size" }, { status: 400 })
    }

    // at least 2 days in advance
    const bookingDate = new Date(data.bookingDate)
    const today = new Date()
    const bMid = new Date(bookingDate.getFullYear(), bookingDate.getMonth(), bookingDate.getDate())
    const tMid = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const diffDays = Math.floor((bMid.getTime() - tMid.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays < 2) {
      return NextResponse.json({ error: "Booking date must be at least 2 days from today" }, { status: 400 })
    }

    const db = await getDatabase()

    // Only one BBQ setup per day: block if a paid booking exists OR a pending booking created in last 45 mins
    const cutoff = new Date(Date.now() - 45 * 60 * 1000)
    const existing = await db
      .collection("barbecue_bookings")
      .find({
        bookingDate: bMid,
        $or: [{ isPaid: true }, { isPaid: false, createdAt: { $gte: cutoff } }],
      })
      .toArray()

    if (existing.length > 0) {
      return NextResponse.json({ error: "This date is already booked. Please choose another." }, { status: 400 })
    }

    const settings = await db.collection("barbecue_settings").findOne({})
    let specialPricingName = ""
    if (settings?.specialPricing) {
      const specialPrice = settings.specialPricing.find((sp: any) => {
        if (!sp.isActive) return false
        const startDate = new Date(sp.startDate)
        const endDate = new Date(sp.endDate)
        return bMid >= startDate && bMid <= endDate
      })
      if (specialPrice) {
        specialPricingName = specialPrice.name
      }
    }

    const pricing = calculateBarbecuePrice(
      data.groupSize,
      data.addOns || { charcoal: false, firewood: false, portableToilet: false },
      settings,
      data.bookingDate,
    )

    const booking = {
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone,
      bookingDate: bMid,
      arrivalTime: "6:00 PM" as const,
      groupSize: data.groupSize,
      addOns: data.addOns || { charcoal: false, firewood: false, portableToilet: false },
      subtotal: pricing.subtotal,
      vat: pricing.vat,
      total: pricing.total,
      specialPricingName,
      isPaid: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("barbecue_bookings").insertOne(booking)

    // optional lock collection for observability
    await db
      .collection("barbecue_dateLocks")
      .updateOne({ date: bMid }, { $set: { date: bMid, hasPending: true, updatedAt: new Date() } }, { upsert: true })

    return NextResponse.json({ bookingId: result.insertedId, pricing })
  } catch (e) {
    console.error("BBQ POST error:", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const skip = (page - 1) * limit

    const db = await getDatabase()
    const filter: any = {}

    if (search) {
      filter.$or = [
        { customerName: { $regex: search, $options: "i" } },
        { customerEmail: { $regex: search, $options: "i" } },
        { customerPhone: { $regex: search, $options: "i" } },
      ]
    }

    if (startDate || endDate) {
      filter.bookingDate = {}
      if (startDate) {
        const start = new Date(startDate)
        start.setHours(0, 0, 0, 0)
        filter.bookingDate.$gte = start
      }
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        filter.bookingDate.$lte = end
      }
    }

    const [bookings, total] = await Promise.all([
      db.collection("barbecue_bookings").find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
      db.collection("barbecue_bookings").countDocuments(filter),
    ])

    return NextResponse.json({
      bookings,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (e) {
    console.error("BBQ GET error:", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
