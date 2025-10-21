import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
    const db = await getDatabase()
    await db.collection("dateBlocks").deleteOne({ _id: new ObjectId(id) })
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("[blocked-dates][DELETE] error:", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
