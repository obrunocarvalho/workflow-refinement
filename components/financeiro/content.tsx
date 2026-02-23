"use client"

import React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Search, Edit, Trash2, DollarSign, Users, Percent, Truck, TrendingDown, Package } from "lucide-react"
import useSWR, { mutate } from "swr"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"

interface Expense {
  id: number
  description: string
  amount: number
  category: string
  beneficiary: string | null
  expense_date: string
  notes: string | null
  created_at: string
}

interface InventoryItem {
  id: number
  description: string
  login: string
  purchase_date: string
  supplier_id: number | null
  supplier_name: string
  original_cost: number
  original_currency: string
  exchange_rate: number | null
  cost_brl: number | null
  supplier_code: string | null
  status: string
}

interface Supplier {
  id: number
  name: string
  code: string
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const categoryOptions = [
  { value: "mao_de_obra", label: "Mão de Obra", icon: Users, color: "#3b82f6" },
  { value: "taxas", label: "Taxas e Impostos", icon: Percent, color: "#ef4444" },
  { value: "dividendos", label: "Dividendos aos Sócios", icon: DollarSign, color: "#22c55e" },
  { value: "outros", label: "Outros", icon: TrendingDown, color: "#6b7280" },
]

const categoryLabels: Record<string, string> = {
  mao_de_obra: "Mão de Obra",
  taxas: "Taxas e Impostos",
  dividendos: "Dividendos aos Sócios",
  fornecedores: "Gasto com Fornecedores",
  outros: "Outros",
}

const categoryColors: Record<string, string> = {
  mao_de_obra: "bg-blue-500",
  taxas: "bg-red-500",
  dividendos: "bg-green-500",
  fornecedores: "bg-amber-500",
  outros: "bg-gray-500",
}

export function FinanceiroContent() {
  const [activeTab, setActiveTab] = useState("overview")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterMonth, setFilterMonth] = useState<string>("all")
  const [currentCategory, setCurrentCategory] = useState<string>("")

