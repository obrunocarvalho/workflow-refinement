"use client"

import { useState } from "react"
import useSWR from "swr"
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Package,
  AlertCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Store,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
} from "recharts"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"]

const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("pt-BR")
}

export default function DashboardContent() {
  const [marketplace, setMarketplace] = useState<string>("all")
  const [category, setCategory] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<string>("30d")

  const queryParams = new URLSearchParams()
  if (marketplace && marketplace !== "all") queryParams.set("marketplace", marketplace)
  if (category && category !== "all") queryParams.set("category", category)
  queryParams.set("date", dateFilter)

  const { data, error, isLoading } = useSWR(
    `/api/dashboard?${queryParams.toString()}`,
    fetcher,
    { refreshInterval: 30000 }
  )

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg">
          Erro ao carregar dados do dashboard: {error.message}
        </div>
      </div>
    )
  }

  // Prepare area chart data combining sales and costs
  const areaChartData = data?.charts?.dailySales?.map((sale: any) => {
    const costForDay = data?.charts?.dailyCosts?.find(
      (c: any) => c.date === sale.sale_date
    )
    return {
      date: formatDate(sale.sale_date),
      faturamento: parseFloat(sale.revenue),
      custoTotal: costForDay ? parseFloat(costForDay.cost) : 0,
      custoEstoque: data?.summary?.stockCost || 0,
    }
  }) || []

  // Prepare weekly chart data
  const weeklyChartData = dayNames.map((day, index) => {
    const dayData = data?.charts?.weeklySales?.find((d: any) => parseInt(d.day_of_week) === index)
    return {
      day,
      faturamento: dayData ? parseFloat(dayData.revenue) : 0,
      pedidos: dayData ? parseInt(dayData.orders) : 0,
    }
  })

  // Prepare inventory by game data
  const inventoryData = data?.charts?.inventoryByGame?.map((item: any, index: number) => ({
    game: item.game || "Sem Categoria",
    custo: parseFloat(item.total_cost),
    quantidade: parseInt(item.item_count),
    color: COLORS[index % COLORS.length],
  })) || []

  const totalInventoryCost = inventoryData.reduce((sum: number, item: any) => sum + item.custo, 0)

  // Prepare pie chart data
  const pieData = inventoryData.map((item: any) => ({
    name: item.game,
    value: item.custo,
    percentage: totalInventoryCost > 0 ? ((item.custo / totalInventoryCost) * 100).toFixed(1) : 0,
  }))

  // Prepare exchange rate chart data
  const exchangeData = data?.charts?.exchangeHistory?.reduce((acc: any[], item: any) => {
    const existingDate = acc.find((d) => d.date === formatDate(item.purchase_date))
    if (existingDate) {
      existingDate[item.currency] = parseFloat(item.weighted_rate)
    } else {
      acc.push({
        date: formatDate(item.purchase_date),
        [item.currency]: parseFloat(item.weighted_rate),
      })
    }
    return acc
  }, []) || []

  // Calculate pending payment totals
  const pendingTotals = data?.lists?.pendingPaymentTotal?.reduce((acc: any, item: any) => {
    acc[item.currency] = {
      total: parseFloat(item.total_original),
      count: parseInt(item.count),
    }
    return acc
  }, {}) || {}

  return (
    <div className="space-y-6 w-full min-w-0">
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="w-full sm:w-auto">
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Marketplace</label>
              <Select value={marketplace} onValueChange={setMarketplace}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {data?.filters?.marketplaces?.map((m: any) => (
                    <SelectItem key={m.id} value={m.id.toString()}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-auto">
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Categoria (Jogo)</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {data?.filters?.categories?.map((c: string) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-auto">
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Período</label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="yesterday">Ontem</SelectItem>
                  <SelectItem value="7d">Últimos 7 dias</SelectItem>
                  <SelectItem value="30d">Últimos 30 dias</SelectItem>
                  <SelectItem value="ytd">Ano até agora</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento Líquido</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "..." : formatCurrency(data?.summary?.totalRevenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Bruto: {formatCurrency(data?.summary?.grossRevenue || 0)} | Taxas: {formatCurrency(data?.summary?.totalFees || 0)}
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Total Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "..." : data?.summary?.totalOrders || 0}
            </div>
            <p className="text-xs text-muted-foreground">vendas no período</p>
          </CardContent>
        </Card>

        {/* Card 3: Average Ticket */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "..." : formatCurrency(data?.summary?.avgTicket || 0)}
            </div>
            <p className="text-xs text-muted-foreground">por pedido</p>
          </CardContent>
        </Card>

        {/* Card 4: Total Costs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custos Totais</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "..." : formatCurrency(data?.summary?.totalCost || 0)}
            </div>
            <div className="flex items-center gap-1 text-xs">
              <Badge variant="outline" className="text-xs">
                Em estoque: {formatCurrency(data?.summary?.stockCost || 0)}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* First Row Charts - Revenue Overview & Weekly Sales */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 xl:grid-cols-2">
        {/* Area Chart - Revenue, Cost, Stock */}
        <Card>
          <CardHeader>
            <CardTitle>Visão Geral Financeira</CardTitle>
            <CardDescription>Faturamento, Custos e Estoque ao longo do tempo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {areaChartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  Nenhum dado disponível para o período
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={areaChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis 
                      tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
                      className="text-xs" 
                    />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      labelClassName="font-medium"
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="faturamento"
                      stackId="1"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.6}
                      name="Faturamento"
                    />
                    <Area
                      type="monotone"
                      dataKey="custoTotal"
                      stackId="2"
                      stroke="#ef4444"
                      fill="#ef4444"
                      fillOpacity={0.6}
                      name="Custo Total"
                    />
                    <Area
                      type="monotone"
                      dataKey="custoEstoque"
                      stackId="3"
                      stroke="#f59e0b"
                      fill="#f59e0b"
                      fillOpacity={0.4}
                      name="Custo Estoque"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Composed Chart - Weekly Sales */}
        <Card>
          <CardHeader>
            <CardTitle>Vendas da Semana</CardTitle>
            <CardDescription>Faturamento (barras) e Quantidade (linha)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={weeklyChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="day" className="text-xs" />
                  <YAxis 
                    yAxisId="left"
                    tickFormatter={(value) => `R$${value}`}
                    className="text-xs" 
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    className="text-xs" 
                  />
                  <Tooltip
                    formatter={(value: number, name: string) => 
                      name === "faturamento" ? formatCurrency(value) : value
                    }
                  />
                  <Legend />
                  <Bar
                    yAxisId="left"
                    dataKey="faturamento"
                    fill="#3b82f6"
                    name="Faturamento"
                    radius={[4, 4, 0, 0]}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="pedidos"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Pedidos"
                    dot={{ fill: "#10b981" }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second Row - Stock Analysis */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 xl:grid-cols-2">
        {/* Inventory List by Game */}
        <Card>
          <CardHeader>
            <CardTitle>Estoque por Categoria</CardTitle>
            <CardDescription>Custo total e quantidade de itens por jogo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {inventoryData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum item em estoque</p>
              ) : (
                inventoryData.map((item: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="font-medium">{item.game}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{formatCurrency(item.custo)}</div>
                      <div className="text-xs text-muted-foreground">{item.quantidade} itens</div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {inventoryData.length > 0 && (
              <div className="mt-4 pt-4 border-t flex justify-between items-center">
                <span className="font-medium">Total em Estoque</span>
                <span className="text-lg font-bold">{formatCurrency(totalInventoryCost)}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pie Chart - Stock Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição do Estoque</CardTitle>
            <CardDescription>Percentual por categoria</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {pieData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  Nenhum dado disponível
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                      labelLine={false}
                    >
                      {pieData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Third Row - Exchange & Payments */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 xl:grid-cols-2">
        {/* Payments Lists */}
        <Card>
          <CardHeader>
            <CardTitle>Pagamentos a Fornecedores</CardTitle>
            <CardDescription>Pendentes e últimos realizados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Pending Payments */}
              <div>
                <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  Pagamentos Pendentes
                  {Object.keys(pendingTotals).length > 0 && (
                    <div className="flex gap-2 ml-auto">
                      {Object.entries(pendingTotals).map(([currency, data]: [string, any]) => (
                        <Badge key={currency} variant="secondary" className="text-xs">
                          {currency}: {data.total.toFixed(2)} ({data.count})
                        </Badge>
                      ))}
                    </div>
                  )}
                </h4>
                {!data?.lists?.pendingPayments || data.lists.pendingPayments.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">Nenhum pagamento pendente</p>
                ) : (
                  <div className="space-y-2 max-h-[120px] overflow-y-auto">
                    {data.lists.pendingPayments.slice(0, 5).map((item: any) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2 rounded bg-amber-50 dark:bg-amber-900/20 text-sm"
                      >
                        <div>
                          <span className="truncate max-w-[180px] block font-medium">
                            {item.sku || item.description}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {item.supplier_code || "Sem código"} | {formatDate(item.purchase_date)}
                          </span>
                        </div>
                        <Badge variant="outline" className="bg-amber-100 dark:bg-amber-900/40">
                          {item.currency} {parseFloat(item.cost_original).toFixed(2)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Last Payments */}
              <div>
                <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-green-500" />
                  Últimos 5 Pagamentos
                </h4>
                {!data?.lists?.lastPayments || data.lists.lastPayments.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">Nenhum pagamento registrado</p>
                ) : (
                  <div className="space-y-2 max-h-[150px] overflow-y-auto">
                    {data.lists.lastPayments.map((item: any) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2 rounded bg-muted/50 text-sm"
                      >
                        <div>
                          <div className="font-medium truncate max-w-[150px]">{item.supplier_code || "N/A"}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatDate(item.payment_date || item.purchase_date)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-muted-foreground">
                            {item.currency} {parseFloat(item.cost_original).toFixed(2)}
                          </div>
                          <div className="font-medium">{formatCurrency(parseFloat(item.cost_brl || 0))}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Exchange Rate Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Câmbio</CardTitle>
            <CardDescription>Média ponderada por data de compra</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {exchangeData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  Nenhum dado de câmbio disponível
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={exchangeData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" domain={['auto', 'auto']} />
                    <Tooltip
                      formatter={(value: number) => `R$ ${value.toFixed(4)}`}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="USD"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="Dólar (USD)"
                      dot={{ fill: "#3b82f6" }}
                      connectNulls
                    />
                    <Line
                      type="monotone"
                      dataKey="CNY"
                      stroke="#ef4444"
                      strokeWidth={2}
                      name="Yuan (CNY)"
                      dot={{ fill: "#ef4444" }}
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fourth Row - Top Products & Recent Activity */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 xl:grid-cols-2">
        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Produtos</CardTitle>
            <CardDescription>Mais vendidos no período</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {!data?.lists?.topProducts || data.lists.topProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhuma venda no período</p>
              ) : (
                data.lists.topProducts.map((item: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium truncate max-w-[200px]">
                          {item.sku || item.description}
                        </div>
                        <div className="text-xs text-muted-foreground">{item.game}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{formatCurrency(parseFloat(item.total_revenue))}</div>
                      <div className="text-xs text-muted-foreground">{item.sales_count} vendas</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Atividades Recentes</CardTitle>
            <CardDescription>Últimas movimentações</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {!data?.lists?.recentActivity || data.lists.recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhuma atividade recente</p>
              ) : (
                data.lists.recentActivity.map((item: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          item.type === "venda"
                            ? "bg-green-100 dark:bg-green-900/30"
                            : "bg-blue-100 dark:bg-blue-900/30"
                        }`}
                      >
                        {item.type === "venda" ? (
                          <ArrowUpRight className="h-4 w-4 text-green-600 dark:text-green-400" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium truncate max-w-[180px]">
                          {item.code || item.description}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {item.type === "venda" ? "Venda" : "Compra"} | {formatDate(item.date)}
                        </div>
                      </div>
                    </div>
                    <div
                      className={`font-bold ${
                        item.type === "venda" ? "text-green-600 dark:text-green-400" : "text-blue-600 dark:text-blue-400"
                      }`}
                    >
                      {item.type === "venda" ? "+" : "-"}
                      {formatCurrency(parseFloat(item.amount || 0))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fifth Row - Inventory by Marketplace */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Distribuição do Estoque por Marketplace
          </CardTitle>
          <CardDescription>Visão de onde os produtos estão alocados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {!data?.charts?.inventoryByMarketplace || data.charts.inventoryByMarketplace.length === 0 ? (
              <p className="text-sm text-muted-foreground col-span-full text-center py-4">
                Nenhum item em estoque
              </p>
            ) : (
              data.charts.inventoryByMarketplace.map((item: any, index: number) => (
                <div
                  key={index}
                  className="p-4 rounded-lg border bg-card"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{item.marketplace_name}</span>
                    <Badge variant={item.marketplace_status === 'disponivel' ? 'default' : 'secondary'}>
                      {item.marketplace_status === 'disponivel' ? 'Em Estoque' : 
                       item.marketplace_status === 'enviado' ? 'Enviado' : 'Disponível'}
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold">{item.item_count}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatCurrency(parseFloat(item.total_cost))}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
