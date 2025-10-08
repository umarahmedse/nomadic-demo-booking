// @ts-nocheck
import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import bcrypt from "bcryptjs"

export async function POST(req: NextRequest) {
  try {
    const db = await getDatabase()
    const adminUsername = "admin"
    const adminPassword = "Admin@123"

    const existingAdmin = await db.collection("users").findOne({ username: adminUsername })

    const hashedPassword = await bcrypt.hash(adminPassword, 12)

    if (existingAdmin) {
      // Update password & role if exists
      await db.collection("users").updateOne(
        { username: adminUsername },
        {
          $set: {
            password: hashedPassword,
            role: "admin",
            updatedAt: new Date(),
          },
        },
      )

      return NextResponse.json(
        {
          message: "Admin updated",
          credentials: { username: adminUsername, password: adminPassword },
        },
        { status: 200 },
      )
    }

    // Create new admin if not exists
    await db.collection("users").insertOne({
      username: adminUsername,
      password: hashedPassword,
      role: "admin",
      createdAt: new Date(),
    })

    return NextResponse.json(
      {
        message: "Admin created",
        credentials: { username: adminUsername, password: adminPassword },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Seeder error:", error)
    return NextResponse.json({ error: "Failed to seed admin" }, { status: 500 })
  }
}
