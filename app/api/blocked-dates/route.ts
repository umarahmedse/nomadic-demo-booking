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
    const items = await db.collection("dateBlocks").find(filter).sort({ startDate: 1 }).toArray()
    return NextResponse.json({ items })
  } catch (e) {
    console.error("[blocked-dates][GET] error:", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    let { startDate, endDate, date, scope, reason } = await request.json()

    // Convert single date to startDate if provided
    if (date && !startDate) {
      startDate = date
    }

    if (!startDate || !scope || !["camping", "barbecue"].includes(scope)) {
      return NextResponse.json({ error: "startDate and valid scope are required" }, { status: 400 })
    }

    const start = toMidnight(startDate)
    const end = endDate ? toMidnight(endDate) : start

    // Ensure end date is not before start date
    if (end < start) {
      return NextResponse.json({ error: "End date must be after or equal to start date" }, { status: 400 })
    }

    const db = await getDatabase()
    await db.collection("dateBlocks").insertOne({
      startDate: start,
      endDate: end,
      scope,
      reason: (reason || "").trim() || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("[blocked-dates][POST] error:", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
