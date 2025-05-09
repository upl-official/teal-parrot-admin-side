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

export default function CategoriesPage() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [categoryName, setCategoryName] = useState("")
  const [editCategoryId, setEditCategoryId] = useState(null)
  const [nameError, setNameError] = useState("")
  const { toast } = useToast()

  // State for deletion dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState(null)
  const [categoryToDeleteName, setCategoryToDeleteName] = useState("")
  const [categoryProductCount, setCategoryProductCount] = useState(0)

  // Track loading state for individual product counts
  const [productCountsLoading, setProductCountsLoading] = useState({})

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const response = await fetchApi("/api/v1/category/cat-list/")
      // Updated to match the API response structure
      const categoriesData = response.data || []

      // Initialize categories with zero product counts
      const categoriesWithCounts = categoriesData.map((category) => ({
        ...category,
        productCount: 0,
        isCountLoading: true,
      }))

      setCategories(categoriesWithCounts)

      // Fetch product counts for each category
      await fetchProductCounts(categoriesWithCounts)
    } catch (error) {
      console.error("Failed to fetch categories:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch categories: " + (error.message || "Unknown error"),
      })
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  const fetchProductCounts = async (categoriesData) => {
    // Create a new object to track loading states
    const loadingStates = {}
    categoriesData.forEach((category) => {
      loadingStates[category._id] = true
    })
    setProductCountsLoading(loadingStates)

    // Create a copy of the categories array to update with product counts
    const updatedCategories = [...categoriesData]

    // Fetch product counts for each category
    const countPromises = updatedCategories.map(async (category, index) => {
      try {
        const response = await fetchApi(`/api/v1/product/list/?categoryId=${category._id}`)

        // Extract product count from the correct path in the response
        const productCount = response.data?.products?.length || 0

        console.log(`Category ${category.name} (${category._id}) has ${productCount} products`)

        // Update the category with the product count
        updatedCategories[index] = {
          ...category,
          productCount: productCount,
          isCountLoading: false,
        }

        // Update loading state for this category
        setProductCountsLoading((prev) => ({
          ...prev,
          [category._id]: false,
        }))
      } catch (error) {
        console.error(`Failed to fetch product count for category ${category.name}:`, error)

        // If there's an error, set product count to 0
        updatedCategories[index] = {
          ...category,
          productCount: 0,
          isCountLoading: false,
          countError: true,
        }

        // Update loading state for this category
        setProductCountsLoading((prev) => ({
          ...prev,
          [category._id]: false,
        }))
      }
    })

    // Wait for all count fetches to complete
    await Promise.all(countPromises)

    // Update the categories state with the product counts
    setCategories(updatedCategories)
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

  const confirmDeleteCategory = async (category) => {
    try {
      // Set loading state for this specific check
      setProductCountsLoading((prev) => ({
        ...prev,
        [category._id]: true,
      }))

      // Fetch products associated with this category
      const response = await fetchApi(`/api/v1/product/list/?categoryId=${category._id}`)

      // Extract product count from the correct path in the response
      const productCount = response.data?.products?.length || 0

      console.log(`Checking deletion for category ${category.name} (${category._id}): ${productCount} products found`)

      // Update loading state
      setProductCountsLoading((prev) => ({
        ...prev,
        [category._id]: false,
      }))

      // Store the category info and product count
      setCategoryToDelete(category._id)
      setCategoryToDeleteName(category.name)
      setCategoryProductCount(productCount)

      // Open the confirmation dialog
      setDeleteDialogOpen(true)
    } catch (error) {
      console.error(`Failed to check products for category ${category.name}:`, error)

      // Update loading state
      setProductCountsLoading((prev) => ({
        ...prev,
        [category._id]: false,
      }))

      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to check associated products: " + (error.message || "Unknown error"),
      })
    }
  }

  const handleDeleteCategory = async () => {
    // If there are associated products, don't allow deletion
    if (categoryProductCount > 0) {
      setDeleteDialogOpen(false)
      toast({
        variant: "destructive",
        title: "Cannot Delete Category",
        description: `This category has ${categoryProductCount} associated products. Please reassign or delete these products first.`,
      })
      return
    }

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
        description: "Failed to delete category: " + (error.message || "Unknown error"),
      })
    } finally {
      setDeleteDialogOpen(false)
      setCategoryToDelete(null)
      setCategoryToDeleteName("")
      setCategoryProductCount(0)
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
            title="Edit Category"
          >
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Edit</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => confirmDeleteCategory(row)}
            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
            title="Delete Category"
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

        {/* Completely separate dialogs for different cases */}
        {categoryProductCount > 0 ? (
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cannot Delete Category</AlertDialogTitle>
              </AlertDialogHeader>

              <div className="py-3">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Action Not Allowed</AlertTitle>
                  <AlertDescription>
                    There are {categoryProductCount} active products under this category. Delete or reassign these
                    products to a different category to delete this category.
                  </AlertDescription>
                </Alert>

                <div className="mt-4 space-y-2">
                  <p className="font-medium">To delete this category, you must first:</p>
                  <ol className="list-decimal pl-5 space-y-1">
                    <li>Go to the Products page</li>
                    <li>Reassign or delete products under this category</li>
                    <li>Return to this page and try deleting the category again</li>
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
                <AlertDialogTitle>Delete Category</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete the category "{categoryToDeleteName}"? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel asChild>
                  <Button variant="outline">Cancel</Button>
                </AlertDialogCancel>
                <AlertDialogAction asChild>
                  <Button variant="destructive" onClick={handleDeleteCategory}>
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
