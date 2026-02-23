import { neon } from "@neondatabase/serverless"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 })
    }
    const sql = neon(process.env.DATABASE_URL)
    
    const searchParams = request.nextUrl.searchParams
    const marketplace = searchParams.get("marketplace")
    const category = searchParams.get("category")
    const dateFilter = searchParams.get("date") || "30d"
    
    // Calculate date range
    const today = new Date()
    let startDate: Date
    
    switch (dateFilter) {
      case "today":
        startDate = new Date(today)
        startDate.setHours(0, 0, 0, 0)
        break
      case "yesterday":
        startDate = new Date(today)
        startDate.setDate(startDate.getDate() - 1)
        startDate.setHours(0, 0, 0, 0)
        break
      case "7d":
        startDate = new Date(today)
        startDate.setDate(startDate.getDate() - 7)
        break
      case "30d":
        startDate = new Date(today)
        startDate.setDate(startDate.getDate() - 30)
        break
      case "ytd":
        startDate = new Date(today.getFullYear(), 0, 1)
        break
      default:
        startDate = new Date(today)
        startDate.setDate(startDate.getDate() - 30)
    }
    
    const startDateStr = startDate.toISOString().split("T")[0]
    
    // Build filters
    const marketplaceFilter = marketplace && marketplace !== "all" ? parseInt(marketplace) : null
    const categoryFilter = category && category !== "all" ? `%${category}%` : null
    
    // Get sales summary
    let salesSummary
    if (marketplaceFilter && categoryFilter) {
      salesSummary = await sql`
        SELECT 
          COALESCE(SUM(sale_price - marketplace_fee), 0) as total_revenue,
          COALESCE(SUM(sale_price), 0) as gross_revenue,
          COALESCE(SUM(marketplace_fee), 0) as total_fees,
          COUNT(*) as total_orders
        FROM sales
        WHERE sale_date >= ${startDateStr}
          AND marketplace_id = ${marketplaceFilter}
          AND game ILIKE ${categoryFilter}
      `
    } else if (marketplaceFilter) {
      salesSummary = await sql`
        SELECT 
          COALESCE(SUM(sale_price - marketplace_fee), 0) as total_revenue,
          COALESCE(SUM(sale_price), 0) as gross_revenue,
          COALESCE(SUM(marketplace_fee), 0) as total_fees,
          COUNT(*) as total_orders
        FROM sales
        WHERE sale_date >= ${startDateStr}
          AND marketplace_id = ${marketplaceFilter}
      `
    } else if (categoryFilter) {
      salesSummary = await sql`
        SELECT 
          COALESCE(SUM(sale_price - marketplace_fee), 0) as total_revenue,
          COALESCE(SUM(sale_price), 0) as gross_revenue,
          COALESCE(SUM(marketplace_fee), 0) as total_fees,
          COUNT(*) as total_orders
        FROM sales
        WHERE sale_date >= ${startDateStr}
          AND game ILIKE ${categoryFilter}
      `
    } else {
      salesSummary = await sql`
        SELECT 
          COALESCE(SUM(sale_price - marketplace_fee), 0) as total_revenue,
          COALESCE(SUM(sale_price), 0) as gross_revenue,
          COALESCE(SUM(marketplace_fee), 0) as total_fees,
          COUNT(*) as total_orders
        FROM sales
        WHERE sale_date >= ${startDateStr}
      `
    }
    
    const totalOrders = parseInt(salesSummary[0]?.total_orders || "0")
    const totalRevenue = parseFloat(salesSummary[0]?.total_revenue || "0")
    const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0
    
    // Get costs summary
    const costsSummary = await sql`
      SELECT 
        COALESCE(SUM(CASE WHEN category = 'mao_de_obra' THEN amount ELSE 0 END), 0) as labor_cost,
        COALESCE(SUM(CASE WHEN category = 'dividendos' THEN amount ELSE 0 END), 0) as dividends_cost,
        COALESCE(SUM(CASE WHEN category = 'fornecedores' THEN amount ELSE 0 END), 0) as supplier_cost,
        COALESCE(SUM(CASE WHEN category = 'taxas' THEN amount ELSE 0 END), 0) as taxes_cost,
        COALESCE(SUM(amount), 0) as total_cost
      FROM expenses
      WHERE expense_date >= ${startDateStr}
    `
    
    // Get inventory cost (items in stock)
    const inventoryCost = await sql`
      SELECT COALESCE(SUM(cost_brl), 0) as stock_cost
      FROM inventory
      WHERE status IN ('disponivel', 'em_marketplace')
    `
    
    // Get daily sales data for area chart
    let dailySales
    if (marketplaceFilter && categoryFilter) {
      dailySales = await sql`
        SELECT sale_date, COALESCE(SUM(sale_price - marketplace_fee), 0) as revenue
        FROM sales
        WHERE sale_date >= ${startDateStr} AND marketplace_id = ${marketplaceFilter} AND game ILIKE ${categoryFilter}
        GROUP BY sale_date ORDER BY sale_date
      `
    } else if (marketplaceFilter) {
      dailySales = await sql`
        SELECT sale_date, COALESCE(SUM(sale_price - marketplace_fee), 0) as revenue
        FROM sales
        WHERE sale_date >= ${startDateStr} AND marketplace_id = ${marketplaceFilter}
        GROUP BY sale_date ORDER BY sale_date
      `
    } else if (categoryFilter) {
      dailySales = await sql`
        SELECT sale_date, COALESCE(SUM(sale_price - marketplace_fee), 0) as revenue
        FROM sales
        WHERE sale_date >= ${startDateStr} AND game ILIKE ${categoryFilter}
        GROUP BY sale_date ORDER BY sale_date
      `
    } else {
      dailySales = await sql`
        SELECT sale_date, COALESCE(SUM(sale_price - marketplace_fee), 0) as revenue
        FROM sales
        WHERE sale_date >= ${startDateStr}
        GROUP BY sale_date ORDER BY sale_date
      `
    }
    
    // Get daily costs for area chart
    const dailyCosts = await sql`
      SELECT expense_date as date, COALESCE(SUM(amount), 0) as cost
      FROM expenses
      WHERE expense_date >= ${startDateStr}
      GROUP BY expense_date ORDER BY expense_date
    `
    
    // Get current week sales
    const currentWeekStart = new Date()
    const dayOfWeek = currentWeekStart.getDay()
    currentWeekStart.setDate(currentWeekStart.getDate() - dayOfWeek)
    currentWeekStart.setHours(0, 0, 0, 0)
    const weekStartStr = currentWeekStart.toISOString().split("T")[0]
    
    let weeklySales
    if (marketplaceFilter && categoryFilter) {
      weeklySales = await sql`
        SELECT EXTRACT(DOW FROM sale_date) as day_of_week, COALESCE(SUM(sale_price - marketplace_fee), 0) as revenue, COUNT(*) as orders
        FROM sales WHERE sale_date >= ${weekStartStr} AND marketplace_id = ${marketplaceFilter} AND game ILIKE ${categoryFilter}
        GROUP BY EXTRACT(DOW FROM sale_date) ORDER BY day_of_week
      `
    } else if (marketplaceFilter) {
      weeklySales = await sql`
        SELECT EXTRACT(DOW FROM sale_date) as day_of_week, COALESCE(SUM(sale_price - marketplace_fee), 0) as revenue, COUNT(*) as orders
        FROM sales WHERE sale_date >= ${weekStartStr} AND marketplace_id = ${marketplaceFilter}
        GROUP BY EXTRACT(DOW FROM sale_date) ORDER BY day_of_week
      `
    } else if (categoryFilter) {
      weeklySales = await sql`
        SELECT EXTRACT(DOW FROM sale_date) as day_of_week, COALESCE(SUM(sale_price - marketplace_fee), 0) as revenue, COUNT(*) as orders
        FROM sales WHERE sale_date >= ${weekStartStr} AND game ILIKE ${categoryFilter}
        GROUP BY EXTRACT(DOW FROM sale_date) ORDER BY day_of_week
      `
    } else {
      weeklySales = await sql`
        SELECT EXTRACT(DOW FROM sale_date) as day_of_week, COALESCE(SUM(sale_price - marketplace_fee), 0) as revenue, COUNT(*) as orders
        FROM sales WHERE sale_date >= ${weekStartStr}
        GROUP BY EXTRACT(DOW FROM sale_date) ORDER BY day_of_week
      `
    }
    
    // Get inventory by category (using products table)
    const inventoryByGame = await sql`
      SELECT 
        COALESCE(c.name, 'Sem Categoria') as game,
        COALESCE(SUM(i.cost_brl), 0) as total_cost,
        COUNT(*) as item_count
      FROM inventory i
      LEFT JOIN products p ON i.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE i.status IN ('disponivel', 'em_marketplace')
      GROUP BY c.name
      ORDER BY total_cost DESC
    `
    
    // Get pending payments (items not paid yet) - using is_paid column
    const pendingPayments = await sql`
      SELECT 
        i.id, 
        i.description, 
        i.cost_original, 
        i.currency, 
        i.supplier_code, 
        i.purchase_date,
        p.sku,
        c.name as category_name
      FROM inventory i
      LEFT JOIN products p ON i.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE i.is_paid = false
      ORDER BY i.purchase_date DESC
      LIMIT 10
    `
    
    // Calculate total pending payment amount
    const pendingPaymentTotal = await sql`
      SELECT 
        COALESCE(SUM(cost_original), 0) as total_original,
        COALESCE(SUM(cost_brl), 0) as total_brl,
        currency,
        COUNT(*) as count
      FROM inventory
      WHERE is_paid = false
      GROUP BY currency
    `
    
    // Get last 5 paid items
    const lastPayments = await sql`
      SELECT 
        i.id, 
        i.description, 
        i.cost_original, 
        i.cost_brl, 
        i.currency, 
        i.exchange_rate, 
        i.supplier_code, 
        i.payment_date,
        i.purchase_date
      FROM inventory i
      WHERE i.is_paid = true AND i.payment_date IS NOT NULL
      ORDER BY i.payment_date DESC 
      LIMIT 5
    `
    
    // Get exchange rate history
    const exchangeHistory = await sql`
      SELECT purchase_date, currency, 
        SUM(cost_original * exchange_rate) / NULLIF(SUM(cost_original), 0) as weighted_rate
      FROM inventory
      WHERE exchange_rate IS NOT NULL AND exchange_rate > 0 
        AND purchase_date >= ${startDateStr} AND currency != 'BRL'
      GROUP BY purchase_date, currency
      ORDER BY purchase_date
    `
    
    // Get top products
    let topProducts
    if (marketplaceFilter && categoryFilter) {
      topProducts = await sql`
        SELECT s.description, s.game, p.sku, COUNT(*) as sales_count, COALESCE(SUM(s.sale_price - s.marketplace_fee), 0) as total_revenue
        FROM sales s
        LEFT JOIN products p ON s.product_id = p.id
        WHERE s.sale_date >= ${startDateStr} AND s.marketplace_id = ${marketplaceFilter} AND s.game ILIKE ${categoryFilter}
        GROUP BY s.description, s.game, p.sku ORDER BY sales_count DESC LIMIT 5
      `
    } else if (marketplaceFilter) {
      topProducts = await sql`
        SELECT s.description, s.game, p.sku, COUNT(*) as sales_count, COALESCE(SUM(s.sale_price - s.marketplace_fee), 0) as total_revenue
        FROM sales s
        LEFT JOIN products p ON s.product_id = p.id
        WHERE s.sale_date >= ${startDateStr} AND s.marketplace_id = ${marketplaceFilter}
        GROUP BY s.description, s.game, p.sku ORDER BY sales_count DESC LIMIT 5
      `
    } else if (categoryFilter) {
      topProducts = await sql`
        SELECT s.description, s.game, p.sku, COUNT(*) as sales_count, COALESCE(SUM(s.sale_price - s.marketplace_fee), 0) as total_revenue
        FROM sales s
        LEFT JOIN products p ON s.product_id = p.id
        WHERE s.sale_date >= ${startDateStr} AND s.game ILIKE ${categoryFilter}
        GROUP BY s.description, s.game, p.sku ORDER BY sales_count DESC LIMIT 5
      `
    } else {
      topProducts = await sql`
        SELECT s.description, s.game, p.sku, COUNT(*) as sales_count, COALESCE(SUM(s.sale_price - s.marketplace_fee), 0) as total_revenue
        FROM sales s
        LEFT JOIN products p ON s.product_id = p.id
        WHERE s.sale_date >= ${startDateStr}
        GROUP BY s.description, s.game, p.sku ORDER BY sales_count DESC LIMIT 5
      `
    }
    
    // Get recent activity - use separate queries and merge
    const recentSales = await sql`
      SELECT 'venda' as type, sale_code as code, description, sale_price as amount, sale_date as date, created_at
      FROM sales ORDER BY created_at DESC LIMIT 5
    `
    
    const recentPurchases = await sql`
      SELECT 'compra' as type, supplier_code as code, description, cost_brl as amount, purchase_date as date, created_at
      FROM inventory ORDER BY created_at DESC LIMIT 5
    `
    
    const recentActivity = [...recentSales, ...recentPurchases]
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10)
    
    // Get available filters
    const marketplaces = await sql`SELECT id, name FROM marketplaces ORDER BY name`
    const categories = await sql`SELECT DISTINCT game FROM sales WHERE game IS NOT NULL AND game != '' ORDER BY game`
    
    // Get inventory distribution by marketplace
    const inventoryByMarketplace = await sql`
      SELECT 
        COALESCE(m.name, 'Estoque Geral') as marketplace_name,
        i.marketplace_status,
        COUNT(*) as item_count,
        COALESCE(SUM(i.cost_brl), 0) as total_cost
      FROM inventory i
      LEFT JOIN marketplaces m ON i.marketplace_id = m.id
      WHERE i.status IN ('disponivel', 'em_marketplace')
      GROUP BY m.name, i.marketplace_status
      ORDER BY total_cost DESC
    `
    
    return NextResponse.json({
      summary: {
        totalRevenue,
        grossRevenue: parseFloat(salesSummary[0]?.gross_revenue || "0"),
        totalFees: parseFloat(salesSummary[0]?.total_fees || "0"),
        totalOrders,
        avgTicket,
        totalCost: parseFloat(costsSummary[0]?.total_cost || "0"),
        laborCost: parseFloat(costsSummary[0]?.labor_cost || "0"),
        dividendsCost: parseFloat(costsSummary[0]?.dividends_cost || "0"),
        supplierCost: parseFloat(costsSummary[0]?.supplier_cost || "0"),
        taxesCost: parseFloat(costsSummary[0]?.taxes_cost || "0"),
        stockCost: parseFloat(inventoryCost[0]?.stock_cost || "0"),
      },
      charts: {
        dailySales,
        dailyCosts,
        weeklySales,
        inventoryByGame,
        exchangeHistory,
        inventoryByMarketplace,
      },
      lists: {
        pendingPayments,
        pendingPaymentTotal,
        lastPayments,
        topProducts,
        recentActivity,
      },
      filters: {
        marketplaces,
        categories: categories.map((c: any) => c.game),
      },
    })
  } catch (error) {
    console.error("Error fetching dashboard data:", error)
    return NextResponse.json(
      { error: "Error fetching dashboard data: " + (error instanceof Error ? error.message : "Unknown error") },
      { status: 500 }
    )
  }
}
