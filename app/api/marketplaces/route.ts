import { neon } from "@neondatabase/serverless"
import { NextRequest, NextResponse } from "next/server"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const marketplaces = await sql`
      SELECT id, name, default_fee as fee_percentage
      FROM marketplaces
      ORDER BY name
    `
    return NextResponse.json(marketplaces)
  } catch (error) {
    console.error("Error fetching marketplaces:", error)
    return NextResponse.json({ error: "Failed to fetch marketplaces" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, fee_percentage } = body

    const result = await sql`
      INSERT INTO marketplaces (name, default_fee)
      VALUES (${name}, ${parseFloat(fee_percentage)})
      RETURNING id
    `
    return NextResponse.json({ success: true, id: result[0].id })
  } catch (error) {
    console.error("Error creating marketplace:", error)
    return NextResponse.json({ error: "Failed to create marketplace" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, fee_percentage } = body

    await sql`
      UPDATE marketplaces SET
        name = ${name},
        default_fee = ${parseFloat(fee_percentage)}
      WHERE id = ${id}
    `
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating marketplace:", error)
    return NextResponse.json({ error: "Failed to update marketplace" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 })
    }

    await sql`DELETE FROM marketplaces WHERE id = ${parseInt(id)}`
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting marketplace:", error)
    return NextResponse.json({ error: "Failed to delete marketplace" }, { status: 500 })
  }
}
