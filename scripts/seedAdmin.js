// scripts/seedAdmin.js
const { MongoClient } = require("mongodb")
const bcrypt = require("bcryptjs")

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017"
const DB_NAME = "nomadic-booking"

async function seedAdmin() {
  const client = new MongoClient(MONGODB_URI)
  await client.connect()
  const db = client.db(DB_NAME)

  const username = "admin"
  const plainPassword = "Admin@123"
  const hashedPassword = await bcrypt.hash(plainPassword, 12)

  await db.collection("users").updateOne(
    { username },
    {
      $set: {
        username,
        password: hashedPassword,
        role: "admin",
        updatedAt: new Date(),
      },
    },
    { upsert: true }
  )

  console.log("✅ Admin user ready:", { username, password: plainPassword })
  await client.close()
}

seedAdmin().catch(console.error)
