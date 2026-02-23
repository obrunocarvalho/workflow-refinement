import { neon } from "@neondatabase/serverless"
import { NextRequest, NextResponse } from "next/server"

export async function GET() {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 })
    }
    const sql = neon(process.env.DATABASE_URL)
    const inventory = await sql`
      SELECT 
        i.id,
        i.description,
        i.login,
        i.purchase_date,
        i.supplier_id,
        COALESCE(s.name, 'Sem fornecedor') as supplier_name,
        i.cost_original as original_cost,
        i.currency as original_currency,
        i.exchange_rate,
        i.cost_brl,
        i.supplier_code,
        i.status,
        i.product_id,
        p.sku as product_sku,
        p.description as product_description,
        p.category_id,
        c.name as category_name,
        i.is_paid,
        i.payment_date,
        i.marketplace_id,
        m.name as marketplace_name,
        i.marketplace_status,
        i.created_at
      FROM inventory i
      LEFT JOIN suppliers s ON i.supplier_id = s.id
      LEFT JOIN products p ON i.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN marketplaces m ON i.marketplace_id = m.id
      ORDER BY i.purchase_date DESC, i.created_at DESC
    `
    return NextResponse.json(inventory)
  } catch (error) {
    console.error("Error fetching inventory:", error)
    return NextResponse.json({ error: "Failed to fetch inventory" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 })
    }
    const sql = neon(process.env.DATABASE_URL)
    const body = await request.json()
    
    // Handle bulk import
    if (Array.isArray(body)) {
      const results = []
      for (const item of body) {
        const {
          description,
          login,
          purchase_date,
          supplier_id,
          original_cost,
          original_currency,
          exchange_rate,
          supplier_code,
          status,
          product_id,
          is_paid,
          payment_date,
          marketplace_id,
          marketplace_status,
        } = item

        const result = await sql`
          INSERT INTO inventory (
            description, login, purchase_date, supplier_id, cost_original,
            currency, exchange_rate, supplier_code, status, product_id,
            is_paid, payment_date, marketplace_id, marketplace_status
          ) VALUES (
            ${description}, ${login}, ${purchase_date}, ${supplier_id ? parseInt(supplier_id) : null},
            ${parseFloat(original_cost) || 0}, ${original_currency || 'BRL'}, ${exchange_rate ? parseFloat(exchange_rate) : null},
            ${supplier_code || null}, ${status || 'available'}, ${product_id ? parseInt(product_id) : null},
            ${is_paid !== false}, ${payment_date || null}, ${marketplace_id ? parseInt(marketplace_id) : null},
            ${marketplace_status || 'in_stock'}
          )
          RETURNING id
        `
        results.push(result[0].id)
      }
      return NextResponse.json({ success: true, ids: results, count: results.length })
    }

    // Handle single item
    const {
      description,
      login,
      purchase_date,
      supplier_id,
      original_cost,
      original_currency,
      exchange_rate,
      supplier_code,
      status,
      product_id,
      is_paid,
      payment_date,
      marketplace_id,
      marketplace_status,
    } = body

    const result = await sql`
      INSERT INTO inventory (
        description, login, purchase_date, supplier_id, cost_original,
        currency, exchange_rate, supplier_code, status, product_id,
        is_paid, payment_date, marketplace_id, marketplace_status
      ) VALUES (
        ${description}, ${login}, ${purchase_date}, ${supplier_id ? parseInt(supplier_id) : null},
        ${parseFloat(original_cost) || 0}, ${original_currency || 'BRL'}, ${exchange_rate ? parseFloat(exchange_rate) : null},
        ${supplier_code || null}, ${status || 'available'}, ${product_id ? parseInt(product_id) : null},
        ${is_paid !== false}, ${payment_date || null}, ${marketplace_id ? parseInt(marketplace_id) : null},
        ${marketplace_status || 'in_stock'}
      )
      RETURNING id
    `
    return NextResponse.json({ success: true, id: result[0].id })
  } catch (error) {
    console.error("Error creating inventory item:", error)
    return NextResponse.json({ error: "Failed to create inventory item" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 })
    }
    const sql = neon(process.env.DATABASE_URL)
    const body = await request.json()
    const {
      id,
      description,
      login,
      purchase_date,
      supplier_id,
      original_cost,
      original_currency,
      exchange_rate,
      supplier_code,
      status,
      product_id,
      is_paid,
      payment_date,
      marketplace_id,
      marketplace_status,
    } = body

    await sql`
      UPDATE inventory SET
        description = ${description},
        login = ${login},
        purchase_date = ${purchase_date},
        supplier_id = ${supplier_id ? parseInt(supplier_id) : null},
        cost_original = ${parseFloat(original_cost) || 0},
        currency = ${original_currency || 'BRL'},
        exchange_rate = ${exchange_rate ? parseFloat(exchange_rate) : null},
        supplier_code = ${supplier_code || null},
        status = ${status},
        product_id = ${product_id ? parseInt(product_id) : null},
        is_paid = ${is_paid !== false},
        payment_date = ${payment_date || null},
        marketplace_id = ${marketplace_id ? parseInt(marketplace_id) : null},
        marketplace_status = ${marketplace_status || 'in_stock'},
        updated_at = NOW()
      WHERE id = ${id}
    `
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating inventory item:", error)
    return NextResponse.json({ error: "Failed to update inventory item" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 })
    }
    const sql = neon(process.env.DATABASE_URL)
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 })
    }

    await sql`DELETE FROM inventory WHERE id = ${parseInt(id)}`
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting inventory item:", error)
    return NextResponse.json({ error: "Failed to delete inventory item" }, { status: 500 })
  }
}
