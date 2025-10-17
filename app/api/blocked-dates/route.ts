import { NextResponse, type NextRequest } from "next/server"
import { getDatabase } from "@/lib/mongodb"

function toMidnight(dateStr: string) {
  const d = new Date(dateStr)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const scope = searchParams.get("scope") // "camping" | "barbecue" | null
    const db = await getDatabase()
    const filter: any = {}
    if (scope) filter.scope = scope
    const items = await db.collection("dateBlocks").find(filter).sort({ date: 1 }).toArray()
    return NextResponse.json({ items })
  } catch (e) {
    console.error("[blocked-dates][GET] error:", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { date, scope, reason } = await request.json()
    if (!date || !scope || !["camping", "barbecue"].includes(scope)) {
      return NextResponse.json({ error: "date and valid scope are required" }, { status: 400 })
    }
    const day = toMidnight(date)
    const db = await getDatabase()
    await db.collection("dateBlocks").updateOne(
      { date: day, scope },
      {
        $set: {
          date: day,
          scope,
          reason: (reason || "").trim() || null,
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true },
    )
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("[blocked-dates][POST] error:", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
