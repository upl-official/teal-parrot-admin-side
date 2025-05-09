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
import { Plus, Pencil, Trash, AlertCircle, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { fetchApi } from "@/lib/api"
import { DataTable } from "@/components/ui/data-table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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

export default function MaterialsPage() {
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [materialName, setMaterialName] = useState("")
  const [editMaterialId, setEditMaterialId] = useState(null)
  const [nameError, setNameError] = useState("")
  const { toast } = useToast()

  // State for deletion dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [materialToDelete, setMaterialToDelete] = useState(null)
  const [materialToDeleteName, setMaterialToDeleteName] = useState("")
  const [materialProductCount, setMaterialProductCount] = useState(0)

  // Track loading state for individual product counts
  const [productCountsLoading, setProductCountsLoading] = useState({})

  useEffect(() => {
    fetchMaterials()
  }, [])

  const fetchMaterials = async () => {
    try {
      setLoading(true)
      const response = await fetchApi("/api/v1/material/mat-list/")
      const materialsData = response.data || []

      // Initialize materials with zero product counts
      const materialsWithCounts = materialsData.map((material) => ({
        ...material,
        productCount: 0,
        isCountLoading: true,
      }))

      setMaterials(materialsWithCounts)

      // Fetch product counts for each material
      await fetchProductCounts(materialsWithCounts)
    } catch (error) {
      console.error("Failed to fetch materials:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch materials: " + (error.message || "Unknown error"),
      })
      setMaterials([])
    } finally {
      setLoading(false)
    }
  }

  const fetchProductCounts = async (materialsData) => {
    // Create a new object to track loading states
    const loadingStates = {}
    materialsData.forEach((material) => {
      loadingStates[material._id] = true
    })
    setProductCountsLoading(loadingStates)

    // Create a copy of the materials array to update with product counts
    const updatedMaterials = [...materialsData]

    // Fetch product counts for each material
    const countPromises = updatedMaterials.map(async (material, index) => {
      try {
        const response = await fetchApi(`/api/v1/product/list/?materialId=${material._id}`)

        // Extract product count from the correct path in the response
        // The API returns data.products array
        const productCount = response.data?.products?.length || 0

        console.log(`Material ${material.material} (${material._id}) has ${productCount} products`)

        // Update the material with the product count
        updatedMaterials[index] = {
          ...material,
          productCount: productCount,
          isCountLoading: false,
        }

        // Update loading state for this material
        setProductCountsLoading((prev) => ({
          ...prev,
          [material._id]: false,
        }))
      } catch (error) {
        console.error(`Failed to fetch product count for material ${material.material}:`, error)

        // If there's an error, set product count to 0
        updatedMaterials[index] = {
          ...material,
          productCount: 0,
          isCountLoading: false,
          countError: true,
        }

        // Update loading state for this material
        setProductCountsLoading((prev) => ({
          ...prev,
          [material._id]: false,
        }))
      }
    })

    // Wait for all count fetches to complete
    await Promise.all(countPromises)

    // Update the materials state with the product counts
    setMaterials(updatedMaterials)
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

  const confirmDeleteMaterial = async (material) => {
    try {
      // Set loading state for this specific check
      setProductCountsLoading((prev) => ({
        ...prev,
        [material._id]: true,
      }))

      // Fetch products associated with this material
      const response = await fetchApi(`/api/v1/product/list/?materialId=${material._id}`)

      // Extract product count from the correct path in the response
      const productCount = response.data?.products?.length || 0

      console.log(
        `Checking deletion for material ${material.material} (${material._id}): ${productCount} products found`,
      )

      // Update loading state
      setProductCountsLoading((prev) => ({
        ...prev,
        [material._id]: false,
      }))

      // Store the material info and product count
      setMaterialToDelete(material._id)
      setMaterialToDeleteName(material.material)
      setMaterialProductCount(productCount)

      // Open the confirmation dialog
      setDeleteDialogOpen(true)
    } catch (error) {
      console.error(`Failed to check products for material ${material.material}:`, error)

      // Update loading state
      setProductCountsLoading((prev) => ({
        ...prev,
        [material._id]: false,
      }))

      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to check associated products: " + (error.message || "Unknown error"),
      })
    }
  }

  const handleDeleteMaterial = async () => {
    // If there are associated products, don't allow deletion
    if (materialProductCount > 0) {
      setDeleteDialogOpen(false)
      toast({
        variant: "destructive",
        title: "Cannot Delete Material",
        description: `This material has ${materialProductCount} associated products. Please reassign or delete these products first.`,
      })
      return
    }

    try {
      await fetchApi("/api/v1/admin/material/remove", {
        method: "DELETE",
        body: JSON.stringify({ matId: materialToDelete }),
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
        description: "Failed to delete material: " + (error.message || "Unknown error"),
      })
    } finally {
      setDeleteDialogOpen(false)
      setMaterialToDelete(null)
      setMaterialToDeleteName("")
      setMaterialProductCount(0)
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
      cell: (row) => (
        <div className="flex items-center">
          {productCountsLoading[row._id] ? (
            <div className="flex items-center">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              <span className="text-muted-foreground">Loading...</span>
            </div>
          ) : (
            <span className="font-medium">{row.productCount || 0}</span>
          )}
        </div>
      ),
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
            onClick={() => confirmDeleteMaterial(row)}
            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
            title="Delete Material"
          >
            {productCountsLoading[row._id] ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash className="h-4 w-4" />
            )}
            <span className="sr-only">Delete</span>
          </Button>
        </div>
      ),
      className: "text-right",
    },
  ]

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
                    Material Name <span className="text-red-500">*</span>
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
                  Material Name <span className="text-red-500">*</span>
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

        {/* Completely separate dialogs for different cases */}
        {materialProductCount > 0 ? (
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cannot Delete Material</AlertDialogTitle>
              </AlertDialogHeader>

              <div className="py-3">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Action Not Allowed</AlertTitle>
                  <AlertDescription>
                    There are {materialProductCount} active products under this material. Delete or reassign these
                    products to a different material to delete this material.
                  </AlertDescription>
                </Alert>

                <div className="mt-4 space-y-2">
                  <p className="font-medium">To delete this material, you must first:</p>
                  <ol className="list-decimal pl-5 space-y-1">
                    <li>Go to the Products page.</li>
                    <li>Reassign or delete products under this grade.</li>
                    <li>Return to this page and try deleting the material again.</li>
                  </ol>
                </div>
              </div>

              <AlertDialogFooter>
                <AlertDialogAction asChild>
                  <Button variant="default" onClick={() => setDeleteDialogOpen(false)}>
                    Close
                  </Button>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Material</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete the material "{materialToDeleteName}"? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel asChild>
                  <Button variant="outline">Cancel</Button>
                </AlertDialogCancel>
                <AlertDialogAction asChild>
                  <Button variant="destructive" onClick={handleDeleteMaterial}>
                    Delete
                  </Button>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  )
}
