import { MongoClient } from "mongodb"

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/my-database"
const DB_NAME = "nomadic-booking"

async function initializeDatabase() {
  const client = new MongoClient(MONGODB_URI)

  try {
    await client.connect()
   

    const db = client.db(DB_NAME)

    // Create collections if they don't exist
    const collections = ["users", "bookings", "settings", "dateLocationLocks"]

    for (const collectionName of collections) {
      const exists = await db.listCollections({ name: collectionName }).hasNext()
      if (!exists) {
        await db.createCollection(collectionName)
        
      }
    }

    // Create indexes for better performance
    await db.collection("bookings").createIndex({ bookingDate: 1, location: 1 })
    await db.collection("bookings").createIndex({ customerEmail: 1 })
    await db.collection("users").createIndex({ email: 1 }, { unique: true })
    await db.collection("dateLocationLocks").createIndex({ date: 1, lockedLocation: 1 }, { unique: true })

    

    // Initialize default settings if not exists
    const existingSettings = await db.collection("settings").findOne({})
    if (!existingSettings) {
      await db.collection("settings").insertOne({
        tentPrices: {
          singleTent: 150,
          multipleTents: 120,
        },
        addOnPrices: {
          charcoal: 25,
          firewood: 30,
          portableToilet: 50,
        },
        wadiSurcharge: 50,
        vatRate: 0.05,
        discounts: [],
        updatedAt: new Date(),
      })
      
    }

    
  } catch (error) {
    console.error("[v0] Database initialization failed:", error)
    throw error
  } finally {
    await client.close()
  }
}

// Run initialization
initializeDatabase().catch(console.error)
