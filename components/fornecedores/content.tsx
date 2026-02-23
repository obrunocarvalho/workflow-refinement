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
import { Plus, Edit, Trash2, Truck, Hash } from "lucide-react"
import useSWR, { mutate } from "swr"

interface Supplier {
  id: number
  name: string
  code: string
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function FornecedoresContent() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)

  const { data: suppliers, isLoading } = useSWR<Supplier[]>("/api/suppliers", fetcher)

  const [formData, setFormData] = useState({
    name: "",
    code: "",
  })

  useEffect(() => {
    if (editingSupplier) {
      setFormData({
        name: editingSupplier.name,
        code: editingSupplier.code,
      })
    } else {
      setFormData({
        name: "",
        code: "",
      })
    }
  }, [editingSupplier])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const method = editingSupplier ? "PUT" : "POST"
    const body = editingSupplier
      ? { ...formData, id: editingSupplier.id }
      : formData

    await fetch("/api/suppliers", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    mutate("/api/suppliers")
    setIsDialogOpen(false)
    setEditingSupplier(null)
  }

  const handleDelete = async (id: number) => {
    if (confirm("Tem certeza que deseja excluir este fornecedor? Isso pode afetar itens do inventário.")) {
      await fetch(`/api/suppliers?id=${id}`, { method: "DELETE" })
      mutate("/api/suppliers")
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Fornecedores</h1>
          <p className="text-muted-foreground">
            Gerencie seus fornecedores de produtos digitais
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) setEditingSupplier(null)
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Fornecedor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingSupplier ? "Editar Fornecedor" : "Cadastrar Fornecedor"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Fornecedor</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Fornecedor XYZ"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Código de Identificação</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData((prev) => ({ ...prev, code: e.target.value }))}
                  placeholder="Ex: FRN001"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => {
                  setIsDialogOpen(false)
                  setEditingSupplier(null)
                }}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingSupplier ? "Salvar Alterações" : "Cadastrar"}
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
            <CardTitle className="text-sm font-medium">Total de Fornecedores</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{suppliers?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Códigos Únicos</CardTitle>
            <Hash className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{suppliers?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Suppliers Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Código</TableHead>
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
              ) : suppliers?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8">
                    Nenhum fornecedor cadastrado
                  </TableCell>
                </TableRow>
              ) : (
                suppliers?.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell className="font-medium">{supplier.name}</TableCell>
                    <TableCell className="font-mono text-muted-foreground">{supplier.code}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setEditingSupplier(supplier)
                            setIsDialogOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-600"
                          onClick={() => handleDelete(supplier.id)}
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
