import { neon } from "@neondatabase/serverless"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 })
    }
    const sql = neon(process.env.DATABASE_URL)
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const categoryId = searchParams.get("category_id")
    
    let products
    if (search) {
      const searchTerm = `%${search}%`
      products = await sql`
        SELECT 
          p.id, p.sku, p.description, p.category_id, c.name as category_name,
          p.supplier_id, s.name as supplier_name,
          p.current_price, p.currency, p.is_active, p.created_at
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN suppliers s ON p.supplier_id = s.id
        WHERE (p.sku ILIKE ${searchTerm} OR p.description ILIKE ${searchTerm})
          AND p.is_active = true
        ORDER BY p.description
      `
    } else if (categoryId) {
      products = await sql`
        SELECT 
          p.id, p.sku, p.description, p.category_id, c.name as category_name,
          p.supplier_id, s.name as supplier_name,
          p.current_price, p.currency, p.is_active, p.created_at
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN suppliers s ON p.supplier_id = s.id
        WHERE p.category_id = ${parseInt(categoryId)}
        ORDER BY p.description
      `
    } else {
      products = await sql`
        SELECT 
          p.id, p.sku, p.description, p.category_id, c.name as category_name,
          p.supplier_id, s.name as supplier_name,
          p.current_price, p.currency, p.is_active, p.created_at
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN suppliers s ON p.supplier_id = s.id
        ORDER BY c.name, p.description
      `
    }
    
    return NextResponse.json(products)
  } catch (error) {
    console.error("Error fetching products:", error)
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 })
    }
    const sql = neon(process.env.DATABASE_URL)
    const body = await request.json()
    const { sku, description, category_id, supplier_id, current_price, currency } = body

    if (!sku || !description || !category_id) {
      return NextResponse.json({ error: "SKU, description and category are required" }, { status: 400 })
    }

    // Check if SKU already exists
    const existing = await sql`SELECT id FROM products WHERE sku = ${sku}`
    if (existing.length > 0) {
      return NextResponse.json({ error: "SKU already exists" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO products (sku, description, category_id, supplier_id, current_price, currency)
      VALUES (
        ${sku}, 
        ${description}, 
        ${parseInt(category_id)}, 
        ${supplier_id ? parseInt(supplier_id) : null},
        ${current_price ? parseFloat(current_price) : null},
        ${currency || 'BRL'}
      )
      RETURNING id
    `

    // Create price history entry if price was provided
    if (current_price) {
      await sql`
        INSERT INTO product_price_history (product_id, price, currency)
        VALUES (${result[0].id}, ${parseFloat(current_price)}, ${currency || 'BRL'})
      `
    }

    return NextResponse.json({ success: true, id: result[0].id })
  } catch (error) {
    console.error("Error creating product:", error)
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 })
    }
    const sql = neon(process.env.DATABASE_URL)
    const body = await request.json()
    const { id, sku, description, category_id, supplier_id, current_price, currency, is_active } = body

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 })
    }

    // Get current price to check if it changed
    const currentProduct = await sql`SELECT current_price, currency FROM products WHERE id = ${id}`
    const oldPrice = currentProduct[0]?.current_price
    const oldCurrency = currentProduct[0]?.currency

    await sql`
      UPDATE products SET
        sku = ${sku},
        description = ${description},
        category_id = ${parseInt(category_id)},
        supplier_id = ${supplier_id ? parseInt(supplier_id) : null},
        current_price = ${current_price ? parseFloat(current_price) : null},
        currency = ${currency || 'BRL'},
        is_active = ${is_active !== false}
      WHERE id = ${id}
    `

    // Create price history entry if price changed
    if (current_price && (parseFloat(current_price) !== parseFloat(oldPrice) || currency !== oldCurrency)) {
      await sql`
        INSERT INTO product_price_history (product_id, price, currency)
        VALUES (${id}, ${parseFloat(current_price)}, ${currency || 'BRL'})
      `
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating product:", error)
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 })
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

    // Soft delete - just set is_active to false
    await sql`UPDATE products SET is_active = false WHERE id = ${parseInt(id)}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting product:", error)
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 })
  }
}
