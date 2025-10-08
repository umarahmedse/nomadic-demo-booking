//@ts-nocheck
import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import type { Settings } from "@/lib/types"
import { DEFAULT_SETTINGS } from "@/lib/pricing"

export async function GET() {
  try {
    const db = await getDatabase()
    let settings = await db.collection("settings").findOne({})

    if (!settings) {
      // Create default settings if none exist
      const defaultSettings: Omit<Settings, "_id"> = {
        ...DEFAULT_SETTINGS,
        customAddOns: [], // Ensure customAddOns is always an array
        discounts: [],
        updatedAt: new Date(),
      }

      const result = await db.collection("settings").insertOne(defaultSettings)
      settings = { _id: result.insertedId, ...defaultSettings }
    }

    if (!settings.customAddOns) {
      settings.customAddOns = []
    }

    const response = NextResponse.json(settings)
    response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate")
    response.headers.set("Pragma", "no-cache")
    response.headers.set("Expires", "0")

    return response
  } catch (error) {
    console.error("Error fetching settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const updates = await request.json()
    const db = await getDatabase()

    const settingsUpdate = {
      ...updates,
      updatedAt: new Date(),
    }

    if (settingsUpdate.customAddOns) {
      settingsUpdate.customAddOns = settingsUpdate.customAddOns.map((addon: any) => ({
        id: addon.id || Date.now().toString(),
        name: addon.name || "",
        price: Number(addon.price) || 0,
        description: addon.description || "",
      }))
    }

    delete settingsUpdate._id

    const result = await db.collection("settings").updateOne(
      {},
      {
        $set: settingsUpdate,
      },
      { upsert: true },
    )

    if (result.acknowledged) {
      const updatedSettings = await db.collection("settings").findOne({})

      const response = NextResponse.json({
        success: true,
        settings: updatedSettings,
      })

      response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate")
      response.headers.set("Pragma", "no-cache")
      response.headers.set("Expires", "0")

      return response
    } else {
      throw new Error("Database update was not acknowledged")
    }
  } catch (error) {
    console.error("Error updating settings:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
        details: error instanceof Error ? error.stack : "Unknown error",
      },
      { status: 500 },
    )
  }
}
