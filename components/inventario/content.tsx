"use client"

import React, { useRef, useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
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
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  DollarSign,
  TrendingDown,
  Calculator,
  AlertTriangle,
  CheckCircle,
  Upload,
  Download,
  FileSpreadsheet,
  CreditCard,
  Store,
  Check,
  ChevronsUpDown,
  X,
  Banknote,
  Clock,
} from "lucide-react"
import useSWR, { mutate } from "swr"
import { cn } from "@/lib/utils"

interface Product {
  id: number
  sku: string
  description: string
  category_id: number
  category_name: string
  supplier_id: number | null
  supplier_name: string | null
  current_price: number | null
  currency: string
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
  product_id: number | null
  product_sku: string | null
  product_description: string | null
  category_id: number | null
  category_name: string | null
  is_paid: boolean
  payment_date: string | null
  marketplace_id: number | null
  marketplace_name: string | null
  marketplace_status: string
  created_at: string
}

interface Supplier {
  id: number
  name: string
  code: string
}

interface Marketplace {
  id: number
  name: string
}

interface Category {
  id: number
  name: string
}

const fetcher = async (url: string) => {
  const res = await fetch(url)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || "Erro ao carregar dados")
  return Array.isArray(data) ? data : []
}

const currencyOptions = [
  { value: "BRL", label: "Real (R$)", symbol: "R$" },
  { value: "USD", label: "Dólar (US$)", symbol: "US$" },
  { value: "CNY", label: "Yuan Chinês (¥)", symbol: "¥" },
]

const statusOptions = [
  { value: "available", label: "Disponível", color: "bg-green-500" },
  { value: "sold", label: "Vendido", color: "bg-blue-500" },
  { value: "reserved", label: "Reservado", color: "bg-yellow-500" },
]

const marketplaceStatusOptions = [
  { value: "in_stock", label: "Em Estoque", color: "bg-gray-500" },
  { value: "listed", label: "Anunciado", color: "bg-blue-500" },
  { value: "processing", label: "Processando", color: "bg-yellow-500" },
]

