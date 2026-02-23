"use client"

import React, { useRef, useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
  ExternalLink,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Store,
  Upload,
  Download,
  FileSpreadsheet,
  Check,
  ChevronsUpDown,
  Package,
  Link as LinkIcon,
} from "lucide-react"
import useSWR, { mutate } from "swr"
import { cn } from "@/lib/utils"

interface Sale {
  id: number
  sale_code: string
  sale_date: string
  sale_price: number
  description: string
  login: string
  post_sale_login: string | null
  buyer: string
  marketplace_id: number
  marketplace_name: string
  marketplace_fee: number
  game: string
  link: string | null
  product_id: number | null
  product_sku: string | null
  product_description: string | null
  category_name: string | null
  inventory_id: number | null
  inventory_cost: number | null
}

interface Marketplace {
  id: number
  name: string
  fee_percentage: number
}

interface InventoryItem {
  id: number
  description: string
  login: string
  product_id: number | null
  product_sku: string | null
  product_description: string | null
  category_name: string | null
  original_cost: number
  original_currency: string
  cost_brl: number | null
  status: string
}

interface Category {
  id: number
  name: string
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function VendasContent() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [editingSale, setEditingSale] = useState<Sale | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterMarketplace, setFilterMarketplace] = useState<string>("all")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [importData, setImportData] = useState<string>("")
  const [importError, setImportError] = useState<string>("")
  const [inventorySearchOpen, setInventorySearchOpen] = useState(false)
  const [inventorySearchTerm, setInventorySearchTerm] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: sales, error: salesError, isLoading: salesLoading } = useSWR<Sale[]>("/api/sales", fetcher)
  const { data: marketplaces } = useSWR<Marketplace[]>("/api/marketplaces", fetcher)
  const { data: inventory } = useSWR<InventoryItem[]>("/api/inventory", fetcher)
  const { data: categories } = useSWR<Category[]>("/api/categories", fetcher)

  // Filter available inventory items
  const availableInventory = inventory?.filter(
    (item) =>
      item.status === "available" &&
      (inventorySearchTerm === "" ||
        item.login.toLowerCase().includes(inventorySearchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(inventorySearchTerm.toLowerCase()) ||
        item.product_sku?.toLowerCase().includes(inventorySearchTerm.toLowerCase()))
  )

  const [formData, setFormData] = useState({
    sale_code: "",
    sale_date: new Date().toISOString().split("T")[0],
    sale_price: "",
    description: "",
    login: "",
    post_sale_login: "",
    buyer: "",
    marketplace_id: "",
    marketplace_fee: "",
    game: "",
    link: "",
    product_id: "",
    inventory_id: "",
  })

  const resetForm = () => {
    setFormData({
      sale_code: "",
      sale_date: new Date().toISOString().split("T")[0],
      sale_price: "",
      description: "",
      login: "",
      post_sale_login: "",
      buyer: "",
      marketplace_id: "",
      marketplace_fee: "",
      game: "",
      link: "",
      product_id: "",
      inventory_id: "",
    })
    setInventorySearchTerm("")
  }

  useEffect(() => {
    if (editingSale) {
      setFormData({
        sale_code: editingSale.sale_code,
        sale_date: editingSale.sale_date.split("T")[0],
        sale_price: editingSale.sale_price.toString(),
        description: editingSale.description,
        login: editingSale.login,
        post_sale_login: editingSale.post_sale_login || "",
        buyer: editingSale.buyer,
        marketplace_id: editingSale.marketplace_id?.toString() || "",
        marketplace_fee: editingSale.marketplace_fee.toString(),
        game: editingSale.game,
        link: editingSale.link || "",
        product_id: editingSale.product_id?.toString() || "",
        inventory_id: editingSale.inventory_id?.toString() || "",
      })
      if (editingSale.product_sku) {
        setInventorySearchTerm(editingSale.login)
      }
    } else {
      resetForm()
    }
  }, [editingSale])

  const handleMarketplaceChange = (marketplaceId: string) => {
    const marketplace = marketplaces?.find((m) => m.id.toString() === marketplaceId)
    setFormData((prev) => ({
      ...prev,
      marketplace_id: marketplaceId,
      marketplace_fee: marketplace ? marketplace.fee_percentage.toString() : "",
    }))
  }

  const handleInventorySelect = (item: InventoryItem) => {
    setFormData((prev) => ({
      ...prev,
      inventory_id: item.id.toString(),
      product_id: item.product_id?.toString() || "",
      description: item.description,
      login: item.login,
      game: item.category_name || prev.game,
    }))
    setInventorySearchTerm(item.login)
    setInventorySearchOpen(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const method = editingSale ? "PUT" : "POST"
    const body = editingSale ? { ...formData, id: editingSale.id } : formData

    await fetch("/api/sales", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    mutate("/api/sales")
    mutate("/api/inventory")
    setIsDialogOpen(false)
    setEditingSale(null)
    resetForm()
  }

  const handleDelete = async (id: number) => {
    if (confirm("Tem certeza que deseja excluir esta venda?")) {
      await fetch(`/api/sales?id=${id}`, { method: "DELETE" })
      mutate("/api/sales")
      mutate("/api/inventory")
    }
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
        sale_code: "",
        sale_date: new Date().toISOString().split("T")[0],
        sale_price: 0,
        description: "",
        login: "",
        post_sale_login: null,
        buyer: "",
        marketplace_id: null,
        marketplace_fee: 0,
        game: "",
        link: null,
      }

      header.forEach((col, idx) => {
        const value = values[idx]?.trim() || ""
        if (col.includes("codigo") || col.includes("code")) item.sale_code = value
        else if (col.includes("data") || col.includes("date")) item.sale_date = value
        else if (col.includes("preco") || col.includes("price") || col.includes("valor"))
          item.sale_price = parseFloat(value) || 0
        else if (col.includes("descri")) item.description = value
        else if (col.includes("login") && col.includes("pos")) item.post_sale_login = value || null
        else if (col.includes("login") || col.includes("email")) item.login = value
        else if (col.includes("comprador") || col.includes("buyer")) item.buyer = value
        else if (col.includes("taxa") || col.includes("fee")) item.marketplace_fee = parseFloat(value) || 0
        else if (col.includes("jogo") || col.includes("game") || col.includes("categoria")) item.game = value
        else if (col.includes("link")) item.link = value || null
      })

      if (item.sale_code && item.description) {
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

      const response = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(items),
      })

      if (response.ok) {
        const result = await response.json()
        alert(`${result.count} vendas importadas com sucesso!`)
        mutate("/api/sales")
        setIsImportDialogOpen(false)
        setImportData("")
      } else {
        setImportError("Erro ao importar vendas")
      }
    } catch (error: any) {
      setImportError(error.message || "Erro ao processar arquivo")
    }
  }

  const handleExport = () => {
    if (!sales || sales.length === 0) return

    const headers = [
      "Código",
      "Data",
      "Marketplace",
      "Categoria",
      "SKU",
      "Descrição",
      "Login",
      "Login Pós-Venda",
      "Comprador",
      "Preço",
      "Taxa (%)",
      "Custo",
      "Lucro",
      "Link",
    ]
    const rows = sales.map((sale) => {
      const fee = sale.sale_price * (sale.marketplace_fee / 100)
      const profit = sale.inventory_cost
        ? sale.sale_price - fee - sale.inventory_cost
        : sale.sale_price - fee
      return [
        sale.sale_code,
        sale.sale_date.split("T")[0],
        sale.marketplace_name,
        sale.category_name || sale.game,
        sale.product_sku || "",
        sale.description,
        sale.login,
        sale.post_sale_login || "",
        sale.buyer,
        sale.sale_price,
        sale.marketplace_fee,
        sale.inventory_cost || "",
        profit.toFixed(2),
        sale.link || "",
      ]
    })

    const csvContent = [headers.join(";"), ...rows.map((row) => row.join(";"))].join("\n")

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `vendas_${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const filteredSales = sales?.filter((sale) => {
    const matchesSearch =
      sale.sale_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.buyer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.login.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.product_sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.game?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesMarketplace =
      filterMarketplace === "all" || sale.marketplace_id?.toString() === filterMarketplace
    const matchesCategory =
      filterCategory === "all" || sale.category_name === filterCategory || sale.game === filterCategory
    return matchesSearch && matchesMarketplace && matchesCategory
  })

  const totalSales = filteredSales?.reduce((acc, sale) => acc + sale.sale_price, 0) || 0
  const totalFees =
    filteredSales?.reduce((acc, sale) => acc + (sale.sale_price * sale.marketplace_fee) / 100, 0) || 0
  const totalCost = filteredSales?.reduce((acc, sale) => acc + (sale.inventory_cost || 0), 0) || 0
  const netRevenue = totalSales - totalFees
  const totalProfit = netRevenue - totalCost

  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2)}`
  }

  const uniqueCategories = [...new Set(sales?.map((s) => s.category_name || s.game).filter(Boolean))]

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Vendas</h1>
          <p className="text-muted-foreground">Gerencie suas vendas em todos os marketplaces</p>
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
                <DialogTitle>Importar Vendas</DialogTitle>
                <DialogDescription>Importe múltiplas vendas de um arquivo CSV, TXT ou XLSX</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg text-sm">
                  <p className="font-medium mb-2">Formato esperado (separado por vírgula, ponto-e-vírgula ou tab):</p>
                  <code className="text-xs">Código;Data;Preço;Descrição;Login;LoginPósVenda;Comprador;Taxa;Jogo;Link</code>
                </div>

                <div className="space-y-2">
                  <Label>Selecionar arquivo</Label>
                  <Input ref={fileInputRef} type="file" accept=".csv,.txt,.xlsx" onChange={handleFileUpload} />
                </div>

                <div className="space-y-2">
                  <Label>Ou cole os dados diretamente</Label>
                  <textarea
                    className="w-full h-40 p-3 border rounded-md text-sm font-mono bg-background"
                    placeholder="Código;Data;Preço;Descrição;Login;LoginPósVenda;Comprador;Taxa;Jogo;Link&#10;VND001;2024-01-15;150;Conta Steam;user@email.com;;João Silva;10;CS2;https://..."
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
                setEditingSale(null)
                resetForm()
              }
            }}
          >
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nova Venda
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingSale ? "Editar Venda" : "Registrar Nova Venda"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Inventory/Product Selection */}
                <div className="space-y-2">
                  <Label>Vincular ao Estoque (por Email/Login)</Label>
                  <Popover open={inventorySearchOpen} onOpenChange={setInventorySearchOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={inventorySearchOpen}
                        className="w-full justify-between bg-transparent"
                      >
                        {inventorySearchTerm || "Buscar item do estoque por email/login..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput
                          placeholder="Digite o email ou login..."
                          value={inventorySearchTerm}
                          onValueChange={setInventorySearchTerm}
                        />
                        <CommandList>
                          <CommandEmpty>Nenhum item disponível encontrado.</CommandEmpty>
                          <CommandGroup>
                            {availableInventory?.slice(0, 10).map((item) => (
                              <CommandItem
                                key={item.id}
                                value={`${item.login} ${item.description}`}
                                onSelect={() => handleInventorySelect(item)}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    formData.inventory_id === item.id.toString() ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div className="flex flex-col flex-1">
                                  <span className="font-mono text-sm">{item.login}</span>
                                  <span className="text-xs text-muted-foreground">{item.description}</span>
                                </div>
                                <div className="text-right">
                                  {item.product_sku && (
                                    <Badge variant="outline" className="text-xs">
                                      {item.product_sku}
                                    </Badge>
                                  )}
                                  <span className="text-xs text-muted-foreground block">
                                    {item.cost_brl ? `R$ ${item.cost_brl.toFixed(2)}` : "-"}
                                  </span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <p className="text-xs text-muted-foreground">
                    Vincule a venda a um item do estoque para rastrear automaticamente
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sale_code">Código da Venda</Label>
                    <Input
                      id="sale_code"
                      value={formData.sale_code}
                      onChange={(e) => setFormData((prev) => ({ ...prev, sale_code: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sale_date">Data da Venda</Label>
                    <Input
                      id="sale_date"
                      type="date"
                      value={formData.sale_date}
                      onChange={(e) => setFormData((prev) => ({ ...prev, sale_date: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="marketplace_id">Marketplace</Label>
                    <Select value={formData.marketplace_id} onValueChange={handleMarketplaceChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {marketplaces?.map((marketplace) => (
                          <SelectItem key={marketplace.id} value={marketplace.id.toString()}>
                            {marketplace.name} ({marketplace.fee_percentage}%)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="marketplace_fee">Taxa Marketplace (%)</Label>
                    <Input
                      id="marketplace_fee"
                      type="number"
                      step="0.01"
                      value={formData.marketplace_fee}
                      onChange={(e) => setFormData((prev) => ({ ...prev, marketplace_fee: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sale_price">Preço de Venda (R$)</Label>
                    <Input
                      id="sale_price"
                      type="number"
                      step="0.01"
                      value={formData.sale_price}
                      onChange={(e) => setFormData((prev) => ({ ...prev, sale_price: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="game">Categoria/Jogo</Label>
                    <Input
                      id="game"
                      value={formData.game}
                      onChange={(e) => setFormData((prev) => ({ ...prev, game: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição do Pedido</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
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
                    <Label htmlFor="post_sale_login">Login Pós-venda</Label>
                    <Input
                      id="post_sale_login"
                      value={formData.post_sale_login}
                      onChange={(e) => setFormData((prev) => ({ ...prev, post_sale_login: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="buyer">Comprador</Label>
                    <Input
                      id="buyer"
                      value={formData.buyer}
                      onChange={(e) => setFormData((prev) => ({ ...prev, buyer: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="link">Link</Label>
                    <Input
                      id="link"
                      value={formData.link}
                      onChange={(e) => setFormData((prev) => ({ ...prev, link: e.target.value }))}
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false)
                      setEditingSale(null)
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">{editingSale ? "Salvar Alterações" : "Registrar Venda"}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredSales?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Bruta</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSales)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxas</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">- {formatCurrency(totalFees)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Líquida</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(netRevenue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={cn("text-2xl font-bold", totalProfit >= 0 ? "text-green-600" : "text-red-600")}>
              {formatCurrency(totalProfit)}
            </div>
            <p className="text-xs text-muted-foreground">Custo: {formatCurrency(totalCost)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por código, descrição, email, comprador..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterMarketplace} onValueChange={setFilterMarketplace}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Marketplace" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Marketplaces</SelectItem>
                {marketplaces?.map((mp) => (
                  <SelectItem key={mp.id} value={mp.id.toString()}>
                    {mp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Categorias</SelectItem>
                {uniqueCategories.map((cat) => (
                  <SelectItem key={cat} value={cat as string}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Sales Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Vendas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Email/Login</TableHead>
                  <TableHead>Marketplace</TableHead>
                  <TableHead className="text-right">Preço</TableHead>
                  <TableHead className="text-right">Custo</TableHead>
                  <TableHead className="text-right">Lucro</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesLoading ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filteredSales?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                      Nenhuma venda encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSales?.map((sale) => {
                    const fee = sale.sale_price * (sale.marketplace_fee / 100)
                    const netPrice = sale.sale_price - fee
                    const profit = sale.inventory_cost ? netPrice - sale.inventory_cost : netPrice
                    return (
                      <TableRow key={sale.id}>
                        <TableCell className="font-mono text-sm">{sale.sale_code}</TableCell>
                        <TableCell>{new Date(sale.sale_date).toLocaleDateString("pt-BR")}</TableCell>
                        <TableCell>{sale.category_name || sale.game}</TableCell>
                        <TableCell>
                          {sale.product_sku ? (
                            <Badge variant="outline" className="font-mono text-xs">
                              {sale.product_sku}
                            </Badge>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate">{sale.description}</TableCell>
                        <TableCell className="font-mono text-sm">{sale.login}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{sale.marketplace_name}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-col items-end">
                            <span>{formatCurrency(sale.sale_price)}</span>
                            <span className="text-xs text-muted-foreground">Taxa: {sale.marketplace_fee}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {sale.inventory_cost ? formatCurrency(sale.inventory_cost) : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={cn(profit >= 0 ? "text-green-600" : "text-red-600", "font-medium")}>
                            {formatCurrency(profit)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {sale.link && (
                              <Button variant="ghost" size="icon" asChild>
                                <a href={sale.link} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingSale(sale)
                                setIsDialogOpen(true)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              onClick={() => handleDelete(sale.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
