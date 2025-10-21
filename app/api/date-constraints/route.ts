import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date")

    if (!date) {
      return NextResponse.json({ error: "Date parameter is required" }, { status: 400 })
    }

    const db = await getDatabase()
    const bookingDate = new Date(date)
    const dayMid = new Date(bookingDate.getFullYear(), bookingDate.getMonth(), bookingDate.getDate())

    // Check admin block for camping scope
    const block = await db.collection("dateBlocks").findOne({ date: dayMid, scope: "camping" })
    if (block) {
      return NextResponse.json({
        blocked: true,
        blockedReason: block.reason || null,
        // Provide safe defaults so UI remains stable
        lockedLocation: null,
        totalTents: 0,
        remainingCapacity: 0,
        availableLocations: [],
        bookedArrivalTimes: [],
        maxBookingsReached: true,
      })
    }

    const settings = await db.collection("settings").findOne({})
    const maxTentsPerDay = settings?.maxTentsPerDay || 15 // Default to 15 if not set

    const existingBookings = await db
      .collection("bookings")
      .find({
        bookingDate: bookingDate,
        isPaid: true, // Only count paid bookings
      })
      .toArray()

    const bookedArrivalTimes = existingBookings.map((booking) => booking.arrivalTime).filter((time) => time)

    if (existingBookings.length > 0) {
      const lockedLocation = existingBookings[0].location
      const totalTents = existingBookings.reduce((sum, booking) => sum + booking.numberOfTents, 0)

      return NextResponse.json({
        blocked: false,
        blockedReason: null,
        lockedLocation,
        totalTents,
        remainingCapacity: maxTentsPerDay - totalTents,
        availableLocations: [lockedLocation],
        bookedArrivalTimes,
        maxBookingsReached: existingBookings.length >= 3,
      })
    }

    return NextResponse.json({
      blocked: false,
      blockedReason: null,
      lockedLocation: null,
      totalTents: 0,
      remainingCapacity: maxTentsPerDay,
      availableLocations: ["Desert", "Mountain", "Wadi"],
      bookedArrivalTimes: [],
      maxBookingsReached: false,
    })
  } catch (error) {
    console.error("Error checking date constraints:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { date, location, tents } = await request.json()

    if (!date || !location || !tents) {
      return NextResponse.json({ error: "Date, location, and tents are required" }, { status: 400 })
    }

    const db = await getDatabase()
    const bookingDate = new Date(date)
    const dayMid = new Date(bookingDate.getFullYear(), bookingDate.getMonth(), bookingDate.getDate())

    // Check admin block for camping scope
    const block = await db.collection("dateBlocks").findOne({ date: dayMid, scope: "camping" })
    if (block) {
      return NextResponse.json(
        {
          error: "This date is blocked for camping. Reason: " + (block.reason || "No reason provided"),
        },
        { status: 403 },
      )
    }

    const settings = await db.collection("settings").findOne({})
    const maxTentsPerDay = settings?.maxTentsPerDay || 15 // Default to 15 if not set

    const existingBookings = await db
      .collection("bookings")
      .find({
        bookingDate: bookingDate,
        isPaid: true, // Only count paid bookings
      })
      .toArray()

    const lockedLocation = existingBookings.length > 0 ? existingBookings[0].location : location
    const totalTents = existingBookings.reduce((sum, booking) => sum + booking.numberOfTents, 0)

    // Update or create date location lock
    await db.collection("dateLocationLocks").updateOne(
      { date: bookingDate },
      {
        $set: {
          lockedLocation,
          totalTents, // Store actual total from bookings
          updatedAt: new Date(),
        },
      },
      { upsert: true },
    )

    return NextResponse.json({
      success: true,
      lockedLocation,
      totalTents,
      remainingCapacity: maxTentsPerDay - totalTents, // Use dynamic capacity
      maxBookingsReached: existingBookings.length >= 3,
    })
  } catch (error) {
    console.error("Error updating date constraints:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
