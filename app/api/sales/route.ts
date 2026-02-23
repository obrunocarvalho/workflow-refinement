import { neon } from "@neondatabase/serverless"
import { NextRequest, NextResponse } from "next/server"

export async function GET() {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 })
    }
    const sql = neon(process.env.DATABASE_URL)
    const sales = await sql`
      SELECT 
        s.id,
        s.sale_code,
        s.sale_date,
        s.sale_price,
        s.description,
        s.login,
        s.login_post_sale as post_sale_login,
        s.buyer,
        s.marketplace_id,
        COALESCE(m.name, 'Desconhecido') as marketplace_name,
        s.marketplace_fee,
        s.game,
        s.link,
        s.product_id,
        p.sku as product_sku,
        p.description as product_description,
        c.name as category_name,
        s.inventory_id,
        i.cost_brl as inventory_cost
      FROM sales s
      LEFT JOIN marketplaces m ON s.marketplace_id = m.id
      LEFT JOIN products p ON s.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN inventory i ON s.inventory_id = i.id
      ORDER BY s.sale_date DESC, s.created_at DESC
    `
    return NextResponse.json(sales)
  } catch (error) {
    console.error("Error fetching sales:", error)
    return NextResponse.json({ error: "Failed to fetch sales" }, { status: 500 })
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
          sale_code,
          sale_date,
          sale_price,
          description,
          login,
          post_sale_login,
          buyer,
          marketplace_id,
          marketplace_fee,
          game,
          link,
          product_id,
          inventory_id,
        } = item

        const result = await sql`
          INSERT INTO sales (
            sale_code, sale_date, sale_price, description, login, 
            login_post_sale, buyer, marketplace_id, marketplace_fee, game, link,
            product_id, inventory_id
          ) VALUES (
            ${sale_code}, ${sale_date}, ${parseFloat(sale_price) || 0}, ${description}, ${login},
            ${post_sale_login || null}, ${buyer}, ${marketplace_id ? parseInt(marketplace_id) : null}, 
            ${parseFloat(marketplace_fee) || 0}, ${game || null}, ${link || null},
            ${product_id ? parseInt(product_id) : null}, ${inventory_id ? parseInt(inventory_id) : null}
          )
          RETURNING id
        `
        results.push(result[0].id)

        // Mark inventory item as sold if linked
        if (inventory_id) {
          await sql`UPDATE inventory SET status = 'sold' WHERE id = ${parseInt(inventory_id)}`
        }
      }
      return NextResponse.json({ success: true, ids: results, count: results.length })
    }

    // Handle single item
    const {
      sale_code,
      sale_date,
      sale_price,
      description,
      login,
      post_sale_login,
      buyer,
      marketplace_id,
      marketplace_fee,
      game,
      link,
      product_id,
      inventory_id,
    } = body

    const result = await sql`
      INSERT INTO sales (
        sale_code, sale_date, sale_price, description, login, 
        login_post_sale, buyer, marketplace_id, marketplace_fee, game, link,
        product_id, inventory_id
      ) VALUES (
        ${sale_code}, ${sale_date}, ${parseFloat(sale_price)}, ${description}, ${login},
        ${post_sale_login || null}, ${buyer}, ${marketplace_id ? parseInt(marketplace_id) : null}, 
        ${parseFloat(marketplace_fee)}, ${game}, ${link || null},
        ${product_id ? parseInt(product_id) : null}, ${inventory_id ? parseInt(inventory_id) : null}
      )
      RETURNING id
    `

    // Mark inventory item as sold if linked
    if (inventory_id) {
      await sql`UPDATE inventory SET status = 'sold' WHERE id = ${parseInt(inventory_id)}`
    }

    return NextResponse.json({ success: true, id: result[0].id })
  } catch (error) {
    console.error("Error creating sale:", error)
    return NextResponse.json({ error: "Failed to create sale" }, { status: 500 })
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
      sale_code,
      sale_date,
      sale_price,
      description,
      login,
      post_sale_login,
      buyer,
      marketplace_id,
      marketplace_fee,
      game,
      link,
      product_id,
      inventory_id,
    } = body

    // Get old inventory_id to potentially reset status
    const oldSale = await sql`SELECT inventory_id FROM sales WHERE id = ${id}`
    const oldInventoryId = oldSale[0]?.inventory_id

    await sql`
      UPDATE sales SET
        sale_code = ${sale_code},
        sale_date = ${sale_date},
        sale_price = ${parseFloat(sale_price)},
        description = ${description},
        login = ${login},
        login_post_sale = ${post_sale_login || null},
        buyer = ${buyer},
        marketplace_id = ${marketplace_id ? parseInt(marketplace_id) : null},
        marketplace_fee = ${parseFloat(marketplace_fee)},
        game = ${game},
        link = ${link || null},
        product_id = ${product_id ? parseInt(product_id) : null},
        inventory_id = ${inventory_id ? parseInt(inventory_id) : null}
      WHERE id = ${id}
    `

    // Update inventory statuses
    if (oldInventoryId && oldInventoryId !== parseInt(inventory_id)) {
      await sql`UPDATE inventory SET status = 'available' WHERE id = ${oldInventoryId}`
    }
    if (inventory_id) {
      await sql`UPDATE inventory SET status = 'sold' WHERE id = ${parseInt(inventory_id)}`
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating sale:", error)
    return NextResponse.json({ error: "Failed to update sale" }, { status: 500 })
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

    // Get inventory_id to reset status
    const sale = await sql`SELECT inventory_id FROM sales WHERE id = ${parseInt(id)}`
    const inventoryId = sale[0]?.inventory_id

    await sql`DELETE FROM sales WHERE id = ${parseInt(id)}`

    // Reset inventory status if linked
    if (inventoryId) {
      await sql`UPDATE inventory SET status = 'available' WHERE id = ${inventoryId}`
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting sale:", error)
    return NextResponse.json({ error: "Failed to delete sale" }, { status: 500 })
  }
}
