import { neon } from "@neondatabase/serverless"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 })
    }
    const sql = neon(process.env.DATABASE_URL)
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get("product_id")
    
    if (!productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 })
    }

    const history = await sql`
      SELECT id, price, currency, created_at
      FROM product_price_history
      WHERE product_id = ${parseInt(productId)}
      ORDER BY created_at DESC
      LIMIT 20
    `
    
    return NextResponse.json(history)
  } catch (error) {
    console.error("Error fetching price history:", error)
    return NextResponse.json({ error: "Failed to fetch price history" }, { status: 500 })
  }
}
