"use client"

import React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Plus, Edit, Trash2, Store, Percent } from "lucide-react"
import useSWR, { mutate } from "swr"

interface Marketplace {
  id: number
  name: string
  fee_percentage: number
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function MarketplacesContent() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingMarketplace, setEditingMarketplace] = useState<Marketplace | null>(null)

  const { data: marketplaces, isLoading } = useSWR<Marketplace[]>("/api/marketplaces", fetcher)

  const [formData, setFormData] = useState({
    name: "",
    fee_percentage: "",
  })

  useEffect(() => {
    if (editingMarketplace) {
      setFormData({
        name: editingMarketplace.name,
        fee_percentage: editingMarketplace.fee_percentage.toString(),
      })
    } else {
      setFormData({
        name: "",
        fee_percentage: "",
      })
    }
  }, [editingMarketplace])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const method = editingMarketplace ? "PUT" : "POST"
    const body = editingMarketplace
      ? { ...formData, id: editingMarketplace.id }
      : formData

    await fetch("/api/marketplaces", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    mutate("/api/marketplaces")
    setIsDialogOpen(false)
    setEditingMarketplace(null)
  }

  const handleDelete = async (id: number) => {
    if (confirm("Tem certeza que deseja excluir este marketplace? Isso pode afetar vendas associadas.")) {
      await fetch(`/api/marketplaces?id=${id}`, { method: "DELETE" })
      mutate("/api/marketplaces")
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Marketplaces</h1>
          <p className="text-muted-foreground">
            Gerencie os marketplaces onde você vende seus produtos
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) setEditingMarketplace(null)
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Marketplace
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingMarketplace ? "Editar Marketplace" : "Cadastrar Marketplace"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Marketplace</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Mercado Livre, Shopee, Amazon..."
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fee_percentage">Taxa do Marketplace (%)</Label>
                <Input
                  id="fee_percentage"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.fee_percentage}
                  onChange={(e) => setFormData((prev) => ({ ...prev, fee_percentage: e.target.value }))}
                  placeholder="Ex: 12.5"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => {
                  setIsDialogOpen(false)
                  setEditingMarketplace(null)
                }}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingMarketplace ? "Salvar Alterações" : "Cadastrar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Marketplaces</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{marketplaces?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa Média</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {marketplaces && marketplaces.length > 0
                ? (marketplaces.reduce((acc, m) => acc + m.fee_percentage, 0) / marketplaces.length).toFixed(2)
                : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Marketplaces Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="text-right">Taxa (%)</TableHead>
                <TableHead className="text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : marketplaces?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8">
                    Nenhum marketplace cadastrado
                  </TableCell>
                </TableRow>
              ) : (
                marketplaces?.map((marketplace) => (
                  <TableRow key={marketplace.id}>
                    <TableCell className="font-medium">{marketplace.name}</TableCell>
                    <TableCell className="text-right">{marketplace.fee_percentage}%</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setEditingMarketplace(marketplace)
                            setIsDialogOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-600"
                          onClick={() => handleDelete(marketplace.id)}
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
        </CardContent>
      </Card>
    </div>
  )
}
