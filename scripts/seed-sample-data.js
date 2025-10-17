import { MongoClient } from "mongodb"

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017"
const DB_NAME = "nomadic-booking"

async function seedSampleData() {
  const client = new MongoClient(MONGODB_URI)

  try {
    await client.connect()
    

    const db = client.db(DB_NAME)

    // Sample bookings
    const sampleBookings = [
      {
        customerName: "John Doe",
        customerEmail: "john@example.com",
        customerPhone: "+971501234567",
        bookingDate: new Date("2024-12-25"),
        location: "Desert",
        numberOfTents: 2,
        addOns: {
          charcoal: true,
          firewood: false,
          portableToilet: true,
        },
        hasChildren: true,
        notes: "Family camping trip",
        subtotal: 290,
        vat: 14.5,
        total: 304.5,
        isPaid: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        customerName: "Sarah Smith",
        customerEmail: "sarah@example.com",
        customerPhone: "+971507654321",
        bookingDate: new Date("2024-12-30"),
        location: "Mountain",
        numberOfTents: 1,
        addOns: {
          charcoal: false,
          firewood: true,
          portableToilet: false,
        },
        hasChildren: false,
        notes: "Solo adventure",
        subtotal: 180,
        vat: 9,
        total: 189,
        isPaid: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    // Check if bookings already exist
    const existingBookings = await db.collection("bookings").countDocuments()
    if (existingBookings === 0) {
      await db.collection("bookings").insertMany(sampleBookings)
      
    } else {
      console.log("[v0] Bookings already exist, skipping sample data")
    }

    
  } catch (error) {
    console.error("[v0] Failed to seed sample data:", error)
    throw error
  } finally {
    await client.close()
  }
}

// Run sample data seeding
seedSampleData().catch(console.error)
