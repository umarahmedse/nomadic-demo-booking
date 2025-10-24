//@ts-nocheck
import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import type { Booking, BookingFormData } from "@/lib/types"
import { calculateBookingPrice } from "@/lib/pricing"

export async function POST(request: NextRequest) {
  try {
    const data: BookingFormData & { selectedCustomAddOns?: string[] } = await request.json()

    // Validate required fields
    if (
      !data.customerName ||
      !data.customerEmail ||
      !data.customerPhone ||
      !data.bookingDate ||
      !data.location ||
      !data.numberOfTents ||
      !data.adults || // Added missing adults field validation
      data.children === undefined ||
      data.children === null || // Fixed children validation to allow 0
      !data.sleepingArrangements || // Added missing sleepingArrangements field validation
      !data.arrivalTime // Added missing arrivalTime field validation
    ) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (data.numberOfTents < 1 || data.numberOfTents > 5) {
      return NextResponse.json({ error: "Number of tents must be between 1 and 5 per booking" }, { status: 400 })
    }

    // No validation needed for Wadi single tent - surcharge is applied in pricing

    // Validate phone number (+971)
    if (!data.customerPhone.startsWith("+971")) {
      return NextResponse.json({ error: "Phone number must start with +971" }, { status: 400 })
    }

    const validArrivalTimes = ["4:30 PM", "5:00 PM", "5:30 PM", "6:00 PM"]
    if (!validArrivalTimes.includes(data.arrivalTime)) {
      return NextResponse.json({ error: "Invalid arrival time selected" }, { status: 400 })
    }

    // Validate booking date (minimum today + 2)
    const bookingDate = new Date(data.bookingDate)
    const today = new Date()

    // Reset both dates to midnight for accurate day comparison
    const bookingMidnight = new Date(bookingDate.getFullYear(), bookingDate.getMonth(), bookingDate.getDate())
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate())

    // Calculate difference in days
    const diffTime = bookingMidnight.getTime() - todayMidnight.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    console.log("SERVER - Date validation:", {
      today: todayMidnight.toDateString(),
      selected: bookingMidnight.toDateString(),
      diffDays: diffDays,
      bookingDate: data.bookingDate,
    })

    if (diffDays < 2) {
      return NextResponse.json({ error: "Booking date must be at least 2 days from today" }, { status: 400 })
    }

    const db = await getDatabase()

    const settings = await db.collection("settings").findOne({})
    const maxTentsPerDay = settings?.maxTentsPerDay || 15 // Default to 15 if not set

    const dateString = bookingDate.toISOString().split("T")[0]
    const existingBookingsForDate = await db
      .collection("bookings")
      .find({
        bookingDate: bookingDate,
        isPaid: true, // Only count paid bookings for availability
      })
      .toArray()

    const totalExistingTents = existingBookingsForDate.reduce((sum, booking) => sum + booking.numberOfTents, 0)

    if (totalExistingTents + data.numberOfTents > maxTentsPerDay) {
      const remainingCapacity = maxTentsPerDay - totalExistingTents
      if (remainingCapacity <= 0) {
        return NextResponse.json(
          {
            error: `This date is fully booked (${maxTentsPerDay} tents maximum per day)`,
          },
          { status: 400 },
        )
      } else {
        return NextResponse.json(
          {
            error: `Only ${remainingCapacity} tent${remainingCapacity === 1 ? "" : "s"} available for this date (${maxTentsPerDay} tents maximum per day)`,
          },
          { status: 400 },
        )
      }
    }

    if (existingBookingsForDate.length >= 3) {
      return NextResponse.json(
        {
          error: "choose another Date this date filled",
        },
        { status: 400 },
      )
    }

    const bookedArrivalTimes = existingBookingsForDate.map((booking) => booking.arrivalTime)
    if (bookedArrivalTimes.includes(data.arrivalTime)) {
      return NextResponse.json(
        {
          error: `Arrival time ${data.arrivalTime} is already booked for this date`,
        },
        { status: 400 },
      )
    }

    let lockedLocation = null

    if (existingBookingsForDate.length > 0) {
      lockedLocation = existingBookingsForDate[0].location

      // Validate location consistency
      const allSameLocation = existingBookingsForDate.every((booking) => booking.location === lockedLocation)
      if (!allSameLocation) {
        return NextResponse.json({ error: "Internal error: Inconsistent location data for this date" }, { status: 500 })
      }

      // Validate location matches
      if (data.location !== lockedLocation) {
        return NextResponse.json(
          {
            error: `This date is already booked for ${lockedLocation} location. All bookings for the same date must be in the same location.`,
          },
          { status: 400 },
        )
      }
    }

    const customAddOnsWithSelection = (settings?.customAddOns || []).map((addon: any) => ({
      ...addon,
      selected: data.selectedCustomAddOns?.includes(addon.id) || false,
    }))

    let specialPricingName = ""
    if (data.bookingDate && settings?.specialPricing) {
      const bookingDateObj = new Date(data.bookingDate)
      const specialPrice = settings.specialPricing.find((sp: any) => {
        if (!sp.isActive) return false
        const startDate = new Date(sp.startDate)
        const endDate = new Date(sp.endDate)
        return bookingDateObj >= startDate && bookingDateObj <= endDate
      })
      if (specialPrice) {
        specialPricingName = specialPrice.name
      }
    }

    // Calculate pricing with current settings
    const pricing = calculateBookingPrice(
      data.numberOfTents,
      data.location,
      data.addOns,
      data.hasChildren,
      customAddOnsWithSelection,
      settings,
    )

    const selectedCustomAddOnsWithDetails = (data.selectedCustomAddOns || [])
      .map((id: string) => {
        const addon = (settings?.customAddOns || []).find((addon: any) => addon.id === id)
        if (addon) {
          return {
            id: addon.id,
            name: addon.name,
            description: addon.description || "Custom service",
            price: addon.price || 0,
          }
        }
        return null
      })
      .filter(Boolean)

    // Create booking
    const booking: Omit<Booking, "_id"> = {
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone,
      bookingDate,
      location: data.location,
      numberOfTents: data.numberOfTents,
      adults: data.adults, // Added missing adults field
      children: data.children, // Added missing children field
      sleepingArrangements: data.sleepingArrangements, // Added missing sleepingArrangements field
      addOns: data.addOns,
      hasChildren: data.hasChildren,
      notes: data.notes,
      arrivalTime: data.arrivalTime, // Added missing arrivalTime field
      subtotal: pricing.subtotal,
      vat: pricing.vat,
      total: pricing.total,
      selectedCustomAddOns: data.selectedCustomAddOns || [],
      customAddOnsWithDetails: selectedCustomAddOnsWithDetails,
      specialPricingName, // Store special pricing name
      isPaid: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("bookings").insertOne(booking)

    if (!lockedLocation) {
      // First booking for this date - create lock
      await db.collection("dateLocationLocks").updateOne(
        { date: bookingDate },
        {
          $set: {
            lockedLocation: data.location,
            totalTents: data.numberOfTents, // Track total tents for this date
            updatedAt: new Date(),
          },
        },
        { upsert: true },
      )
    } else {
      await db.collection("dateLocationLocks").updateOne(
        { date: bookingDate },
        {
          $set: {
            totalTents: totalExistingTents + data.numberOfTents,
            updatedAt: new Date(),
          },
        },
      )
    }

    return NextResponse.json({
      bookingId: result.insertedId,
      pricing,
    })
  } catch (error) {
    console.error("Error creating booking:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""
    const location = searchParams.get("location") || ""
    const isPaid = searchParams.get("isPaid")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    const db = await getDatabase()

    // Build filter
    const filter: any = {}

    if (search) {
      filter.$or = [
        { customerName: { $regex: search, $options: "i" } },
        { customerEmail: { $regex: search, $options: "i" } },
        { customerPhone: { $regex: search, $options: "i" } },
      ]
    }

    if (location) {
      filter.location = location
    }

    if (isPaid !== null) {
      filter.isPaid = isPaid === "true"
    } else {
      // Default to only paid bookings for orders page
      filter.isPaid = true
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

    const skip = (page - 1) * limit

    const [bookings, total] = await Promise.all([
      db.collection("bookings").find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
      db.collection("bookings").countDocuments(filter),
    ])

    const settings = await db.collection("settings").findOne({})
    const customAddOnsMap = new Map()

    // Add all custom addons from settings (current active ones)
    if (settings?.customAddOns) {
      settings.customAddOns.forEach((addon: any) => {
        const addonId = String(addon.id)
        customAddOnsMap.set(addonId, {
          id: addonId,
          name: addon.name,
          description: addon.description || "Custom service",
          price: addon.price || 0,
        })
      })
    }

    // Also check if there's a separate customAddOns collection for historical data
    try {
      const customAddOns = await db.collection("customAddOns").find({}).toArray()
      customAddOns.forEach((addon: any) => {
        const addonId = addon._id?.toString() || String(addon.id)
        // Only add if not already in the map (settings take priority)
        if (!customAddOnsMap.has(addonId)) {
          customAddOnsMap.set(addonId, {
            id: addonId,
            name: addon.name,
            description: addon.description || "Custom service",
            price: addon.price || 0,
          })
        }
      })
    } catch (error) {
      // No separate customAddOns collection found, using settings only
    }

    // Enhance bookings with custom add-on details
    const enhancedBookings = bookings.map((booking: any) => {
      let customAddOnsWithDetails = booking.customAddOnsWithDetails || []

      // If no stored details, try to reconstruct from current settings (legacy bookings)
      if (!customAddOnsWithDetails || customAddOnsWithDetails.length === 0) {
        customAddOnsWithDetails = (booking.selectedCustomAddOns || []).map((id: string) => {
          const stringId = String(id)
          const addon = customAddOnsMap.get(stringId)

          if (addon) {
            return {
              id: addon.id,
              name: addon.name,
              description: addon.description,
              price: addon.price,
            }
          } else {
            return {
              id: stringId,
              name: `Custom Service (ID: ${stringId})`,
              description: "This custom service is no longer available in settings",
              price: 0,
            }
          }
        })
      }

      return {
        ...booking,
        customAddOnsWithDetails,
      }
    })

    return NextResponse.json({
      bookings: enhancedBookings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching bookings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