export function InventarioContent() {
  const [activeTab, setActiveTab] = useState("estoque")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [isAssignMarketplaceOpen, setIsAssignMarketplaceOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterSupplier, setFilterSupplier] = useState<string>("all")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [filterPayment, setFilterPayment] = useState<string>("all")
  const [filterMarketplace, setFilterMarketplace] = useState<string>("all")
  const [filterPendingQuote, setFilterPendingQuote] = useState(false)
  const [importData, setImportData] = useState<string>("")
  const [importError, setImportError] = useState<string>("")
  const [productSearchOpen, setProductSearchOpen] = useState(false)
  const [productSearchTerm, setProductSearchTerm] = useState("")
  const [selectedItemsForMarketplace, setSelectedItemsForMarketplace] = useState<number[]>([])
  const [assignMarketplaceId, setAssignMarketplaceId] = useState<string>("")
  const [assignMarketplaceStatus, setAssignMarketplaceStatus] = useState<string>("listed")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: inventory = [], isLoading, error: inventoryError } = useSWR<InventoryItem[]>("/api/inventory", fetcher)
  const { data: suppliers = [] } = useSWR<Supplier[]>("/api/suppliers", fetcher)
  const { data: products = [] } = useSWR<Product[]>("/api/products", fetcher)
  const { data: marketplaces = [] } = useSWR<Marketplace[]>("/api/marketplaces", fetcher)
  const { data: categories = [] } = useSWR<Category[]>("/api/categories", fetcher)
  
  // Safety checks for arrays
  const inventoryList = Array.isArray(inventory) ? inventory : []
  const suppliersList = Array.isArray(suppliers) ? suppliers : []
  const productsList = Array.isArray(products) ? products : []
  const marketplacesList = Array.isArray(marketplaces) ? marketplaces : []
  const categoriesList = Array.isArray(categories) ? categories : []

  // Search products for selection
  const { data: searchedProducts } = useSWR<Product[]>(
    productSearchTerm.length > 1 ? `/api/products?search=${encodeURIComponent(productSearchTerm)}` : null,
    fetcher
  )

  const [formData, setFormData] = useState({
    description: "",
    login: "",
    purchase_date: new Date().toISOString().split("T")[0],
    supplier_id: "",
    original_cost: "",
    original_currency: "BRL",
    exchange_rate: "",
    supplier_code: "",
    status: "available",
    product_id: "",
    is_paid: true,
    payment_date: "",
    marketplace_id: "",
    marketplace_status: "in_stock",
  })

  const [supplierFormData, setSupplierFormData] = useState({
    name: "",
    code: "",
  })

  useEffect(() => {
    if (editingItem) {
      setFormData({
        description: editingItem.description,
        login: editingItem.login,
        purchase_date: editingItem.purchase_date.split("T")[0],
        supplier_id: editingItem.supplier_id?.toString() || "",
        original_cost: editingItem.original_cost.toString(),
        original_currency: editingItem.original_currency || "BRL",
        exchange_rate: editingItem.exchange_rate?.toString() || "",
        supplier_code: editingItem.supplier_code || "",
        status: editingItem.status,
        product_id: editingItem.product_id?.toString() || "",
        is_paid: editingItem.is_paid,
        payment_date: editingItem.payment_date?.split("T")[0] || "",
        marketplace_id: editingItem.marketplace_id?.toString() || "",
        marketplace_status: editingItem.marketplace_status || "in_stock",
      })
      setProductSearchTerm(editingItem.product_sku || editingItem.product_description || "")
    } else {
      resetForm()
    }
  }, [editingItem])

  const resetForm = () => {
    setFormData({
      description: "",
      login: "",
      purchase_date: new Date().toISOString().split("T")[0],
      supplier_id: "",
      original_cost: "",
      original_currency: "BRL",
      exchange_rate: "",
      supplier_code: "",
      status: "available",
      product_id: "",
      is_paid: true,
      payment_date: "",
      marketplace_id: "",
      marketplace_status: "in_stock",
    })
    setProductSearchTerm("")
  }

  // Auto-set exchange rate to 1 for BRL
  useEffect(() => {
    if (formData.original_currency === "BRL") {
      setFormData((prev) => ({ ...prev, exchange_rate: "1" }))
    }
  }, [formData.original_currency])

  // Auto-fill price from selected product
  const handleProductSelect = (product: Product) => {
    setFormData((prev) => ({
      ...prev,
      product_id: product.id.toString(),
      description: product.description,
      original_cost: product.current_price?.toString() || prev.original_cost,
      original_currency: product.currency || "BRL",
      supplier_id: product.supplier_id?.toString() || prev.supplier_id,
    }))
    setProductSearchTerm(`${product.sku} - ${product.description}`)
    setProductSearchOpen(false)
  }

  const calculateCostBRL = () => {
    if (formData.original_cost && formData.exchange_rate) {
      return (parseFloat(formData.original_cost) * parseFloat(formData.exchange_rate)).toFixed(2)
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const method = editingItem ? "PUT" : "POST"
    const body = editingItem ? { ...formData, id: editingItem.id } : formData

    await fetch("/api/inventory", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    mutate("/api/inventory")
    setIsDialogOpen(false)
    setEditingItem(null)
    resetForm()
  }

  const handleSupplierSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await fetch("/api/suppliers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(supplierFormData),
    })

    mutate("/api/suppliers")
    setIsSupplierDialogOpen(false)
    setSupplierFormData({ name: "", code: "" })
  }

  const handleDelete = async (id: number) => {
    if (confirm("Tem certeza que deseja excluir este item?")) {
      await fetch(`/api/inventory?id=${id}`, { method: "DELETE" })
      mutate("/api/inventory")
    }
  }

  const handleMarkAsSold = async (item: InventoryItem) => {
    await fetch("/api/inventory", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        ...item, 
        status: "sold",
        original_cost: item.original_cost,
        original_currency: item.original_currency,
      }),
    })
    mutate("/api/inventory")
  }

  const handleMarkAsPaid = async (item: InventoryItem) => {
    await fetch("/api/inventory", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        ...item, 
        is_paid: true,
        payment_date: new Date().toISOString().split("T")[0],
        original_cost: item.original_cost,
        original_currency: item.original_currency,
      }),
    })
    mutate("/api/inventory")
  }

  const handleAssignMarketplace = async () => {
    if (!assignMarketplaceId || selectedItemsForMarketplace.length === 0) return
    
    for (const itemId of selectedItemsForMarketplace) {
      const item = inventoryList.find(i => i.id === itemId)
      if (item) {
        await fetch("/api/inventory", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            ...item, 
            marketplace_id: assignMarketplaceId,
            marketplace_status: assignMarketplaceStatus,
            original_cost: item.original_cost,
            original_currency: item.original_currency,
          }),
        })
      }
    }
    
    mutate("/api/inventory")
    setIsAssignMarketplaceOpen(false)
    setSelectedItemsForMarketplace([])
    setAssignMarketplaceId("")
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      setImportData(content)
    }
    reader.readAsText(file)
  }

  const parseImportData = (data: string): any[] => {
    const lines = data.trim().split("\n")
    if (lines.length < 2) throw new Error("Arquivo deve ter cabeçalho e pelo menos uma linha de dados")

    const header = lines[0].split(/[,;\t]/).map((h) => h.trim().toLowerCase())
    const items = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(/[,;\t]/)
      if (values.length < 3) continue

      const item: any = {
        description: "",
        login: "",
        purchase_date: new Date().toISOString().split("T")[0],
        supplier_id: null,
        original_cost: 0,
        original_currency: "BRL",
        exchange_rate: null,
        supplier_code: null,
        status: "available",
        is_paid: true,
        marketplace_status: "in_stock",
      }

      header.forEach((col, idx) => {
        const value = values[idx]?.trim() || ""
        if (col.includes("descri")) item.description = value
        else if (col.includes("login") || col.includes("email")) item.login = value
        else if (col.includes("data") || col.includes("date")) item.purchase_date = value
        else if (col.includes("custo") || col.includes("cost") || col.includes("valor"))
          item.original_cost = parseFloat(value) || 0
        else if (col.includes("moeda") || col.includes("currency"))
          item.original_currency = value.toUpperCase() || "BRL"
        else if (col.includes("cota") || col.includes("rate") || col.includes("cambio")) {
          item.exchange_rate = value ? parseFloat(value) : null
        } else if (col.includes("fornecedor") && col.includes("cod")) item.supplier_code = value || null
        else if (col.includes("status")) item.status = value || "available"
        else if (col.includes("pago") || col.includes("paid")) item.is_paid = value.toLowerCase() === "sim" || value === "1" || value.toLowerCase() === "true"
      })

      if (item.description && item.login) {
        items.push(item)
      }
    }

    return items
  }

  const handleImport = async () => {
    try {
      setImportError("")
      const items = parseImportData(importData)

      if (items.length === 0) {
        setImportError("Nenhum item válido encontrado no arquivo")
        return
      }

      const response = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(items),
      })

      if (response.ok) {
        const result = await response.json()
        alert(`${result.count} itens importados com sucesso!`)
        mutate("/api/inventory")
        setIsImportDialogOpen(false)
        setImportData("")
      } else {
        setImportError("Erro ao importar itens")
      }
    } catch (error: any) {
      setImportError(error.message || "Erro ao processar arquivo")
    }
  }

  const handleExport = () => {
    if (inventoryList.length === 0) return

    const headers = [
      "SKU",
      "Descrição",
      "Login",
      "Data Compra",
      "Categoria",
      "Fornecedor",
      "Cód. Fornecedor",
      "Custo Original",
      "Moeda",
      "Cotação",
      "Custo (R$)",
      "Status",
      "Pago",
      "Data Pagamento",
      "Marketplace",
      "Status Marketplace",
    ]
    const rows = inventoryList.map((item) => [
      item.product_sku || "",
      item.description,
      item.login,
      item.purchase_date.split("T")[0],
      item.category_name || "",
      item.supplier_name,
      item.supplier_code || "",
      item.original_cost,
      item.original_currency,
      item.exchange_rate || "",
      item.cost_brl || "",
      item.status,
      item.is_paid ? "Sim" : "Não",
      item.payment_date?.split("T")[0] || "",
      item.marketplace_name || "",
      item.marketplace_status,
    ])

    const csvContent = [headers.join(";"), ...rows.map((row) => row.join(";"))].join("\n")

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `inventario_${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Filtering
  const filteredInventory = inventoryList.filter((item) => {
    const matchesSearch =
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.login.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product_sku?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "all" || item.status === filterStatus
    const matchesSupplier = filterSupplier === "all" || item.supplier_id?.toString() === filterSupplier
    const matchesCategory = filterCategory === "all" || item.category_id?.toString() === filterCategory
    const matchesPayment =
      filterPayment === "all" ||
      (filterPayment === "paid" && item.is_paid) ||
      (filterPayment === "unpaid" && !item.is_paid)
    const matchesMarketplace =
      filterMarketplace === "all" ||
      (filterMarketplace === "none" && !item.marketplace_id) ||
      item.marketplace_id?.toString() === filterMarketplace
    const matchesPendingQuote =
      !filterPendingQuote || (item.exchange_rate === null && item.original_currency !== "BRL")
    return (
      matchesSearch &&
      matchesStatus &&
      matchesSupplier &&
      matchesCategory &&
      matchesPayment &&
      matchesMarketplace &&
      matchesPendingQuote
    )
  })

  const pendingQuoteItems =
inventoryList.filter(
      (item) => item.exchange_rate === null && item.original_currency !== "BRL" && item.status === "available"
    ) || []

  const unpaidItems = inventoryList.filter((item) => !item.is_paid && item.status !== "sold")

  const availableItems = filteredInventory?.filter((item) => item.status === "available") || []
  const totalItems = filteredInventory?.length || 0
  const totalCostBRL = filteredInventory?.reduce((acc, item) => acc + (item.cost_brl || 0), 0) || 0
  const avgCost = totalItems > 0 ? totalCostBRL / totalItems : 0

  const getCurrencySymbol = (currency: string) => {
    return currencyOptions.find((c) => c.value === currency)?.symbol || currency
  }

const formatCurrency = (value: number | string | null | undefined, currency: string = "BRL") => {
  if (value === null || value === undefined) return "-"
  const numValue = typeof value === "number" ? value : parseFloat(String(value))
  if (isNaN(numValue)) return "-"
  return `${getCurrencySymbol(currency)} ${numValue.toFixed(2)}`
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Inventário</h1>
          <p className="text-muted-foreground">Gerencie seu estoque de produtos digitais</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 bg-transparent" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Exportar
          </Button>

          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2 bg-transparent">
                <Upload className="h-4 w-4" />
                Importar
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Importar Inventário</DialogTitle>
                <DialogDescription>Importe múltiplos itens de um arquivo CSV, TXT ou XLSX</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg text-sm">
                  <p className="font-medium mb-2">Formato esperado (separado por vírgula, ponto-e-vírgula ou tab):</p>
                  <code className="text-xs">Descrição;Login;Data;Custo;Moeda;Cotação;Cód.Fornecedor;Status;Pago</code>
                  <p className="mt-2 text-muted-foreground">Moedas aceitas: BRL, USD, CNY. Cotação pode ficar em branco.</p>
                </div>

                <div className="space-y-2">
                  <Label>Selecionar arquivo</Label>
                  <Input ref={fileInputRef} type="file" accept=".csv,.txt,.xlsx" onChange={handleFileUpload} />
                </div>

                <div className="space-y-2">
                  <Label>Ou cole os dados diretamente</Label>
                  <textarea
                    className="w-full h-40 p-3 border rounded-md text-sm font-mono bg-background"
                    placeholder="Descrição;Login;Data;Custo;Moeda;Cotação;Cód.Fornecedor;Status;Pago&#10;Conta Steam;user@email.com;2024-01-15;10;USD;5.5;ABC123;available;Sim"
                    value={importData}
                    onChange={(e) => setImportData(e.target.value)}
                  />
                </div>

                {importError && <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm">{importError}</div>}

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleImport} disabled={!importData}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Importar Dados
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open)
              if (!open) {
                setEditingItem(null)
                resetForm()
              }
            }}
          >
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingItem ? "Editar Item" : "Adicionar Item ao Inventário"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Product Search */}
                <div className="space-y-2">
                  <Label>Produto (SKU)</Label>
                  <Popover open={productSearchOpen} onOpenChange={setProductSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={productSearchOpen}
                        className="w-full justify-between bg-transparent"
                      >
                        {productSearchTerm || "Buscar produto por SKU ou descrição..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput
                          placeholder="Digite SKU ou descrição..."
                          value={productSearchTerm}
                          onValueChange={setProductSearchTerm}
                        />
                        <CommandList>
                          <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>
                          <CommandGroup>
                            {(searchedProducts || products || []).slice(0, 10).map((product) => (
                              <CommandItem
                                key={product.id}
                                value={`${product.sku} ${product.description}`}
                                onSelect={() => handleProductSelect(product)}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    formData.product_id === product.id.toString() ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div className="flex flex-col">
                                  <span className="font-mono text-sm">{product.sku}</span>
                                  <span className="text-xs text-muted-foreground">{product.description}</span>
                                </div>
                                {product.current_price && (
                                  <span className="ml-auto text-xs">
                                    {formatCurrency(product.current_price, product.currency)}
                                  </span>
                                )}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <p className="text-xs text-muted-foreground">
                    Selecione um produto cadastrado para preencher automaticamente os dados
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Ex: Conta Steam com CS2 Prime"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="login">Login/Email</Label>
                    <Input
                      id="login"
                      value={formData.login}
                      onChange={(e) => setFormData((prev) => ({ ...prev, login: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="purchase_date">Data de Compra</Label>
                    <Input
                      id="purchase_date"
                      type="date"
                      value={formData.purchase_date}
                      onChange={(e) => setFormData((prev) => ({ ...prev, purchase_date: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="supplier_id">Fornecedor</Label>
                    <Select
                      value={formData.supplier_id}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, supplier_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione (opcional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sem fornecedor</SelectItem>
                        {suppliersList.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id.toString()}>
                            {supplier.name} ({supplier.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supplier_code">Código do Fornecedor</Label>
                    <Input
                      id="supplier_code"
                      value={formData.supplier_code}
                      onChange={(e) => setFormData((prev) => ({ ...prev, supplier_code: e.target.value }))}
                      placeholder="Código/ID no fornecedor"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="original_cost">Custo (Moeda Original)</Label>
                    <Input
                      id="original_cost"
                      type="number"
                      step="0.01"
                      value={formData.original_cost}
                      onChange={(e) => setFormData((prev) => ({ ...prev, original_cost: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="original_currency">Moeda</Label>
                    <Select
                      value={formData.original_currency}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, original_currency: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currencyOptions.map((currency) => (
                          <SelectItem key={currency.value} value={currency.value}>
                            {currency.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="exchange_rate">
                      Cotação {formData.original_currency !== "BRL" && "(opcional)"}
                    </Label>
                    <Input
                      id="exchange_rate"
                      type="number"
                      step="0.0001"
                      value={formData.exchange_rate}
                      onChange={(e) => setFormData((prev) => ({ ...prev, exchange_rate: e.target.value }))}
                      placeholder={formData.original_currency === "BRL" ? "1" : "Pendente"}
                      disabled={formData.original_currency === "BRL"}
                    />
                  </div>
                </div>

                {calculateCostBRL() && (
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <Calculator className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Custo em R$:</span>
                      <span className="font-medium">R$ {calculateCostBRL()}</span>
                    </div>
                  </div>
                )}

                {/* Payment Status */}
                <div className="p-4 border rounded-lg space-y-3">
                  <Label className="font-medium">Status de Pagamento</Label>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is_paid"
                      checked={formData.is_paid}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({
                          ...prev,
                          is_paid: checked as boolean,
                          payment_date: checked ? new Date().toISOString().split("T")[0] : "",
                        }))
                      }
                    />
                    <label htmlFor="is_paid" className="text-sm">
                      Já foi pago
                    </label>
                  </div>
                  {formData.is_paid && (
                    <div className="space-y-2">
                      <Label htmlFor="payment_date">Data do Pagamento</Label>
                      <Input
                        id="payment_date"
                        type="date"
                        value={formData.payment_date}
                        onChange={(e) => setFormData((prev) => ({ ...prev, payment_date: e.target.value }))}
                      />
                    </div>
                  )}
                </div>

                {/* Marketplace Assignment */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Marketplace</Label>
                    <Select
                      value={formData.marketplace_id}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, marketplace_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Em estoque (não atribuído)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Em estoque (não atribuído)</SelectItem>
                        {marketplacesList.map((mp) => (
                          <SelectItem key={mp.id} value={mp.id.toString()}>
                            {mp.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Status no Marketplace</Label>
                    <Select
                      value={formData.marketplace_status}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, marketplace_status: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {marketplaceStatusOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">Salvar</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Alerts */}
      {(pendingQuoteItems.length > 0 || unpaidItems.length > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          {pendingQuoteItems.length > 0 && (
            <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-900">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="font-medium text-yellow-800 dark:text-yellow-200">
                      {pendingQuoteItems.length} item(ns) com cotação pendente
                    </p>
                    <p className="text-sm text-yellow-600 dark:text-yellow-400">
                      Defina a cotação para calcular o custo em R$
                    </p>
                    <Button
                      variant="link"
                      className="p-0 h-auto text-yellow-700 dark:text-yellow-300"
                      onClick={() => setFilterPendingQuote(true)}
                    >
                      Ver itens pendentes
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          {unpaidItems.length > 0 && (
            <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <CreditCard className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="font-medium text-red-800 dark:text-red-200">
                      {unpaidItems.length} item(ns) com pagamento pendente
                    </p>
                    <p className="text-sm text-red-600 dark:text-red-400">
                      Total: {formatCurrency(unpaidItems.reduce((acc, item) => acc + (item.cost_brl || 0), 0))}
                    </p>
                    <Button
                      variant="link"
                      className="p-0 h-auto text-red-700 dark:text-red-300"
                      onClick={() => setFilterPayment("unpaid")}
                    >
                      Ver itens não pagos
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total em Estoque</p>
                <p className="text-2xl font-bold">{availableItems.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Custo Total</p>
                <p className="text-2xl font-bold">R$ {totalCostBRL.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Calculator className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Custo Médio</p>
                <p className="text-2xl font-bold">R$ {avgCost.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <Clock className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Não Pagos</p>
                <p className="text-2xl font-bold">{unpaidItems.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="estoque">Estoque</TabsTrigger>
          <TabsTrigger value="marketplaces">Por Marketplace</TabsTrigger>
          <TabsTrigger value="pagamentos">Pagamentos</TabsTrigger>
        </TabsList>

        <TabsContent value="estoque" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por descrição, login, SKU..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos Status</SelectItem>
                    {statusOptions.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas Categorias</SelectItem>
                    {categoriesList.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterPayment} onValueChange={setFilterPayment}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Pagamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="paid">Pagos</SelectItem>
                    <SelectItem value="unpaid">Não Pagos</SelectItem>
                  </SelectContent>
                </Select>
                {filterPendingQuote && (
                  <Button variant="outline" size="sm" onClick={() => setFilterPendingQuote(false)}>
                    <X className="h-4 w-4 mr-1" />
                    Limpar filtro cotação
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Inventory Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Itens do Inventário</CardTitle>
              {selectedItemsForMarketplace.length > 0 && (
                <Button variant="outline" onClick={() => setIsAssignMarketplaceOpen(true)}>
                  <Store className="h-4 w-4 mr-2" />
                  Atribuir Marketplace ({selectedItemsForMarketplace.length})
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]">
                        <Checkbox
                          checked={
                            availableItems.length > 0 &&
                            selectedItemsForMarketplace.length === availableItems.length
                          }
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedItemsForMarketplace(availableItems.map((i) => i.id))
                            } else {
                              setSelectedItemsForMarketplace([])
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Login</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Fornecedor</TableHead>
                      <TableHead className="text-right">Custo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Pagamento</TableHead>
                      <TableHead>Marketplace</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={11} className="text-center py-8">
                          Carregando...
                        </TableCell>
                      </TableRow>
                    ) : filteredInventory?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                          Nenhum item encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredInventory?.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedItemsForMarketplace.includes(item.id)}
                              disabled={item.status !== "available"}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedItemsForMarketplace((prev) => [...prev, item.id])
                                } else {
                                  setSelectedItemsForMarketplace((prev) => prev.filter((id) => id !== item.id))
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell className="font-mono text-sm">{item.product_sku || "-"}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{item.description}</TableCell>
                          <TableCell className="font-mono text-sm">{item.login}</TableCell>
                          <TableCell>{item.category_name || "-"}</TableCell>
                          <TableCell>{item.supplier_name}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-col items-end">
                              <span>
                                {getCurrencySymbol(item.original_currency)} {item.original_cost.toFixed(2)}
                              </span>
                              {item.cost_brl && item.original_currency !== "BRL" && (
                                <span className="text-xs text-muted-foreground">R$ {item.cost_brl.toFixed(2)}</span>
                              )}
                              {!item.exchange_rate && item.original_currency !== "BRL" && (
                                <Badge variant="outline" className="text-yellow-600 text-xs">
                                  Cotação Pendente
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={cn(
                                statusOptions.find((s) => s.value === item.status)?.color,
                                "text-white"
                              )}
                            >
                              {statusOptions.find((s) => s.value === item.status)?.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {item.is_paid ? (
                              <Badge variant="outline" className="text-green-600">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Pago
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-red-600">
                                <Clock className="h-3 w-3 mr-1" />
                                Pendente
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {item.marketplace_name ? (
                              <div className="flex flex-col">
                                <span className="text-sm">{item.marketplace_name}</span>
                                <Badge variant="outline" className="text-xs w-fit">
                                  {marketplaceStatusOptions.find((s) => s.value === item.marketplace_status)?.label}
                                </Badge>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">Não atribuído</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              {item.status === "available" && !item.is_paid && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleMarkAsPaid(item)}
                                  title="Marcar como pago"
                                >
                                  <Banknote className="h-4 w-4 text-green-600" />
                                </Button>
                              )}
                              {item.status === "available" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleMarkAsSold(item)}
                                  title="Marcar como vendido"
                                >
                                  <CheckCircle className="h-4 w-4 text-blue-600" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setEditingItem(item)
                                  setIsDialogOpen(true)
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive"
                                onClick={() => handleDelete(item.id)}
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
        </TabsContent>

        <TabsContent value="marketplaces" className="space-y-4">
          {/* Marketplace Overview */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <Package className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Em Estoque</p>
                    <p className="text-2xl font-bold">
                      {inventoryList.filter((i) => !i.marketplace_id && i.status === "available").length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            {marketplacesList.map((mp) => {
              const mpItems = inventoryList.filter((i) => i.marketplace_id === mp.id && i.status === "available")
              return (
                <Card key={mp.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <Store className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{mp.name}</p>
                        <p className="text-2xl font-bold">{mpItems.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Filter by Marketplace */}
          <Card>
            <CardHeader>
              <CardTitle>Filtrar por Marketplace</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={filterMarketplace} onValueChange={setFilterMarketplace}>
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Selecione um marketplace" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="none">Não atribuído (Em estoque)</SelectItem>
                  {marketplacesList.map((mp) => (
                    <SelectItem key={mp.id} value={mp.id.toString()}>
                      {mp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="mt-4 rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Login</TableHead>
                      <TableHead>Marketplace</TableHead>
                      <TableHead>Status MP</TableHead>
                      <TableHead className="text-right">Custo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInventory
                      ?.filter((i) => i.status === "available")
                      .map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-mono text-sm">{item.product_sku || "-"}</TableCell>
                          <TableCell>{item.description}</TableCell>
                          <TableCell className="font-mono text-sm">{item.login}</TableCell>
                          <TableCell>{item.marketplace_name || "Não atribuído"}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {marketplaceStatusOptions.find((s) => s.value === item.marketplace_status)?.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(item.cost_brl || item.original_cost, item.cost_brl ? "BRL" : item.original_currency)}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pagamentos" className="space-y-4">
          {/* Unpaid Items */}
          <Card>
            <CardHeader>
              <CardTitle>Pagamentos Pendentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data Compra</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Fornecedor</TableHead>
                      <TableHead className="text-right">Custo Original</TableHead>
                      <TableHead className="text-right">Custo R$</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {unpaidItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Nenhum pagamento pendente
                        </TableCell>
                      </TableRow>
                    ) : (
                      unpaidItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{new Date(item.purchase_date).toLocaleDateString("pt-BR")}</TableCell>
                          <TableCell>{item.description}</TableCell>
                          <TableCell>{item.supplier_name}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(item.original_cost, item.original_currency)}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.cost_brl ? formatCurrency(item.cost_brl) : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm" onClick={() => handleMarkAsPaid(item)}>
                              <Banknote className="h-4 w-4 mr-1" />
                              Marcar Pago
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              {unpaidItems.length > 0 && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total Pendente:</span>
                    <span className="text-xl font-bold">
                      {formatCurrency(unpaidItems.reduce((acc, item) => acc + (item.cost_brl || 0), 0))}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Assign Marketplace Dialog */}
      <Dialog open={isAssignMarketplaceOpen} onOpenChange={setIsAssignMarketplaceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atribuir Marketplace</DialogTitle>
            <DialogDescription>
              Atribuir {selectedItemsForMarketplace.length} item(ns) a um marketplace
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Marketplace</Label>
              <Select value={assignMarketplaceId} onValueChange={setAssignMarketplaceId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um marketplace" />
                </SelectTrigger>
                <SelectContent>
                  {marketplacesList.map((mp) => (
                    <SelectItem key={mp.id} value={mp.id.toString()}>
                      {mp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={assignMarketplaceStatus} onValueChange={setAssignMarketplaceStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {marketplaceStatusOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAssignMarketplaceOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAssignMarketplace} disabled={!assignMarketplaceId}>
                Atribuir
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
