import { MongoClient } from "mongodb"
import bcrypt from "bcryptjs"

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017"
const DB_NAME = "nomadic-booking"

async function createAdminUser() {
  const client = new MongoClient(MONGODB_URI)

  try {
    await client.connect()
   

    const db = client.db(DB_NAME)
    const usersCollection = db.collection("users")

   
    const existingAdmin = await usersCollection.findOne({ username: "admin" })

    if (existingAdmin) {
     

      const hashedPassword = await bcrypt.hash("Admin@123", 12)
      const updateResult = await usersCollection.updateOne(
        { username: "admin" },
        {
          $set: {
            password: hashedPassword,
            role: "admin",
            updatedAt: new Date(),
          },
        },
      )
     
    } else {
      console.log("[v0] Creating new admin user...")
      const hashedPassword = await bcrypt.hash("Admin@123", 12)

      const adminUser = {
        username: "admin",
        email: "admin@nomadic.com",
        password: hashedPassword,
        role: "admin",
        createdAt: new Date(),
      }

      const insertResult = await usersCollection.insertOne(adminUser)
      console.log("[v0] Insert result:", insertResult)
    }

    const verifyUser = await usersCollection.findOne({ username: "admin" })
    

    // Test password verification
    if (verifyUser?.password) {
      const passwordTest = await bcrypt.compare("Admin@123", verifyUser.password)
      console.log("[v0] - Password verification test:", passwordTest)
    }

    console.log("[v0] ✅ Admin user setup complete!")
    console.log("[v0] Username: admin")
    console.log("[v0] Password: Admin@123")
  } catch (error) {
    console.error("[v0] Failed to create/update admin user:", error)
    throw error
  } finally {
    await client.close()
  }
}

// Run admin user creation
createAdminUser().catch(console.error)