  const { data: expenses, isLoading: expensesLoading } = useSWR<Expense[]>("/api/expenses", fetcher)
  const { data: inventory } = useSWR<InventoryItem[]>("/api/inventory", fetcher)
  const { data: suppliers } = useSWR<Supplier[]>("/api/suppliers", fetcher)

  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    category: "",
    beneficiary: "",
    expense_date: new Date().toISOString().split("T")[0],
    notes: "",
  })

  useEffect(() => {
    if (editingExpense) {
      setFormData({
        description: editingExpense.description,
        amount: editingExpense.amount.toString(),
        category: editingExpense.category,
        beneficiary: editingExpense.beneficiary || "",
        expense_date: editingExpense.expense_date.split("T")[0],
        notes: editingExpense.notes || "",
      })
    } else {
      setFormData({
        description: "",
        amount: "",
        category: currentCategory,
        beneficiary: "",
        expense_date: new Date().toISOString().split("T")[0],
        notes: "",
      })
    }
  }, [editingExpense, currentCategory])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const method = editingExpense ? "PUT" : "POST"
    const body = editingExpense ? { ...formData, id: editingExpense.id } : formData

    await fetch("/api/expenses", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    mutate("/api/expenses")
    setIsDialogOpen(false)
    setEditingExpense(null)
  }

  const handleDelete = async (id: number) => {
    if (confirm("Tem certeza que deseja excluir esta despesa?")) {
      await fetch(`/api/expenses?id=${id}`, { method: "DELETE" })
      mutate("/api/expenses")
    }
  }

  const openAddDialog = (category: string) => {
    setCurrentCategory(category)
    setEditingExpense(null)
    setFormData({
      description: "",
      amount: "",
      category: category,
      beneficiary: "",
      expense_date: new Date().toISOString().split("T")[0],
      notes: "",
    })
    setIsDialogOpen(true)
  }

  // Get unique months for filter
  const months = [...new Set(expenses?.map((e) => {
    const date = new Date(e.expense_date)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
  }) || [])]

  // Calculate totals by category
  const totalByCategory = (category: string) => {
    return expenses
      ?.filter(e => e.category === category)
      .reduce((acc, e) => acc + e.amount, 0) || 0
  }

  // Calculate supplier costs from inventory
  const supplierCosts = inventory?.reduce((acc, item) => acc + (item.cost_brl || 0), 0) || 0
  const supplierCostsByCurrency = inventory?.reduce((acc, item) => {
    const currency = item.original_currency || "BRL"
    if (!acc[currency]) acc[currency] = 0
    acc[currency] += item.original_cost
    return acc
  }, {} as Record<string, number>) || {}

  // Supplier breakdown
  const supplierBreakdown = suppliers?.map(supplier => {
    const items = inventory?.filter(i => i.supplier_id === supplier.id) || []
    const total = items.reduce((acc, i) => acc + (i.cost_brl || 0), 0)
    const count = items.length
    return { ...supplier, total, count }
  }).filter(s => s.count > 0).sort((a, b) => b.total - a.total) || []

  const totalExpenses = (expenses?.reduce((acc, e) => acc + e.amount, 0) || 0) + supplierCosts

  // Category data for pie chart
  const categoryData = [
    ...categoryOptions.map((cat) => ({
      name: cat.label,
      value: totalByCategory(cat.value),
      color: cat.color,
    })),
    { name: "Fornecedores", value: supplierCosts, color: "#f59e0b" }
  ].filter((item) => item.value > 0)

  // Monthly data for bar chart
  const monthlyData = months.slice(0, 6).map((month) => {
    const monthExpenses = expenses?.filter((e) => e.expense_date.startsWith(month)) || []
    const total = monthExpenses.reduce((acc, e) => acc + e.amount, 0)
    const [year, m] = month.split("-")
    const monthName = new Date(parseInt(year), parseInt(m) - 1).toLocaleDateString("pt-BR", { month: "short" })
    return { month: monthName, total }
  }).reverse()

  const filterExpensesByCategory = (category: string) => {
    return expenses?.filter((expense) => {
      const matchesCategory = expense.category === category
      const matchesSearch =
        expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (expense.beneficiary?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
        (expense.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
      const expenseMonth = expense.expense_date.slice(0, 7)
      const matchesMonth = filterMonth === "all" || expenseMonth === filterMonth
      return matchesCategory && matchesSearch && matchesMonth
    }) || []
  }

  const renderCategoryContent = (category: string, title: string, icon: any, color: string) => {
    const Icon = icon
    const filteredExpenses = filterExpensesByCategory(category)
    const categoryTotal = filteredExpenses.reduce((acc, e) => acc + e.amount, 0)

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg ${color.replace("text-", "bg-").replace("500", "100")} dark:bg-opacity-20`}>
              <Icon className={`h-6 w-6 ${color}`} />
            </div>
            <div>
              <h2 className="text-xl font-bold">{title}</h2>
              <p className="text-muted-foreground">
                Total: R$ {categoryTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          <Button onClick={() => openAddDialog(category)} className="gap-2">
            <Plus className="h-4 w-4" />
            Adicionar {title}
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por descrição, beneficiário..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={filterMonth} onValueChange={setFilterMonth}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Mês" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Meses</SelectItem>
                  {months.map((month) => {
                    const [year, m] = month.split("-")
                    const label = new Date(parseInt(year), parseInt(m) - 1).toLocaleDateString("pt-BR", {
                      month: "long",
                      year: "numeric",
                    })
                    return (
                      <SelectItem key={month} value={month}>
                        {label.charAt(0).toUpperCase() + label.slice(1)}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Beneficiário</TableHead>
                    <TableHead>Observações</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        Nenhum registro encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredExpenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell>
                          {new Date(expense.expense_date).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell className="font-medium max-w-[200px] truncate">
                          {expense.description}
                        </TableCell>
                        <TableCell>{expense.beneficiary || "-"}</TableCell>
                        <TableCell className="max-w-[200px] truncate text-muted-foreground">
                          {expense.notes || "-"}
                        </TableCell>
                        <TableCell className="text-right font-medium text-red-500">
                          R$ {expense.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                setEditingExpense(expense)
                                setIsDialogOpen(true)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500 hover:text-red-600"
                              onClick={() => handleDelete(expense.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Financeiro - Custos</h1>
          <p className="text-muted-foreground">
            Controle de custos operacionais da empresa
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="mao_de_obra">Mão de Obra</TabsTrigger>
          <TabsTrigger value="taxas">Taxas</TabsTrigger>
          <TabsTrigger value="dividendos">Dividendos</TabsTrigger>
          <TabsTrigger value="fornecedores">Fornecedores</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Custos</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">
                  R$ {totalExpenses.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setActiveTab("mao_de_obra")}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Mão de Obra</CardTitle>
                <Users className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  R$ {totalByCategory("mao_de_obra").toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setActiveTab("taxas")}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxas e Impostos</CardTitle>
                <Percent className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  R$ {totalByCategory("taxas").toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setActiveTab("dividendos")}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Dividendos</CardTitle>
                <DollarSign className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  R$ {totalByCategory("dividendos").toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setActiveTab("fornecedores")}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Fornecedores</CardTitle>
                <Truck className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  R$ {supplierCosts.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Categoria</CardTitle>
                <CardDescription>Proporção dos custos por tipo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {categoryData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number) => [
                            `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
                            "Valor",
                          ]}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      Nenhum dado para exibir
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Custos Mensais</CardTitle>
                <CardDescription>Evolução dos últimos 6 meses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {monthlyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="month" className="text-xs" />
                        <YAxis
                          tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
                          className="text-xs"
                        />
                        <Tooltip
                          formatter={(value: number) => [
                            `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
                            "Total",
                          ]}
                        />
                        <Bar dataKey="total" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      Nenhum dado para exibir
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Mão de Obra Tab */}
        <TabsContent value="mao_de_obra">
          {renderCategoryContent("mao_de_obra", "Mão de Obra", Users, "text-blue-500")}
        </TabsContent>

        {/* Taxas Tab */}
        <TabsContent value="taxas">
          {renderCategoryContent("taxas", "Taxas e Impostos", Percent, "text-red-500")}
        </TabsContent>

        {/* Dividendos Tab */}
        <TabsContent value="dividendos">
          {renderCategoryContent("dividendos", "Dividendos aos Sócios", DollarSign, "text-green-500")}
        </TabsContent>

        {/* Fornecedores Tab */}
        <TabsContent value="fornecedores" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-amber-100 dark:bg-amber-900/20">
                <Truck className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Gasto com Fornecedores</h2>
                <p className="text-muted-foreground">
                  Total: R$ {supplierCosts.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          {/* Currency Summary */}
          <div className="grid gap-4 md:grid-cols-4">
            {Object.entries(supplierCostsByCurrency).map(([currency, total]) => (
              <Card key={currency}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total em {currency}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {currency === "BRL" ? "R$" : currency === "USD" ? "US$" : "¥"} {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </div>
                </CardContent>
              </Card>
            ))}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Itens no Estoque</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{inventory?.length || 0}</div>
              </CardContent>
            </Card>
          </div>

          {/* Supplier Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Gastos por Fornecedor</CardTitle>
              <CardDescription>Resumo dos gastos com cada fornecedor</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fornecedor</TableHead>
                      <TableHead>Código</TableHead>
                      <TableHead className="text-center">Itens</TableHead>
                      <TableHead className="text-right">Total (R$)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {supplierBreakdown.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8">
                          Nenhum fornecedor com compras registradas
                        </TableCell>
                      </TableRow>
                    ) : (
                      supplierBreakdown.map((supplier) => (
                        <TableRow key={supplier.id}>
                          <TableCell className="font-medium">{supplier.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{supplier.code}</Badge>
                          </TableCell>
                          <TableCell className="text-center">{supplier.count}</TableCell>
                          <TableCell className="text-right font-medium text-amber-600">
                            R$ {supplier.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Inventory Items List */}
          <Card>
            <CardHeader>
              <CardTitle>Itens do Inventário</CardTitle>
              <CardDescription>Lista de todos os itens comprados de fornecedores</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Fornecedor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Custo Original</TableHead>
                      <TableHead className="text-right">Custo (R$)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventory?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          Nenhum item no inventário
                        </TableCell>
                      </TableRow>
                    ) : (
                      inventory?.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            {new Date(item.purchase_date).toLocaleDateString("pt-BR")}
                          </TableCell>
                          <TableCell className="font-medium max-w-[200px] truncate">
                            {item.description}
                          </TableCell>
                          <TableCell>{item.supplier_name}</TableCell>
                          <TableCell>
                            <Badge className={
                              item.status === "available" ? "bg-green-500" :
                              item.status === "sold" ? "bg-blue-500" : "bg-yellow-500"
                            }>
                              {item.status === "available" ? "Disponível" :
                               item.status === "sold" ? "Vendido" : "Reservado"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {item.original_currency === "BRL" ? "R$" :
                             item.original_currency === "USD" ? "US$" : "¥"} {item.original_cost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-right font-medium text-amber-600">
                            {item.cost_brl ? `R$ ${item.cost_brl.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "-"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Expense Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open)
        if (!open) setEditingExpense(null)
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingExpense ? "Editar Despesa" : "Registrar Nova Despesa"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Ex: Pagamento funcionário João"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Valor (R$)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expense_date">Data</Label>
                <Input
                  id="expense_date"
                  type="date"
                  value={formData.expense_date}
                  onChange={(e) => setFormData((prev) => ({ ...prev, expense_date: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        <div className="flex items-center gap-2">
                          <cat.icon className="h-4 w-4" />
                          {cat.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="beneficiary">Beneficiário</Label>
                <Input
                  id="beneficiary"
                  value={formData.beneficiary}
                  onChange={(e) => setFormData((prev) => ({ ...prev, beneficiary: e.target.value }))}
                  placeholder="Nome do beneficiário"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Observações adicionais..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => {
                setIsDialogOpen(false)
                setEditingExpense(null)
              }}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingExpense ? "Salvar Alterações" : "Registrar Despesa"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
