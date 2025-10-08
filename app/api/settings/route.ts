import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

type BBQSettings = {
  groupPrices: { 10: number; 15: number; 20: number }
  vatRate: number
  addOnPrices: { charcoal: number; firewood: number; portableToilet: number }
  customAddOns: Array<{ id: string; name: string; price: number; description?: string }>
  updatedAt?: Date
}

const DEFAULTS: BBQSettings = {
  groupPrices: { 10: 1497, 15: 1697, 20: 1897 },
  vatRate: 0.05,
  addOnPrices: { charcoal: 60, firewood: 75, portableToilet: 200 },
  customAddOns: [],
}

export async function GET() {
  try {
    const db = await getDatabase()
    let settings = await db.collection("barbecue_settings").findOne({})
    if (!settings) {
      const result = await db.collection("barbecue_settings").insertOne({ ...DEFAULTS, updatedAt: new Date() })
      settings = { _id: result.insertedId, ...DEFAULTS }
    }
    return NextResponse.json({
      groupPrices: settings.groupPrices ?? DEFAULTS.groupPrices,
      vatRate: settings.vatRate ?? DEFAULTS.vatRate,
      addOnPrices: settings.addOnPrices ?? DEFAULTS.addOnPrices,
      customAddOns: settings.customAddOns ?? [],
    })
  } catch (e) {
    console.error("BBQ settings GET error:", e)
    return NextResponse.json(DEFAULTS, { status: 200 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const payload = (await request.json()) as Partial<BBQSettings>
    const clean: BBQSettings = {
      groupPrices: {
        10: Number(payload.groupPrices?.[10] ?? DEFAULTS.groupPrices[10]),
        15: Number(payload.groupPrices?.[15] ?? DEFAULTS.groupPrices[15]),
        20: Number(payload.groupPrices?.[20] ?? DEFAULTS.groupPrices[20]),
      },
      vatRate: typeof payload.vatRate === "number" ? payload.vatRate : DEFAULTS.vatRate,
      addOnPrices: {
        charcoal: Number(payload.addOnPrices?.charcoal ?? DEFAULTS.addOnPrices.charcoal),
        firewood: Number(payload.addOnPrices?.firewood ?? DEFAULTS.addOnPrices.firewood),
        portableToilet: Number(payload.addOnPrices?.portableToilet ?? DEFAULTS.addOnPrices.portableToilet),
      },
      customAddOns: (payload.customAddOns ?? []).map((a) => ({
        id: a.id || Date.now().toString(),
        name: a.name || "",
        price: Number(a.price) || 0,
        description: a.description || "",
      })),
      updatedAt: new Date(),
    }

    const db = await getDatabase()
    await db.collection("barbecue_settings").updateOne({}, { $set: clean }, { upsert: true })
    return NextResponse.json(clean)
  } catch (e) {
    console.error("BBQ settings PATCH error:", e)
    return NextResponse.json({ error: "Failed to update BBQ settings" }, { status: 500 })
  }
}
