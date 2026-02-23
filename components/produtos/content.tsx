"use client"

import { useState, useEffect } from "react"
import useSWR, { mutate } from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  Tag,
  History,
  Gamepad2,
  Sword,
  Crown,
  Gem,
  Coins,
  Shield,
  Zap,
  Star,
  Heart,
  Target,
  Trophy,
  Gift,
  Key,
  Ticket,
  Rocket,
  Flame,
  Sparkles,
  Music,
  Camera,
  Briefcase,
  Car,
  Plane,
  Shirt,
  Watch,
  Headphones,
  Laptop,
  Smartphone,
  Tv,
  X,
} from "lucide-react"

const fetcher = async (url: string) => {
  const res = await fetch(url)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || "Erro ao carregar dados")
  return data
}

const AVAILABLE_ICONS = [
  { name: "Gamepad2", icon: Gamepad2 },
  { name: "Sword", icon: Sword },
  { name: "Crown", icon: Crown },
  { name: "Gem", icon: Gem },
  { name: "Coins", icon: Coins },
  { name: "Shield", icon: Shield },
  { name: "Zap", icon: Zap },
  { name: "Star", icon: Star },
  { name: "Heart", icon: Heart },
  { name: "Target", icon: Target },
  { name: "Trophy", icon: Trophy },
  { name: "Gift", icon: Gift },
  { name: "Key", icon: Key },
  { name: "Ticket", icon: Ticket },
  { name: "Rocket", icon: Rocket },
  { name: "Flame", icon: Flame },
  { name: "Sparkles", icon: Sparkles },
  { name: "Music", icon: Music },
  { name: "Camera", icon: Camera },
  { name: "Briefcase", icon: Briefcase },
  { name: "Car", icon: Car },
  { name: "Plane", icon: Plane },
  { name: "Shirt", icon: Shirt },
  { name: "Watch", icon: Watch },
  { name: "Headphones", icon: Headphones },
  { name: "Laptop", icon: Laptop },
  { name: "Smartphone", icon: Smartphone },
  { name: "Tv", icon: Tv },
]

const CURRENCIES = [
  { value: "BRL", label: "Real (R$)" },
  { value: "USD", label: "Dólar ($)" },
  { value: "CNY", label: "Yuan (¥)" },
]

function getIconComponent(iconName: string) {
  const found = AVAILABLE_ICONS.find((i) => i.name === iconName)
  return found ? found.icon : Gamepad2
}

interface Category {
  id: number
  name: string
  icon: string
  created_at: string
}

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
  is_active: boolean
  created_at: string
}

interface Supplier {
  id: number
  name: string
}

interface PriceHistory {
  id: number
  price: number
  currency: string
  created_at: string
}

