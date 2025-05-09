"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Pencil, Trash, Percent, Package, Eye, Copy, X, Check } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { fetchApi } from "@/lib/api"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { DiscountManagementModal } from "@/components/products/discount-management-modal"
import { DuplicationModal, type DuplicationOptions } from "@/components/products/duplication-modal"
import { GroupedProductRow } from "@/components/products/grouped-product-row"
import { EnhancedPagination } from "@/components/ui/enhanced-pagination"
import { uploadFiles } from "@/lib/upload"
import { downloadAndProcessImages } from "@/lib/image-utils"
import { Progress } from "@/components/ui/progress"
// Add the import for the BulkDiscountModal component
import { BulkDiscountModal } from "@/components/products/bulk-discount-modal"

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [allProducts, setAllProducts] = useState([]) // Store all products for client-side pagination when grouping
  const [groupedProducts, setGroupedProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState(null)
  const [discountModalOpen, setDiscountModalOpen] = useState(false)
  const [duplicationModalOpen, setDuplicationModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState("")
  const [duplicating, setDuplicating] = useState(false)
  const [imageProgress, setImageProgress] = useState({ current: 0, total: 0 })
  const [groupBySize, setGroupBySize] = useState(true)

  // Bulk deletion states
  const [selectedProducts, setSelectedProducts] = useState([])
  const [selectAllChecked, setSelectAllChecked] = useState(false)
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false)
  const [bulkDeleteProgress, setBulkDeleteProgress] = useState({ current: 0, total: 0, success: 0, failed: 0 })
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  const [bulkDeleteErrors, setBulkDeleteErrors] = useState([])
  // Add a new state for the bulk discount modal
  const [bulkDiscountModalOpen, setBulkDiscountModalOpen] = useState(false)

  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [itemsPerPage, selectedCategory, searchTerm])

  // When grouping is toggled or products change, update the grouped products
  useEffect(() => {
    if (groupBySize) {
      const grouped = groupProductsByNameAndCategory(allProducts)
      setGroupedProducts(grouped)

      // Update pagination based on grouped products
      updatePaginationForGroupedProducts(grouped)
    } else {
      setGroupedProducts([])

      // When not grouping, use the standard pagination from the API
      setTotalItems(allProducts.length)
      setTotalPages(Math.ceil(allProducts.length / itemsPerPage))

      // Apply client-side pagination to show the correct page
      const startIndex = (currentPage - 1) * itemsPerPage
      const endIndex = startIndex + itemsPerPage
      setProducts(allProducts.slice(startIndex, endIndex))
    }
  }, [allProducts, groupBySize, currentPage, itemsPerPage])

  // Reset selected products when products change
  useEffect(() => {
    setSelectedProducts([])
    setSelectAllChecked(false)
  }, [products, groupedProducts])

  // Update pagination when page size changes
  useEffect(() => {
    // Reset to first page when changing items per page
    setCurrentPage(1)
  }, [itemsPerPage])

  const updatePaginationForGroupedProducts = (grouped) => {
    // For grouped products, each group counts as one item for pagination
    const totalGroupCount = grouped.length
    setTotalItems(totalGroupCount)
    setTotalPages(Math.ceil(totalGroupCount / itemsPerPage))

    // Apply client-side pagination to show the correct page of grouped products
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    setGroupedProducts(grouped.slice(startIndex, endIndex))
  }

  const groupProductsByNameAndCategory = (products) => {
    const groups = {}

    // Group products by name and category
    products.forEach((product) => {
      // Create a key based on product name and category
      const categoryName = typeof product.category === "object" ? product.category.name : product.category

      const key = `${product.name}|${categoryName}`

      if (!groups[key]) {
        groups[key] = []
      }

      groups[key].push(product)
    })

    // Convert the groups object to an array
    return Object.values(groups)
  }

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

  const fetchProducts = async () => {
    try {
      setLoading(true)

      // Build the query parameters - fetch all products to handle grouping client-side
      let queryParams = `limit=1000` // Fetch a large number to handle client-side pagination

      // Add category filter if selected
      if (selectedCategory) {
        queryParams += `&categoryId=${selectedCategory}`
      }

      // Add search term if provided
      if (searchTerm) {
        queryParams += `&searchQuery=${searchTerm}`
      }

      const response = await fetchApi(`/api/v1/product/list/?${queryParams}`)

      // Handle the nested data structure
      const productsData = response.data?.products || response.products || []

      // Store all products for client-side pagination and grouping
      setAllProducts(productsData)

      // Calculate total count
      const totalCount = response.data?.totalCount || response.totalCount || productsData.length
      setTotalItems(totalCount)

      console.log("Products data:", productsData)
      console.log("Total items:", totalCount)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch products",
      })
      setAllProducts([])
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (term) => {
    setSearchTerm(term)
    setCurrentPage(1) // Reset to first page on search
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

      fetchProducts()
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

  const openDuplicationModal = (product) => {
    setSelectedProduct(product)
    setDuplicationModalOpen(true)
  }

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return
    setCurrentPage(page)
  }

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1) // Reset to first page when changing items per page
  }

  const calculateDiscountPercentage = (originalPrice, price) => {
    if (!originalPrice || originalPrice <= price) return 0
    return Math.round(((originalPrice - price) / originalPrice) * 100)
  }

  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId)
    setCurrentPage(1) // Reset to first page on category change
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price)
  }

  // Bulk selection handlers
  const toggleSelectAll = () => {
    if (selectAllChecked) {
      // If already checked, uncheck all
      setSelectedProducts([])
    } else {
      // If not checked, select all currently visible products
      const productsToSelect = []

      if (groupBySize) {
        // For grouped view, select all products in all visible groups
        groupedProducts.forEach((group) => {
          group.forEach((product) => {
            productsToSelect.push(product._id)
          })
        })
      } else {
        // For regular view, select all visible products
        products.forEach((product) => {
          productsToSelect.push(product._id)
        })
      }

      setSelectedProducts(productsToSelect)
    }

    setSelectAllChecked(!selectAllChecked)
  }

  const toggleSelectProduct = (productId) => {
    setSelectedProducts((prev) => {
      if (prev.includes(productId)) {
        // Remove if already selected
        return prev.filter((id) => id !== productId)
      } else {
        // Add if not selected
        return [...prev, productId]
      }
    })
  }

  const toggleSelectGroup = (group) => {
    const groupProductIds = group.map((product) => product._id)

    // Check if all products in this group are already selected
    const allSelected = groupProductIds.every((id) => selectedProducts.includes(id))

    if (allSelected) {
      // If all are selected, unselect the entire group
      setSelectedProducts((prev) => prev.filter((id) => !groupProductIds.includes(id)))
    } else {
      // Otherwise, select all products in the group
      setSelectedProducts((prev) => {
        const newSelection = [...prev]
        groupProductIds.forEach((id) => {
          if (!newSelection.includes(id)) {
            newSelection.push(id)
          }
        })
        return newSelection
      })
    }
  }

  // Bulk delete handlers
  const confirmBulkDelete = () => {
    setBulkDeleteDialogOpen(true)
    setBulkDeleteProgress({
      current: 0,
      total: selectedProducts.length,
      success: 0,
      failed: 0,
    })
    setBulkDeleteErrors([])
  }

  const handleBulkDelete = async () => {
    try {
      setIsBulkDeleting(true)
      const total = selectedProducts.length
      let success = 0
      let failed = 0
      const errors = []

      // Create a copy of selected products to avoid race conditions
      const productsToDelete = [...selectedProducts]

      for (let i = 0; i < productsToDelete.length; i++) {
        const productId = productsToDelete[i]

        try {
          // Update progress
          setBulkDeleteProgress({
            current: i + 1,
            total,
            success,
            failed,
          })

          // Delete the product
          await fetchApi("/api/v1/admin/product/remove", {
            method: "POST",
            body: JSON.stringify({ productId }),
          })

          // Increment success count
          success++
          setBulkDeleteProgress((prev) => ({
            ...prev,
            success,
          }))
        } catch (error) {
          // Handle error for this product
          failed++
          setBulkDeleteProgress((prev) => ({
            ...prev,
            failed,
          }))

          // Store the error
          errors.push({
            productId,
            error: error.message || "Failed to delete product",
          })
        }
      }

      // Store any errors for display
      setBulkDeleteErrors(errors)

      // Show toast with summary
      if (errors.length === 0) {
        toast({
          title: "Success",
          description: `Successfully deleted ${success} products`,
        })
      } else {
        toast({
          variant: "destructive",
          title: "Partial Success",
          description: `Deleted ${success} products. Failed to delete ${failed} products.`,
        })
      }

      // Refresh product list
      fetchProducts()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to complete bulk deletion",
      })
    } finally {
      setBulkDeleteDialogOpen(false)
      setIsBulkDeleting(false)
      setSelectedProducts([])
      setSelectAllChecked(false)
    }
  }

  // Apply discount to the newly created product using the correct API endpoint
  const applyDiscountToProduct = async (productId, discountPercentage) => {
    try {
      if (!productId || !discountPercentage || discountPercentage <= 0) {
        console.log("No discount to apply")
        return { success: true }
      }

      const discountData = {
        productId: productId,
        discountPercentage: discountPercentage.toString(),
      }

      console.log("Applying discount:", discountData)

      const response = await fetchApi("/api/v1/admin/product/add-discount", {
        method: "POST",
        body: JSON.stringify(discountData),
      })

      console.log("Discount application response:", response)
      return response
    } catch (error) {
      console.error("Failed to apply discount:", error)
      throw new Error(`Failed to apply discount: ${error.message || "Unknown error"}`)
    }
  }

  // Enhanced function to handle product duplication with options
  const handleDuplicateProduct = async (options: DuplicationOptions) => {
    try {
      setDuplicating(true)
      setImageProgress({ current: 0, total: 0 })

      // Show initial toast
      const loadingToast = toast({
        title: "Duplicating Product",
        description: "Starting duplication process...",
      })

      // Fetch the full product details to ensure we have all data
      const response = await fetchApi(`/api/v1/product/list?productId=${selectedProduct._id}`)
      const productDetails = response.data?.product || selectedProduct

      // Update toast
      toast({
        id: loadingToast,
        title: "Duplicating Product",
        description: "Fetching reference data...",
      })

      // Fetch categories, materials, and grades to ensure we have the correct IDs
      const [categoriesResponse, materialsResponse, gradesResponse] = await Promise.all([
        fetchApi("/api/v1/category/cat-list/"),
        fetchApi("/api/v1/material/mat-list/"),
        fetchApi("/api/v1/grade/gra-list/"),
      ])

      const categoriesData = categoriesResponse.data || []
      const materialsData = materialsResponse.data || []
      const gradesData = gradesResponse.data || []

      // Helper function to find ID by name
      const findIdByName = (array, nameKey, nameValue) => {
        if (!array || !Array.isArray(array) || !nameValue) return ""
        const item = array.find((item) => item[nameKey] === nameValue)
        return item ? item._id : ""
      }

      // Determine category ID - handle both object and string cases
      let categoryId
      if (typeof productDetails.category === "object" && productDetails.category?._id) {
        categoryId = productDetails.category._id
      } else if (typeof productDetails.category === "string") {
        // If it's already an ID (24 char hex string)
        if (productDetails.category.match(/^[0-9a-fA-F]{24}$/)) {
          categoryId = productDetails.category
        } else {
          // It's a name, look up the ID
          categoryId = findIdByName(categoriesData, "name", productDetails.category)
        }
      }

      // Determine material ID - handle both object and string cases
      let materialId
      if (typeof productDetails.material === "object" && productDetails.material?._id) {
        materialId = productDetails.material._id
      } else if (typeof productDetails.material === "string") {
        // If it's already an ID (24 char hex string)
        if (productDetails.material.match(/^[0-9a-fA-F]{24}$/)) {
          materialId = productDetails.material
        } else {
          // It's a name, look up the ID
          materialId = findIdByName(materialsData, "material", productDetails.material)
        }
      }

      // Determine grade ID - handle both object and string cases
      let gradeId
      if (typeof productDetails.grade === "object" && productDetails.grade?._id) {
        gradeId = productDetails.grade._id
      } else if (typeof productDetails.grade === "string") {
        // If it's already an ID (24 char hex string)
        if (productDetails.grade.match(/^[0-9a-fA-F]{24}$/)) {
          gradeId = productDetails.grade
        } else {
          // It's a name, look up the ID
          gradeId = findIdByName(gradesData, "grade", productDetails.grade)
        }
      }

      console.log("Mapped IDs for duplication:", { categoryId, materialId, gradeId })

      // Calculate original price and discount
      const originalPrice = productDetails.originalPrice || productDetails.price
      const currentPrice = productDetails.price
      const originalStock = productDetails.stock || 0
      const originalDiscountPercentage = calculateDiscountPercentage(originalPrice, currentPrice)

      // Get the image URLs to download and re-upload
      const imageUrls = productDetails.images || []

      // Update toast for image processing
      toast({
        id: loadingToast,
        title: "Duplicating Product",
        description: `Processing ${imageUrls.length} images...`,
      })

      // Set total images for progress tracking
      setImageProgress({ current: 0, total: imageUrls.length })

      // Download and process images with progress tracking
      const imageFiles = await downloadAndProcessImages(imageUrls, (current, total) => {
        setImageProgress({ current, total })
        toast({
          id: loadingToast,
          title: "Duplicating Product",
          description: `Processing images (${current}/${total})...`,
        })
      })

      // Handle size variations if selected
      if (options.createSizeVariations && options.sizeVariations && options.sizeVariations.length > 0) {
        toast({
          id: loadingToast,
          title: "Duplicating Product",
          description: `Creating ${options.sizeVariations.length} size variations...`,
        })

        // Create each size variation
        const createdProducts = []
        for (let i = 0; i < options.sizeVariations.length; i++) {
          const variation = options.sizeVariations[i]

          // Create a new product object for this size variation
          const sizeVariationProduct = {
            name: productDetails.name, // Keep original name
            description: productDetails.description,
            stock: variation.stock, // Use the stock from the variation
            category: categoryId,
            material: materialId,
            grade: gradeId,
            price: variation.price, // Use the price from the variation
            gem: productDetails.gem,
            coating: productDetails.coating,
            size: variation.size, // Use the size from the variation
          }

          toast({
            id: loadingToast,
            title: "Duplicating Product",
            description: `Creating size variation ${i + 1}/${options.sizeVariations.length}: ${variation.size}...`,
          })

          // Create the new product with the duplicated data and images
          const result = await uploadFiles(imageFiles, sizeVariationProduct)

          if (!result.success) {
            throw new Error(`Failed to create size variation ${variation.size}: ${result.message || "Unknown error"}`)
          }

          // Extract the new product ID from the nested response structure
          const newProductId = result.data?.data?._id
          if (!newProductId) {
            console.error("Product creation response:", result)
            throw new Error(
              `New product ID not found in response for size ${variation.size}. Check console for details.`,
            )
          }

          console.log(`Size variation ${variation.size} created with ID:`, newProductId)

          // Apply discount if needed
          if (variation.discountPercentage > 0) {
            toast({
              id: loadingToast,
              title: "Duplicating Product",
              description: `Applying ${variation.discountPercentage}% discount to size ${variation.size}...`,
            })

            const discountResult = await applyDiscountToProduct(newProductId, variation.discountPercentage)

            if (!discountResult.success) {
              throw new Error(
                `Failed to apply discount to size ${variation.size}: ${discountResult.message || "Unknown error"}`,
              )
            }
          }

          createdProducts.push({
            id: newProductId,
            size: variation.size,
            discountPercentage: variation.discountPercentage,
          })
        }

        toast({
          id: loadingToast,
          title: "Success",
          description: `Created ${createdProducts.length} size variations successfully`,
          variant: "default",
        })

        // Refresh the product list
        fetchProducts()
      } else {
        // Standard duplication (single product)
        // Determine values based on user choice
        const productName = `${productDetails.name} (Copy)`
        const productPrice = options.applySamePrice ? originalPrice : options.customPrice
        const discountPercentage = options.applySameDiscount
          ? originalDiscountPercentage
          : options.customDiscountPercentage
        const stockLevel = options.applySameStock ? originalStock : options.customStock

        // Create a new product object with the duplicated data
        const duplicatedProduct = {
          name: productName,
          description: productDetails.description,
          stock: stockLevel,
          category: categoryId,
          material: materialId,
          grade: gradeId,
          price: productPrice, // Use the price from options
          gem: productDetails.gem,
          coating: productDetails.coating,
          size: productDetails.size,
        }

        // Update toast for upload
        toast({
          id: loadingToast,
          title: "Duplicating Product",
          description: `Uploading new product with ${imageFiles.length} images...`,
        })

        // Create the new product with the duplicated data and images
        const result = await uploadFiles(imageFiles, duplicatedProduct)

        if (!result.success) {
          throw new Error(result.message || "Failed to create duplicated product")
        }

        // Extract the new product ID from the nested response structure
        const newProductId = result.data?.data?._id
        if (!newProductId) {
          console.error("Product creation response:", result)
          throw new Error("New product ID not found in response. Check console for details.")
        }

        console.log("New product created with ID:", newProductId)

        // Apply discount if needed
        if (discountPercentage > 0) {
          toast({
            id: loadingToast,
            title: "Duplicating Product",
            description: `Applying ${discountPercentage}% discount to duplicated product...`,
          })

          const discountResult = await applyDiscountToProduct(newProductId, discountPercentage)

          if (!discountResult.success) {
            throw new Error(discountResult.message || "Failed to apply discount to duplicated product")
          }
        }

        toast({
          id: loadingToast,
          title: "Success",
          description: "Product duplicated successfully",
          variant: "default",
        })

        // Refresh the product list
        fetchProducts()
      }
    } catch (error) {
      console.error("Duplication error:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to duplicate product: ${error.message || "Unknown error"}`,
      })
    } finally {
      setDuplicating(false)
      setSelectedProduct(null)
      setImageProgress({ current: 0, total: 0 })
    }
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
            onClick={() => openDuplicationModal(row)}
            className="h-8 w-8"
            title="Duplicate Product"
            disabled={duplicating}
          >
            {duplicating && selectedProduct?._id === row._id ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
            ) : (
              <Copy className="h-4 w-4" />
            )}
            <span className="sr-only">Duplicate Product</span>
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

  // Add this function to open the bulk discount modal
  const openBulkDiscountModal = () => {
    setBulkDiscountModalOpen(true)
  }

  // Function to get a placeholder image for products
  const getPlaceholderImage = () => {
    return "diverse-products-still-life.png"
  }

  return (
    <div>
      <Header title="Products" />
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">All Products</h2>
            {selectedProducts.length > 0 && <Badge variant="secondary">{selectedProducts.length} selected</Badge>}
          </div>
          {/* Update the buttons section in the UI to include the bulk discount button */}
          <div className="flex gap-2">
            {selectedProducts.length > 0 ? (
              <>
                <Button
                  variant="outline"
                  onClick={openBulkDiscountModal}
                  className="flex items-center gap-1 border-orange-200 text-orange-600 hover:bg-orange-50 hover:text-orange-700"
                >
                  <Percent className="h-4 w-4" />
                  Apply Discount ({selectedProducts.length})
                </Button>
                <Button variant="destructive" onClick={confirmBulkDelete} className="flex items-center gap-1">
                  <Trash className="h-4 w-4" />
                  Delete Selected ({selectedProducts.length})
                </Button>
              </>
            ) : null}
            <Button variant="outline" onClick={() => setGroupBySize(!groupBySize)} className="mr-2">
              {groupBySize ? "Show All Products" : "Group By Size"}
            </Button>
            <Button className="bg-[#28acc1] hover:bg-[#1e8a9a]" onClick={() => router.push("/dashboard/products/add")}>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </div>
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
                {/* Bulk selection checkbox */}
                <th className="h-10 w-10 px-2 text-center">
                  <Checkbox
                    checked={selectAllChecked}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all products"
                  />
                </th>
                {groupBySize && <th className="h-10 w-8 px-2 text-left font-medium"></th>}
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
                  <td colSpan={groupBySize ? 10 : 9} className="h-24 text-center">
                    <div className="flex justify-center items-center h-full">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    </div>
                  </td>
                </tr>
              ) : (groupBySize ? groupedProducts : products).length === 0 ? (
                <tr>
                  <td colSpan={groupBySize ? 10 : 9} className="h-24 text-center">
                    No products found.
                  </td>
                </tr>
              ) : groupBySize ? (
                // Grouped products display with bulk selection
                groupedProducts.map((group, groupIndex) => (
                  <GroupedProductRow
                    key={`group-${groupIndex}`}
                    products={group}
                    onEdit={(id) => router.push(`/dashboard/products/edit/${id}`)}
                    onDelete={confirmDeleteProduct}
                    onDuplicate={openDuplicationModal}
                    onManageDiscount={openDiscountModal}
                    formatPrice={formatPrice}
                    calculateDiscountPercentage={calculateDiscountPercentage}
                    duplicating={duplicating}
                    selectedProductId={selectedProduct?._id}
                    selectedProducts={selectedProducts}
                    onSelectProduct={toggleSelectProduct}
                    onSelectGroup={toggleSelectGroup}
                    placeholderImage={getPlaceholderImage()}
                  />
                ))
              ) : (
                // Standard products display with bulk selection
                products.map((product) => (
                  <tr
                    key={product._id}
                    className={`border-b hover:bg-muted/50 ${
                      selectedProducts.includes(product._id) ? "bg-muted/30" : ""
                    }`}
                  >
                    <td className="p-2 text-center">
                      <Checkbox
                        checked={selectedProducts.includes(product._id)}
                        onCheckedChange={() => toggleSelectProduct(product._id)}
                        aria-label={`Select ${product.name}`}
                      />
                    </td>
                    <td className="p-2">
                      <div className="h-10 w-10 rounded bg-gray-200 flex items-center justify-center">
                        <Package className="h-5 w-5 text-gray-500" />
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

        {/* Enhanced Pagination */}
        <EnhancedPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
          pageSizeOptions={[10, 25, 50, 100]}
        />

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

        {/* Bulk Delete Confirmation Dialog */}
        <ConfirmationDialog
          open={bulkDeleteDialogOpen}
          onOpenChange={(open) => {
            if (!isBulkDeleting) setBulkDeleteDialogOpen(open)
          }}
          title="Delete Selected Products"
          description={`Are you sure you want to delete ${selectedProducts.length} selected products? This action cannot be undone.`}
          onConfirm={handleBulkDelete}
          confirmText="Delete All"
          cancelText="Cancel"
          variant="destructive"
        >
          {isBulkDeleting && (
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span>
                  Deleting products ({bulkDeleteProgress.current} of {bulkDeleteProgress.total})
                </span>
                <span>
                  <span className="text-green-600 mr-3">
                    <Check className="h-4 w-4 inline-block mr-1" />
                    {bulkDeleteProgress.success}
                  </span>
                  <span className="text-red-600">
                    <X className="h-4 w-4 inline-block mr-1" />
                    {bulkDeleteProgress.failed}
                  </span>
                </span>
              </div>
              <Progress value={(bulkDeleteProgress.current / bulkDeleteProgress.total) * 100} className="h-2" />
              {bulkDeleteErrors.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-red-600">Failed to delete:</p>
                  <div className="mt-1 max-h-24 overflow-y-auto text-xs">
                    {bulkDeleteErrors.map((error, index) => (
                      <div key={index} className="py-1">
                        {error.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </ConfirmationDialog>

        {/* Discount Management Modal */}
        {selectedProduct && (
          <DiscountManagementModal
            open={discountModalOpen}
            onOpenChange={setDiscountModalOpen}
            product={selectedProduct}
            onSuccess={() => fetchProducts()}
          />
        )}

        {/* Duplication Modal */}
        {selectedProduct && (
          <DuplicationModal
            open={duplicationModalOpen}
            onOpenChange={setDuplicationModalOpen}
            product={selectedProduct}
            onDuplicate={handleDuplicateProduct}
            onCancel={() => setSelectedProduct(null)}
          />
        )}

        {/* Bulk Discount Modal */}
        <BulkDiscountModal
          open={bulkDiscountModalOpen}
          onOpenChange={setBulkDiscountModalOpen}
          selectedProducts={selectedProducts}
          onSuccess={() => fetchProducts()}
        />
      </div>
    </div>
  )
}
