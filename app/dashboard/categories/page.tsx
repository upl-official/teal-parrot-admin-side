"use client"

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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Plus, Pencil, Trash } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { fetchApi } from "@/lib/api"
import { DataTable } from "@/components/ui/data-table"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"

export default function CategoriesPage() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [categoryName, setCategoryName] = useState("")
  const [editCategoryId, setEditCategoryId] = useState(null)
  const [nameError, setNameError] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const response = await fetchApi("/api/v1/category/cat-list/")
      // Updated to match the API response structure
      const categoriesData = response.data || []

      // Fetch product counts for each category
      const categoriesWithCounts = await Promise.all(
        categoriesData.map(async (category) => {
          try {
            const productResponse = await fetchApi(`/api/v1/product/list/?categoryId=${category._id}`)
            const products = productResponse.data?.products || productResponse.products || []
            return {
              ...category,
              productCount: products.length,
            }
          } catch (error) {
            console.error(`Error fetching products for category ${category.name}:`, error)
            return {
              ...category,
              productCount: 0,
            }
          }
        }),
      )

      setCategories(categoriesWithCounts)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch categories",
      })
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  const validateCategoryName = () => {
    if (!categoryName.trim()) {
      setNameError("Category name is required")
      return false
    }
    setNameError("")
    return true
  }

  const handleAddCategory = async () => {
    if (!validateCategoryName()) return

    try {
      await fetchApi("/api/v1/admin/category/add", {
        method: "POST",
        body: JSON.stringify({ name: categoryName }),
      })

      toast({
        title: "Success",
        description: "Category added successfully",
      })

      setCategoryName("")
      setIsAddDialogOpen(false)
      fetchCategories()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add category: " + (error.message || "Unknown error"),
      })
    }
  }

  const handleEditCategory = async () => {
    if (!validateCategoryName()) return

    try {
      await fetchApi("/api/v1/admin/category/update", {
        method: "PUT",
        body: JSON.stringify({ catId: editCategoryId, name: categoryName }),
      })

      toast({
        title: "Success",
        description: "Category updated successfully",
      })

      setCategoryName("")
      setIsEditDialogOpen(false)
      fetchCategories()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update category: " + (error.message || "Unknown error"),
      })
    }
  }

  const confirmDeleteCategory = (categoryId) => {
    setCategoryToDelete(categoryId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteCategory = async () => {
    try {
      await fetchApi("/api/v1/admin/category/remove", {
        method: "DELETE",
        body: JSON.stringify({ catId: categoryToDelete }),
      })

      toast({
        title: "Success",
        description: "Category deleted successfully",
      })

      fetchCategories()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete category",
      })
    } finally {
      setDeleteDialogOpen(false)
      setCategoryToDelete(null)
    }
  }

  const openEditDialog = (category) => {
    setEditCategoryId(category._id)
    setCategoryName(category.name)
    setIsEditDialogOpen(true)
  }

  const columns = [
    {
      key: "name",
      header: "Name",
      cell: (row) => <span className="font-medium">{row.name}</span>,
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
            title="Edit Category"
          >
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Edit</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => confirmDeleteCategory(row._id)}
            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
            title="Delete Category"
          >
            <Trash className="h-4 w-4" />
            <span className="sr-only">Delete</span>
          </Button>
        </div>
      ),
      className: "text-right",
    },
  ]

  return (
    <div>
      <Header title="Categories" />
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold">All Categories</h2>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#28acc1] hover:bg-[#1e8a9a]">
                <Plus className="mr-2 h-4 w-4" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Category</DialogTitle>
                <DialogDescription>Enter the name for the new category.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name" className={nameError ? "text-destructive" : ""}>
                    Category Name
                  </Label>
                  <Input
                    id="name"
                    value={categoryName}
                    onChange={(e) => {
                      setCategoryName(e.target.value)
                      if (nameError) setNameError("")
                    }}
                    placeholder="Enter category name"
                    className={nameError ? "border-destructive" : ""}
                  />
                  {nameError && <p className="text-sm text-destructive">{nameError}</p>}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button className="bg-[#28acc1] hover:bg-[#1e8a9a]" onClick={handleAddCategory}>
                  Add Category
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Category</DialogTitle>
              <DialogDescription>Update the category name.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name" className={nameError ? "text-destructive" : ""}>
                  Category Name
                </Label>
                <Input
                  id="edit-name"
                  value={categoryName}
                  onChange={(e) => {
                    setCategoryName(e.target.value)
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
              <Button className="bg-[#28acc1] hover:bg-[#1e8a9a]" onClick={handleEditCategory}>
                Update Category
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <DataTable
          columns={columns}
          data={categories}
          searchKey="name"
          searchPlaceholder="Search categories..."
          itemsPerPage={10}
          loading={loading}
        />

        {/* Delete Confirmation Dialog */}
        <ConfirmationDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Delete Category"
          description="Are you sure you want to delete this category? This action cannot be undone and may affect products associated with this category."
          onConfirm={handleDeleteCategory}
          confirmText="Delete"
          cancelText="Cancel"
          variant="destructive"
        />
      </div>
    </div>
  )
}