export function ProdutosContent() {
  const [activeTab, setActiveTab] = useState("produtos")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("1")
  
  // Category state
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [categoryForm, setCategoryForm] = useState({ name: "", icon: "Gamepad2" })
  const [deleteCategoryId, setDeleteCategoryId] = useState<number | null>(null)
  
  // Product state
  const [productDialogOpen, setProductDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [productForm, setProductForm] = useState({
    sku: "",
    description: "",
    category_id: "1",
    supplier_id: "",
    current_price: "",
    currency: "BRL",
  })
  const [deleteProductId, setDeleteProductId] = useState<number | null>(null)
  
  // Price history state
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false)
  const [selectedProductForHistory, setSelectedProductForHistory] = useState<Product | null>(null)

  const { data: categories = [], isLoading: loadingCategories } = useSWR<Category[]>(
    "/api/categories",
    fetcher
  )
  const { data: products = [], isLoading: loadingProducts } = useSWR<Product[]>(
    "/api/products",
    fetcher
  )
  const { data: suppliers = [] } = useSWR<Supplier[]>("/api/suppliers", fetcher)
  const { data: priceHistory = [] } = useSWR<PriceHistory[]>(
    selectedProductForHistory ? `/api/products/history?product_id=${selectedProductForHistory.id}` : null,
    fetcher
  )

  // Filter products (with safety check)
  const productsList = Array.isArray(products) ? products : []
  const filteredProducts = productsList.filter((p) => {
    const matchesSearch =
      searchTerm === "" ||
      p.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory =
      selectedCategory === "all" || p.category_id === parseInt(selectedCategory)
    return matchesSearch && matchesCategory && p.is_active !== false
  })
  
  // Safety check for categories
  const categoriesList = Array.isArray(categories) ? categories : []
  const suppliersList = Array.isArray(suppliers) ? suppliers : []

  // Category handlers
  const handleOpenCategoryDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category)
      setCategoryForm({ name: category.name, icon: category.icon })
    } else {
      setEditingCategory(null)
      setCategoryForm({ name: "", icon: "Gamepad2" })
    }
    setCategoryDialogOpen(true)
  }

  const handleSaveCategory = async () => {
    try {
      const method = editingCategory ? "PUT" : "POST"
      const body = editingCategory
        ? { ...categoryForm, id: editingCategory.id }
        : categoryForm

      const res = await fetch("/api/categories", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        mutate("/api/categories")
        setCategoryDialogOpen(false)
        setCategoryForm({ name: "", icon: "Gamepad2" })
        setEditingCategory(null)
      } else {
        const data = await res.json()
        alert(data.error || "Erro ao salvar categoria")
      }
    } catch (error) {
      alert("Erro ao salvar categoria")
    }
  }

  const handleDeleteCategory = async () => {
    if (!deleteCategoryId) return
    try {
      const res = await fetch(`/api/categories?id=${deleteCategoryId}`, {
        method: "DELETE",
      })
      if (res.ok) {
        mutate("/api/categories")
      } else {
        const data = await res.json()
        alert(data.error || "Erro ao excluir categoria")
      }
    } catch (error) {
      alert("Erro ao excluir categoria")
    }
    setDeleteCategoryId(null)
  }

  // Product handlers
  const handleOpenProductDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product)
      setProductForm({
        sku: product.sku,
        description: product.description,
        category_id: product.category_id.toString(),
        supplier_id: product.supplier_id?.toString() || "",
        current_price: product.current_price?.toString() || "",
        currency: product.currency || "BRL",
      })
    } else {
      setEditingProduct(null)
      setProductForm({
        sku: "",
        description: "",
        category_id: "1",
        supplier_id: "",
        current_price: "",
        currency: "BRL",
      })
    }
    setProductDialogOpen(true)
  }

  const handleSaveProduct = async () => {
    try {
      const method = editingProduct ? "PUT" : "POST"
      const body = editingProduct
        ? { ...productForm, id: editingProduct.id }
        : productForm

      const res = await fetch("/api/products", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        mutate("/api/products")
        setProductDialogOpen(false)
        setProductForm({
          sku: "",
          description: "",
          category_id: "1",
          supplier_id: "",
          current_price: "",
          currency: "BRL",
        })
        setEditingProduct(null)
      } else {
        const data = await res.json()
        alert(data.error || "Erro ao salvar produto")
      }
    } catch (error) {
      alert("Erro ao salvar produto")
    }
  }

  const handleDeleteProduct = async () => {
    if (!deleteProductId) return
    try {
      const res = await fetch(`/api/products?id=${deleteProductId}`, {
        method: "DELETE",
      })
      if (res.ok) {
        mutate("/api/products")
      } else {
        const data = await res.json()
        alert(data.error || "Erro ao excluir produto")
      }
    } catch (error) {
      alert("Erro ao excluir produto")
    }
    setDeleteProductId(null)
  }

  const handleOpenHistory = (product: Product) => {
    setSelectedProductForHistory(product)
    setHistoryDialogOpen(true)
  }

  const formatCurrency = (value: number | string | null | undefined, currency: string) => {
    if (value === null || value === undefined) return "-"
    const numValue = typeof value === "number" ? value : parseFloat(String(value))
    if (isNaN(numValue)) return "-"
    const symbols: Record<string, string> = { BRL: "R$", USD: "$", CNY: "¥" }
    return `${symbols[currency] || ""} ${numValue.toFixed(2)}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Produtos</h1>
          <p className="text-muted-foreground">
            Gerencie categorias e produtos do seu catálogo
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="produtos" className="gap-2">
            <Package className="h-4 w-4" />
            Produtos
          </TabsTrigger>
          <TabsTrigger value="categorias" className="gap-2">
            <Tag className="h-4 w-4" />
            Categorias
          </TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="produtos" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-lg">Lista de Produtos</CardTitle>
              <Button onClick={() => handleOpenProductDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Produto
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por SKU ou descrição..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    {categoriesList.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Fornecedor</TableHead>
                      <TableHead className="text-right">Preço</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingProducts ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          Carregando...
                        </TableCell>
                      </TableRow>
                    ) : filteredProducts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Nenhum produto encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredProducts.map((product) => {
                        const CategoryIcon = getIconComponent(
                          categoriesList.find((c) => c.id === product.category_id)?.icon || "Gamepad2"
                        )
                        return (
                          <TableRow key={product.id}>
                            <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                            <TableCell>{product.description}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <CategoryIcon className="h-4 w-4 text-muted-foreground" />
                                {product.category_name}
                              </div>
                            </TableCell>
                            <TableCell>{product.supplier_name || "-"}</TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(product.current_price, product.currency)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleOpenHistory(product)}
                                  title="Histórico de preços"
                                >
                                  <History className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleOpenProductDialog(product)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive"
                                  onClick={() => setDeleteProductId(product.id)}
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
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categorias" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-lg">Categorias</CardTitle>
              <Button onClick={() => handleOpenCategoryDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Nova Categoria
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {loadingCategories ? (
                  <p className="text-muted-foreground col-span-full text-center py-8">
                    Carregando...
                  </p>
                ) : categoriesList.length === 0 ? (
                  <p className="text-muted-foreground col-span-full text-center py-8">
                    Nenhuma categoria cadastrada
                  </p>
                ) : (
                  categoriesList.map((category) => {
                    const IconComponent = getIconComponent(category.icon)
                    const productCount = products.filter(
                      (p) => p.category_id === category.id && p.is_active
                    ).length
                    return (
                      <Card key={category.id} className="relative">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                <IconComponent className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <h3 className="font-medium">{category.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {productCount} produto{productCount !== 1 ? "s" : ""}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleOpenCategoryDialog(category)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => setDeleteCategoryId(category.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Category Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Editar Categoria" : "Nova Categoria"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome da Categoria</Label>
              <Input
                value={categoryForm.name}
                onChange={(e) =>
                  setCategoryForm({ ...categoryForm, name: e.target.value })
                }
                placeholder="Ex: FIFA 25"
              />
            </div>
            <div className="space-y-2">
              <Label>Ícone</Label>
              <div className="grid grid-cols-7 gap-2 p-3 border rounded-md max-h-[200px] overflow-y-auto">
                {AVAILABLE_ICONS.map(({ name, icon: IconComp }) => (
                  <button
                    key={name}
                    type="button"
                    className={`p-2 rounded-md hover:bg-accent transition-colors ${
                      categoryForm.icon === name
                        ? "bg-primary text-primary-foreground"
                        : ""
                    }`}
                    onClick={() => setCategoryForm({ ...categoryForm, icon: name })}
                  >
                    <IconComp className="h-5 w-5 mx-auto" />
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveCategory} disabled={!categoryForm.name}>
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Product Dialog */}
      <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Editar Produto" : "Novo Produto"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>SKU *</Label>
                <Input
                  value={productForm.sku}
                  onChange={(e) =>
                    setProductForm({ ...productForm, sku: e.target.value })
                  }
                  placeholder="Ex: FIFA25-COINS-100K"
                />
              </div>
              <div className="space-y-2">
                <Label>Categoria *</Label>
                <Select
                  value={productForm.category_id}
                  onValueChange={(v) =>
                    setProductForm({ ...productForm, category_id: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriesList.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descrição *</Label>
              <Input
                value={productForm.description}
                onChange={(e) =>
                  setProductForm({ ...productForm, description: e.target.value })
                }
                placeholder="Ex: 100K Coins FIFA 25"
              />
            </div>
            <div className="space-y-2">
              <Label>Fornecedor</Label>
              <Select
                value={productForm.supplier_id}
                onValueChange={(v) =>
                  setProductForm({ ...productForm, supplier_id: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="N/A" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">N/A</SelectItem>
                  {suppliersList.map((sup) => (
                    <SelectItem key={sup.id} value={sup.id.toString()}>
                      {sup.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Preço de Custo</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={productForm.current_price}
                  onChange={(e) =>
                    setProductForm({ ...productForm, current_price: e.target.value })
                  }
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Moeda</Label>
                <Select
                  value={productForm.currency}
                  onValueChange={(v) =>
                    setProductForm({ ...productForm, currency: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((cur) => (
                      <SelectItem key={cur.value} value={cur.value}>
                        {cur.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setProductDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveProduct}
              disabled={!productForm.sku || !productForm.description || !productForm.category_id}
            >
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Price History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Histórico de Preços - {selectedProductForHistory?.description}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {priceHistory.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum histórico de preços
              </p>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Preço</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {priceHistory.map((entry, idx) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          {formatDate(entry.created_at)}
                          {idx === 0 && (
                            <Badge variant="secondary" className="ml-2">
                              Atual
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(entry.price, entry.currency)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Category Confirmation */}
      <AlertDialog open={!!deleteCategoryId} onOpenChange={() => setDeleteCategoryId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Categoria</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta categoria? Esta ação não pode ser
              desfeita. Categorias com produtos não podem ser excluídas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCategory}
              className="bg-destructive text-destructive-foreground"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Product Confirmation */}
      <AlertDialog open={!!deleteProductId} onOpenChange={() => setDeleteProductId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Produto</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este produto? O produto será desativado
              mas seu histórico será mantido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProduct}
              className="bg-destructive text-destructive-foreground"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
