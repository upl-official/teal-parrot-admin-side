"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Trash, Percent, Package, ChevronLeft, ChevronRight, Eye } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { fetchApi } from "@/lib/api"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { DiscountManagementModal } from "@/components/products/discount-management-modal"

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [itemsPerPage] = useState(10)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState(null)
  const [discountModalOpen, setDiscountModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState("")

  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    fetchProducts(currentPage)
    fetchCategories()
  }, [currentPage])

  const fetchCategories = async () => {
    try {
      const response = await fetchApi("/api/v1/category/cat-list/")
      const categoriesData = response.data || []
      setCategories(categoriesData)
    } catch (error) {
      console.error("Failed to fetch categories:", error)
      setCategories([])
    }
  }

  const fetchProducts = async (page = 1) => {
    try {
      setLoading(true)

      // Build the query parameters
      let queryParams = `page=${page}&limit=${itemsPerPage}`

      // Add category filter if selected
      if (selectedCategory) {
        queryParams += `&categoryId=${selectedCategory}`
      }

      const response = await fetchApi(`/api/v1/product/list/?${queryParams}`)

      // Handle the nested data structure
      const productsData = response.data?.products || response.products || []
      setProducts(productsData)

      // Calculate total pages based on total count if available
      const totalCount = response.data?.totalCount || response.totalCount || productsData.length
      setTotalPages(Math.ceil(totalCount / itemsPerPage))

      console.log("Products data:", productsData)
      console.log("Total pages:", Math.ceil(totalCount / itemsPerPage))
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch products",
      })
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (term) => {
    setSearchTerm(term)
    setCurrentPage(1) // Reset to first page on search

    // If search term is empty, fetch all products with current category filter
    if (!term.trim()) {
      fetchProducts(1)
      return
    }

    // Otherwise, fetch filtered products
    fetchFilteredProducts(term)
  }

  const fetchFilteredProducts = async (term) => {
    try {
      setLoading(true)

      // Build the query parameters
      let queryParams = `searchQuery=${term}&page=${currentPage}&limit=${itemsPerPage}`

      // Add category filter if selected
      if (selectedCategory) {
        queryParams += `&categoryId=${selectedCategory}`
      }

      const response = await fetchApi(`/api/v1/product/list/?${queryParams}`)

      // Handle the nested data structure
      const productsData = response.data?.products || response.products || []
      setProducts(productsData)

      // Calculate total pages based on filtered count
      const totalCount = response.data?.totalCount || response.totalCount || productsData.length
      setTotalPages(Math.ceil(totalCount / itemsPerPage))
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to search products",
      })
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const confirmDeleteProduct = (productId) => {
    setProductToDelete(productId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteProduct = async () => {
    try {
      // Updated to match the required request body structure
      await fetchApi("/api/v1/admin/product/remove", {
        method: "POST",
        body: JSON.stringify({ productId: productToDelete }),
      })

      toast({
        title: "Success",
        description: "Product deleted successfully",
      })

      fetchProducts(currentPage)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete product",
      })
    } finally {
      setDeleteDialogOpen(false)
      setProductToDelete(null)
    }
  }

  const openDiscountModal = (product) => {
    setSelectedProduct(product)
    setDiscountModalOpen(true)
  }

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return
    setCurrentPage(page)
  }

  const calculateDiscountPercentage = (originalPrice, price) => {
    if (!originalPrice || originalPrice <= price) return 0
    return Math.round(((originalPrice - price) / originalPrice) * 100)
  }

  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId)
    setCurrentPage(1) // Reset to first page on category change

    // If we have a search term, apply both filters
    if (searchTerm.trim()) {
      fetchFilteredProducts(searchTerm)
    } else {
      // Otherwise just filter by category
      fetchProducts(1)
    }
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price)
  }

  const columns = [
    {
      key: "name",
      header: "Name",
      cell: (row) => <span className="font-medium">{row.name}</span>,
    },
    {
      key: "category",
      header: "Category",
      cell: (row) => <span>{row.category || "Uncategorized"}</span>,
      className: "hidden md:table-cell",
    },
    {
      key: "material",
      header: "Material",
      cell: (row) => <span>{row.material || "Not specified"}</span>,
      className: "hidden md:table-cell",
    },
    {
      key: "price",
      header: "Price",
      cell: (row) => (
        <div className="flex flex-col">
          {row.originalPrice ? (
            <>
              <div className="flex items-center">
                <span className="text-xs text-gray-500 mr-1">MRP:</span>
                <span className="line-through text-gray-500">{formatPrice(row.originalPrice)}</span>
              </div>
              <div className="flex items-center">
                <span className="text-xs text-gray-500 mr-1">Selling:</span>
                <span className="font-medium">{formatPrice(row.price)}</span>
                <span className="ml-2 text-green-600 text-xs">
                  ({calculateDiscountPercentage(row.originalPrice, row.price)}% off)
                </span>
              </div>
            </>
          ) : (
            <div className="flex items-center">
              <span className="text-xs text-gray-500 mr-1">Price:</span>
              <span>{formatPrice(row.price)}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: "stock",
      header: "Stock",
      cell: (row) => <span>{row.stock}</span>,
      className: "hidden md:table-cell",
    },
    {
      key: "status",
      header: "Status",
      cell: (row) =>
        row.stock > 0 ? (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">In Stock</Badge>
        ) : (
          <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">
            Out of Stock
          </Badge>
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
            onClick={() => router.push(`/dashboard/products/view/${row._id}`)}
            className="h-8 w-8"
            title="View Details"
          >
            <Eye className="h-4 w-4" />
            <span className="sr-only">View Details</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => openDiscountModal(row)}
            className="h-8 w-8"
            title="Manage Discount"
          >
            <Percent className="h-4 w-4" />
            <span className="sr-only">Manage Discount</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/dashboard/products/edit/${row._id}`)}
            className="h-8 w-8"
            title="Edit Product"
          >
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Edit Product</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => confirmDeleteProduct(row._id)}
            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
            title="Delete Product"
          >
            <Trash className="h-4 w-4" />
            <span className="sr-only">Delete Product</span>
          </Button>
        </div>
      ),
      className: "text-right",
    },
  ]

  return (
    <div>
      <Header title="Products" />
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold">All Products</h2>
          <Button className="bg-[#28acc1] hover:bg-[#1e8a9a]" onClick={() => router.push("/dashboard/products/add")}>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg
                className="w-4 h-4 text-gray-500"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 20 20"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
                />
              </svg>
            </div>
            <input
              type="search"
              className="block w-full p-2 pl-10 text-sm border rounded-lg bg-background"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          <div className="w-full md:w-64">
            <select
              className="w-full p-2 text-sm border rounded-lg bg-background"
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Products Table */}
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="h-10 px-2 text-left font-medium">Image</th>
                {columns.map((column) => (
                  <th key={column.key} className={`h-10 px-2 text-left font-medium ${column.className || ""}`}>
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="h-24 text-center">
                    <div className="flex justify-center items-center h-full">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="h-24 text-center">
                    No products found.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product._id} className="border-b hover:bg-muted/50">
                    <td className="p-2">
                      <div className="h-10 w-10 rounded bg-gray-200 flex items-center justify-center">
                        {product.images && product.images.length > 0 ? (
                          <img
                            src={product.images[0] || "/placeholder.svg?height=40&width=40&query=product"}
                            alt={product.name}
                            className="h-10 w-10 object-cover rounded"
                            onError={(e) => {
                              e.currentTarget.src = "/diverse-products-still-life.png"
                            }}
                          />
                        ) : (
                          <Package className="h-5 w-5 text-gray-500" />
                        )}
                      </div>
                    </td>
                    {columns.map((column) => (
                      <td key={column.key} className={`p-2 ${column.className || ""}`}>
                        {column.cell(product)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-6">
            <nav className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Previous Page</span>
              </Button>

              {/* Page Numbers */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  // Show pages around current page
                  let pageNum
                  if (totalPages <= 5) {
                    // If 5 or fewer pages, show all
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    // If near start, show first 5
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    // If near end, show last 5
                    pageNum = totalPages - 4 + i
                  } else {
                    // Otherwise show current and 2 on each side
                    pageNum = currentPage - 2 + i
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="icon"
                      onClick={() => handlePageChange(pageNum)}
                      className="w-8 h-8"
                    >
                      {pageNum}
                    </Button>
                  )
                })}
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">Next Page</span>
              </Button>
            </nav>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <ConfirmationDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Delete Product"
          description="Are you sure you want to delete this product? This action cannot be undone."
          onConfirm={handleDeleteProduct}
          confirmText="Delete"
          cancelText="Cancel"
          variant="destructive"
        />

        {/* Discount Management Modal */}
        {selectedProduct && (
          <DiscountManagementModal
            open={discountModalOpen}
            onOpenChange={setDiscountModalOpen}
            product={selectedProduct}
            onSuccess={() => fetchProducts(currentPage)}
          />
        )}
      </div>
    </div>
  )
}
