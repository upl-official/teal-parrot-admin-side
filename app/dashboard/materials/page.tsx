"use client"

import { DialogTrigger } from "@/components/ui/dialog"

import { useState, useEffect } from "react"
import Header from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Plus, Pencil, Trash } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { fetchApi } from "@/lib/api"
import { DataTable } from "@/components/ui/data-table"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"

export default function MaterialsPage() {
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [materialName, setMaterialName] = useState("")
  const [editMaterialId, setEditMaterialId] = useState(null)
  const [nameError, setNameError] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    fetchMaterials()
  }, [])

  const fetchMaterials = async () => {
    try {
      setLoading(true)
      const response = await fetchApi("/api/v1/material/mat-list/")
      // Updated to match the API response structure
      const materialsData = response.data || []
      setMaterials(materialsData)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch materials",
      })
      setMaterials([])
    } finally {
      setLoading(false)
    }
  }

  const validateMaterialName = () => {
    if (!materialName.trim()) {
      setNameError("Material name is required")
      return false
    }
    setNameError("")
    return true
  }

  const handleAddMaterial = async () => {
    if (!validateMaterialName()) return

    try {
      await fetchApi("/api/v1/admin/material/add", {
        method: "POST",
        body: JSON.stringify({ material: materialName }),
      })

      toast({
        title: "Success",
        description: "Material added successfully",
      })

      setMaterialName("")
      setIsAddDialogOpen(false)
      fetchMaterials()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add material: " + (error.message || "Unknown error"),
      })
    }
  }

  const handleEditMaterial = async () => {
    if (!validateMaterialName()) return

    try {
      await fetchApi("/api/v1/admin/material/update", {
        method: "PUT",
        body: JSON.stringify({ matId: editMaterialId, material: materialName }),
      })

      toast({
        title: "Success",
        description: "Material updated successfully",
      })

      setMaterialName("")
      setIsEditDialogOpen(false)
      fetchMaterials()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update material: " + (error.message || "Unknown error"),
      })
    }
  }

  const confirmDeleteCategory = (materialId) => {
    setMaterialToDelete(materialId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteMaterial = async (materialId) => {
    try {
      await fetchApi("/api/v1/admin/material/remove", {
        method: "DELETE",
        body: JSON.stringify({ matId: materialId }),
      })

      toast({
        title: "Success",
        description: "Material deleted successfully",
      })

      fetchMaterials()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete material",
      })
    }
  }

  const openEditDialog = (material) => {
    setEditMaterialId(material._id)
    setMaterialName(material.material)
    setIsEditDialogOpen(true)
  }

  const columns = [
    {
      key: "material",
      header: "Material",
      cell: (row) => <span className="font-medium">{row.material}</span>,
    },
    {
      key: "productCount",
      header: "Products",
      cell: (row) => row.productCount || 0,
    },
    {
      key: "actions",
      header: "",
      cell: (row) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => openEditDialog(row)}
            className="h-8 w-8"
            title="Edit Material"
          >
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Edit</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => confirmDeleteCategory(row._id)}
            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
            title="Delete Material"
          >
            <Trash className="h-4 w-4" />
            <span className="sr-only">Delete</span>
          </Button>
        </div>
      ),
      className: "text-right",
    },
  ]

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [materialToDelete, setMaterialToDelete] = useState(null)

  return (
    <div>
      <Header title="Materials" />
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold">All Materials</h2>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#28acc1] hover:bg-[#1e8a9a]">
                <Plus className="mr-2 h-4 w-4" />
                Add Material
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Material</DialogTitle>
                <DialogDescription>Enter the name for the new material.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="material" className={nameError ? "text-destructive" : ""}>
                    Material Name
                  </Label>
                  <Input
                    id="material"
                    value={materialName}
                    onChange={(e) => {
                      setMaterialName(e.target.value)
                      if (nameError) setNameError("")
                    }}
                    placeholder="Enter material name"
                    className={nameError ? "border-destructive" : ""}
                  />
                  {nameError && <p className="text-sm text-destructive">{nameError}</p>}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button className="bg-[#28acc1] hover:bg-[#1e8a9a]" onClick={handleAddMaterial}>
                  Add Material
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Material</DialogTitle>
              <DialogDescription>Update the material name.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-material" className={nameError ? "text-destructive" : ""}>
                  Material Name
                </Label>
                <Input
                  id="edit-material"
                  value={materialName}
                  onChange={(e) => {
                    setMaterialName(e.target.value)
                    if (nameError) setNameError("")
                  }}
                  className={nameError ? "border-destructive" : ""}
                />
                {nameError && <p className="text-sm text-destructive">{nameError}</p>}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button className="bg-[#28acc1] hover:bg-[#1e8a9a]" onClick={handleEditMaterial}>
                Update Material
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <DataTable
          columns={columns}
          data={materials}
          searchKey="material"
          searchPlaceholder="Search materials..."
          itemsPerPage={10}
          loading={loading}
        />

        <ConfirmationDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Delete Material"
          description="Are you sure you want to delete this material? This action cannot be undone and may affect products associated with this material."
          onConfirm={() => {
            handleDeleteMaterial(materialToDelete)
            setDeleteDialogOpen(false)
          }}
          confirmText="Delete"
          cancelText="Cancel"
          variant="destructive"
        />
      </div>
    </div>
  )
}
