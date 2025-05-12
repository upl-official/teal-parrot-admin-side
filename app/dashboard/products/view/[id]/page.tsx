"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Header from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Edit, Trash, Percent, Copy, Check, ExternalLink } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { fetchApi } from "@/lib/api"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { DiscountManagementModal } from "@/components/products/discount-management-modal"
import { DuplicationModal, type DuplicationOptions } from "@/components/products/duplication-modal"
import { uploadFiles } from "@/lib/upload"
import { downloadAndProcessImages } from "@/lib/image-utils"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export default function ProductDetailsPage({ params }) {
  const productId = params.id
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [discountModalOpen, setDiscountModalOpen] = useState(false)
  const [duplicationModalOpen, setDuplicationModalOpen] = useState(false)
  const [duplicating, setDuplicating] = useState(false)
  const [imageProgress, setImageProgress] = useState({ current: 0, total: 0 })
  const [imageErrors, setImageErrors] = useState({})
  const [copied, setCopied] = useState(false)
  const [relatedSizes, setRelatedSizes] = useState([])
  const [loadingSizes, setLoadingSizes] = useState(false)

  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    fetchProductDetails()
  }, [productId])

  useEffect(() => {
    if (product) {
      fetchRelatedSizes()
    }
  }, [product])

  // Reset copied state after 2 seconds
  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => {
        setCopied(false)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [copied])

  const fetchProductDetails = async () => {
    try {
      setLoading(true)
      const response = await fetchApi(`/api/v1/product/list?productId=${productId}`)

      if (!response.success || !response.data || !response.data.product) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Product not found",
        })
        router.push("/dashboard/products")
        return
      }

      setProduct(response.data.product)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load product details",
      })
      router.push("/dashboard/products")
    } finally {
      setLoading(false)
    }
  }

  const fetchRelatedSizes = async () => {
    if (!product || !product.name) return

    try {
      setLoadingSizes(true)

      // Get category ID - handle both object and string cases
      let categoryId
      if (typeof product.category === "object" && product.category?._id) {
        categoryId = product.category._id
      } else if (typeof product.category === "string") {
        categoryId = product.category
      }

      // Fetch products with the same name
      const response = await fetchApi(`/api/v1/product/list?limit=100`)

      if (response.success && response.data && response.data.products) {
        // Filter products with the same name and category but different sizes
        const sameNameProducts = response.data.products.filter((p) => {
          // Check if names match (case insensitive)
          const nameMatches = p.name.toLowerCase() === product.name.toLowerCase()

          // Check if categories match
          let pCategoryId
          if (typeof p.category === "object" && p.category?._id) {
            pCategoryId = p.category._id
          } else if (typeof p.category === "string") {
            pCategoryId = p.category
          }

          const categoryMatches = pCategoryId === categoryId

          // Product should match name and category but not be the current product
          return nameMatches && categoryMatches && p._id !== productId
        })

        setRelatedSizes(sameNameProducts)
      }
    } catch (error) {
      console.error("Failed to fetch related sizes:", error)
    } finally {
      setLoadingSizes(false)
    }
  }

  const copyToClipboard = async () => {
    if (!productId) return

    try {
      await navigator.clipboard.writeText(productId)
      setCopied(true)
      toast({
        title: "Copied!",
        description: "Product ID copied to clipboard",
      })
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Failed to copy",
        description: "Could not copy to clipboard",
      })
    }
  }

  const confirmDeleteProduct = () => {
    setDeleteDialogOpen(true)
  }

  const handleDeleteProduct = async () => {
    try {
      await fetchApi("/api/v1/admin/product/remove", {
        method: "POST",
        body: JSON.stringify({ productId }),
      })

      toast({
        title: "Success",
        description: "Product deleted successfully",
      })

      router.push("/dashboard/products")
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete product",
      })
    } finally {
      setDeleteDialogOpen(false)
    }
  }

  const openDiscountModal = () => {
    setDiscountModalOpen(true)
  }

  const openDuplicationModal = () => {
    setDuplicationModalOpen(true)
  }

  // Calculate discount percentage
  const calculateDiscountPercentage = (originalPrice, price) => {
    if (!originalPrice || originalPrice <= price) return 0
    return Math.round(((originalPrice - price) / originalPrice) * 100)
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

  // Handle image loading error
  const handleImageError = (index) => {
    setImageErrors((prev) => ({
      ...prev,
      [index]: true,
    }))
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

      // Fetch categories, materials, and grades to ensure we have the correct IDs
      const [categoriesResponse, materialsResponse, gradesResponse] = await Promise.all([
        fetchApi("/api/v1/category/cat-list/"),
        fetchApi("/api/v1/material/mat-list/"),
        fetchApi("/api/v1/grade/gra-list/"),
      ])

      // Update toast
      toast({
        id: loadingToast,
        title: "Duplicating Product",
        description: "Fetching reference data...",
      })

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
      if (typeof product.category === "object" && product.category?._id) {
        categoryId = product.category._id
      } else if (typeof product.category === "string") {
        // If it's already an ID (24 char hex string)
        if (product.category.match(/^[0-9a-fA-F]{24}$/)) {
          categoryId = product.category
        } else {
          // It's a name, look up the ID
          categoryId = findIdByName(categoriesData, "name", product.category)
        }
      }

      // Determine material ID - handle both object and string cases
      let materialId
      if (typeof product.material === "object" && product.material?._id) {
        materialId = product.material._id
      } else if (typeof product.material === "string") {
        // If it's already an ID (24 char hex string)
        if (product.material.match(/^[0-9a-fA-F]{24}$/)) {
          materialId = product.material
        } else {
          // It's a name, look up the ID
          materialId = findIdByName(materialsData, "material", product.material)
        }
      }

      // Determine grade ID - handle both object and string cases
      let gradeId
      if (typeof product.grade === "object" && product.grade?._id) {
        gradeId = product.grade._id
      } else if (typeof product.grade === "string") {
        // If it's already an ID (24 char hex string)
        if (product.grade.match(/^[0-9a-fA-F]{24}$/)) {
          gradeId = product.grade
        } else {
          // It's a name, look up the ID
          gradeId = findIdByName(gradesData, "grade", product.grade)
        }
      }

      console.log("Mapped IDs for duplication:", { categoryId, materialId, gradeId })

      // Calculate original price and discount
      const originalPrice = product.originalPrice || product.price
      const currentPrice = product.price
      const originalStock = product.stock || 0
      const originalDiscountPercentage = calculateDiscountPercentage(originalPrice, currentPrice)

      // Get the image URLs to download and re-upload
      const imageUrls = product.images || []

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
            name: product.name, // Keep original name
            description: product.description,
            stock: variation.stock, // Use the stock from the variation
            category: categoryId,
            material: materialId,
            grade: gradeId,
            price: variation.price, // Use the price from the variation
            gem: product.gem,
            coating: product.coating,
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

        // Navigate to products list to see all created variations
        router.push("/dashboard/products")
      } else {
        // Standard duplication (single product)
        // Determine values based on user choice
        const productName = `${product.name} (Copy)`
        const productPrice = options.applySamePrice ? originalPrice : options.customPrice
        const discountPercentage = options.applySameDiscount
          ? originalDiscountPercentage
          : options.customDiscountPercentage
        const stockLevel = options.applySameStock ? originalStock : options.customStock

        // Create a new product object with the duplicated data
        const duplicatedProduct = {
          name: productName,
          description: product.description,
          stock: stockLevel,
          category: categoryId,
          material: materialId,
          grade: gradeId,
          price: productPrice, // Use the price from options
          gem: product.gem,
          coating: product.coating,
          size: product.size,
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

        // Navigate to the new product
        router.push(`/dashboard/products/view/${newProductId}`)
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
      setImageProgress({ current: 0, total: 0 })
    }
  }

  if (loading) {
    return (
      <div>
        <Header title="Product Details" />
        <div className="p-6 flex justify-center items-center h-[calc(100vh-4rem)]">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div>
        <Header title="Product Details" />
        <div className="p-6">
          <Button variant="outline" className="mb-6" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Button>
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold mb-2">Product Not Found</h2>
            <p className="text-muted-foreground">
              The product you're looking for doesn't exist or you don't have permission to view it.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Format description for display
  const formatDescription = (text) => {
    if (!text) return ""

    // Replace <br> with line breaks
    let formatted = text.replace(/<br>/g, "\n")

    // Replace *text* with bold
    formatted = formatted.replace(/\*(.*?)\*/g, "<strong>$1</strong>")

    // Replace _text_ with italic
    formatted = formatted.replace(/_(.*?)_/g, "<em>$1</em>")

    // Replace ~text~ with strikethrough
    formatted = formatted.replace(/~(.*?)~/g, "<del>$1</del>")

    // Replace <h>text</h> with heading
    formatted = formatted.replace(/<h>(.*?)<\/h>/g, '<h3 class="text-lg font-semibold mb-2">$1</h3>')

    // Replace => with bullet points
    formatted = formatted.replace(/=>(.*?)(?:\n|$)/g, "<li>$1</li>")

    // Wrap lists in ul tags if they exist
    if (formatted.includes("<li>")) {
      formatted = formatted.replace(/(<li>.*?<\/li>)+/g, '<ul class="list-disc pl-5 mb-4">$&</ul>')
    }

    return formatted
  }

  // Calculate discount percentage for display
  const getDiscountPercentage = () => {
    if (!product.originalPrice || product.originalPrice <= product.price) return 0
    return Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
  }

  // Function to get a placeholder image URL with the product name
  const getPlaceholderImage = (index) => {
    return `/placeholder.svg?height=200&width=200&query=Product ${product.name} ${index + 1}`
  }

  // Sort related sizes for consistent display
  const sortedRelatedSizes = [...relatedSizes].sort((a, b) => {
    // If sizes are strings, try to compare them directly
    if (typeof a.size === "string" && typeof b.size === "string") {
      // Common size abbreviations in order
      const sizeOrder = { XS: 1, S: 2, M: 3, L: 4, XL: 5, XXL: 6, XXXL: 7 }

      // If both sizes are in our predefined order, use that
      if (sizeOrder[a.size] && sizeOrder[b.size]) {
        return sizeOrder[a.size] - sizeOrder[b.size]
      }

      // Otherwise just compare alphabetically
      return a.size.localeCompare(b.size)
    }

    // If sizes are numbers, compare numerically
    if (!isNaN(Number(a.size)) && !isNaN(Number(b.size))) {
      return Number(a.size) - Number(b.size)
    }

    // Fallback to string comparison
    return String(a.size).localeCompare(String(b.size))
  })

  return (
    <div>
      <Header title="Product Details" />
      <div className="p-6">
        <Button variant="outline" className="mb-6" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Products
        </Button>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{product.name}</CardTitle>
                <div className="flex items-center gap-2">
                  {product.stock > 0 ? (
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">In Stock</Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">
                      Out of Stock
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Product Images</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {product.images && product.images.length > 0 ? (
                        product.images.map((image, index) => (
                          <div key={index} className="aspect-square border rounded-md overflow-hidden bg-gray-50">
                            {!imageErrors[index] ? (
                              <Image
                                src={image || "/placeholder.svg"}
                                alt={`${product.name} - Image ${index + 1}`}
                                width={200}
                                height={200}
                                className="w-full h-full object-cover"
                                onError={() => handleImageError(index)}
                              />
                            ) : (
                              <Image
                                src={getPlaceholderImage(index) || "/placeholder.svg"}
                                alt={`${product.name} - Image ${index + 1}`}
                                width={200}
                                height={200}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="aspect-square border rounded-md flex items-center justify-center bg-gray-100">
                          <Image
                            src={getPlaceholderImage(0) || "/placeholder.svg"}
                            alt={product.name}
                            width={200}
                            height={200}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-4">Product Information</h3>
                    <dl className="space-y-2">
                      {/* Product ID with copy button */}
                      <div className="flex justify-between items-center">
                        <dt className="font-medium text-muted-foreground">Product ID:</dt>
                        <dd className="text-right flex items-center">
                          <span className="mr-2 text-sm font-mono bg-gray-100 px-2 py-1 rounded">{productId}</span>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={copyToClipboard}>
                                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{copied ? "Copied!" : "Copy ID"}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </dd>
                      </div>

                      <div className="flex justify-between">
                        <dt className="font-medium text-muted-foreground">Price:</dt>
                        <dd className="text-right">
                          {product.originalPrice ? (
                            <div>
                              <span className="line-through text-gray-500 mr-2">₹{product.originalPrice}</span>
                              <span className="font-bold">₹{product.price}</span>
                              <span className="ml-2 text-green-600 text-sm">({getDiscountPercentage()}% off)</span>
                            </div>
                          ) : (
                            <span className="font-bold">₹{product.price}</span>
                          )}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="font-medium text-muted-foreground">Stock:</dt>
                        <dd className="text-right">{product.stock}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="font-medium text-muted-foreground">Category:</dt>
                        <dd className="text-right">
                          {typeof product.category === "object"
                            ? product.category?.name
                            : product.category || "Uncategorized"}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="font-medium text-muted-foreground">Material:</dt>
                        <dd className="text-right">
                          {typeof product.material === "object"
                            ? product.material?.material
                            : product.material || "Not specified"}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="font-medium text-muted-foreground">Grade:</dt>
                        <dd className="text-right">
                          {typeof product.grade === "object" ? product.grade?.grade : product.grade || "Not specified"}
                        </dd>
                      </div>
                      {product.gem && (
                        <div className="flex justify-between">
                          <dt className="font-medium text-muted-foreground">Gem Type:</dt>
                          <dd className="text-right">{product.gem}</dd>
                        </div>
                      )}
                      {product.coating && (
                        <div className="flex justify-between">
                          <dt className="font-medium text-muted-foreground">Coating:</dt>
                          <dd className="text-right">{product.coating}</dd>
                        </div>
                      )}

                      {/* Enhanced size display */}
                      <div className="flex justify-between items-start">
                        <dt className="font-medium text-muted-foreground pt-1">Size:</dt>
                        <dd className="text-right">
                          <div className="flex flex-col items-end">
                            <Badge className="mb-2">{product.size || "No size"}</Badge>

                            {/* Available sizes section */}
                            {(sortedRelatedSizes.length > 0 || loadingSizes) && (
                              <div className="mt-1">
                                <p className="text-xs text-muted-foreground mb-1">Other available sizes:</p>
                                {loadingSizes ? (
                                  <div className="flex justify-center">
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                                  </div>
                                ) : (
                                  <div className="flex flex-wrap gap-1 justify-end">
                                    {sortedRelatedSizes.map((relatedProduct) => (
                                      <Button
                                        key={relatedProduct._id}
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-xs"
                                        onClick={() => router.push(`/dashboard/products/view/${relatedProduct._id}`)}
                                      >
                                        {relatedProduct.size || "No size"}
                                        <ExternalLink className="ml-1 h-3 w-3" />
                                      </Button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>

                {product.description && (
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-4">Description</h3>
                    <div
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: formatDescription(product.description) }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full" onClick={() => router.push(`/dashboard/products/edit/${productId}`)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Product
                </Button>

                <Button variant="outline" className="w-full" onClick={openDuplicationModal} disabled={duplicating}>
                  {duplicating ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                      Duplicating...
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Duplicate Product
                    </>
                  )}
                </Button>

                {duplicating && imageProgress.total > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Processing images</span>
                      <span>
                        {imageProgress.current} of {imageProgress.total}
                      </span>
                    </div>
                    <Progress value={(imageProgress.current / imageProgress.total) * 100} />
                  </div>
                )}

                <Button variant="outline" className="w-full" onClick={openDiscountModal}>
                  <Percent className="mr-2 h-4 w-4" />
                  {product.originalPrice ? "Manage Discount" : "Add Discount"}
                </Button>

                <Button variant="destructive" className="w-full" onClick={confirmDeleteProduct}>
                  <Trash className="mr-2 h-4 w-4" />
                  Delete Product
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Product Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="font-medium text-muted-foreground">Created:</dt>
                    <dd className="text-right">
                      {product.createdAt ? new Date(product.createdAt).toLocaleDateString() : "N/A"}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium text-muted-foreground">Last Updated:</dt>
                    <dd className="text-right">
                      {product.updatedAt ? new Date(product.updatedAt).toLocaleDateString() : "N/A"}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </div>
        </div>

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
        {product && (
          <DiscountManagementModal
            open={discountModalOpen}
            onOpenChange={setDiscountModalOpen}
            product={product}
            onSuccess={fetchProductDetails}
          />
        )}

        {/* Duplication Modal */}
        {product && (
          <DuplicationModal
            open={duplicationModalOpen}
            onOpenChange={setDuplicationModalOpen}
            product={product}
            onDuplicate={handleDuplicateProduct}
            onCancel={() => {}}
          />
        )}
      </div>
    </div>
  )
}
