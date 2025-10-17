//@ts-nocheck
import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import bcrypt from "bcryptjs"

export async function GET() {
  try {
    console.log("[v0] Testing database connection...")

    const db = await getDatabase()
    console.log("[v0] Database connected successfully")

    // Check if admin user exists
    const adminUser = await db.collection("users").findOne({ username: "admin" })
    console.log("[v0] Admin user found:", !!adminUser)

    if (adminUser) {
      console.log("[v0] Admin user details:", {
        username: adminUser.username,
        role: adminUser.role,
        hasPassword: !!adminUser.password,
      })

      // Test password verification
      const testPassword = await bcrypt.compare("Admin@123", adminUser.password)
      console.log("[v0] Password test result:", testPassword)
    }

    return NextResponse.json({
      success: true,
      dbConnected: true,
      adminExists: !!adminUser,
      adminRole: adminUser?.role,
      message: "Database connection and user verification successful",
    })
  } catch (error) {
    console.error("[v0] Test endpoint error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        message: "Database connection or user verification failed",
      },
      { status: 500 },
    )
  }
}
