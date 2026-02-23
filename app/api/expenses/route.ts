import { neon } from "@neondatabase/serverless"
import { NextRequest, NextResponse } from "next/server"

export async function GET() {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 })
    }
    const sql = neon(process.env.DATABASE_URL)
    const expenses = await sql`
      SELECT 
        id,
        description,
        amount,
        category,
        beneficiary,
        expense_date,
        notes,
        created_at
      FROM expenses
      ORDER BY expense_date DESC, created_at DESC
    `
    return NextResponse.json(expenses)
  } catch (error) {
    console.error("Error fetching expenses:", error)
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 })
    }
    const sql = neon(process.env.DATABASE_URL)
    const body = await request.json()
    const { description, amount, category, beneficiary, expense_date, notes } = body

    const result = await sql`
      INSERT INTO expenses (description, amount, category, beneficiary, expense_date, notes)
      VALUES (${description}, ${parseFloat(amount)}, ${category}, ${beneficiary || null}, ${expense_date}, ${notes || null})
      RETURNING id
    `
    return NextResponse.json({ success: true, id: result[0].id })
  } catch (error) {
    console.error("Error creating expense:", error)
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 })
    }
    const sql = neon(process.env.DATABASE_URL)
    const body = await request.json()
    const { id, description, amount, category, beneficiary, expense_date, notes } = body

    await sql`
      UPDATE expenses SET
        description = ${description},
        amount = ${parseFloat(amount)},
        category = ${category},
        beneficiary = ${beneficiary || null},
        expense_date = ${expense_date},
        notes = ${notes || null}
      WHERE id = ${id}
    `
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating expense:", error)
    return NextResponse.json({ error: "Failed to update expense" }, { status: 500 })
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

    await sql`DELETE FROM expenses WHERE id = ${parseInt(id)}`
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting expense:", error)
    return NextResponse.json({ error: "Failed to delete expense" }, { status: 500 })
  }
}
