"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Upload, X, AlertCircle, CheckCircle2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { fetchApi, updateProductWithFiles } from "@/lib/api"
import { FormattedTextarea } from "@/components/ui/formatted-textarea"
import { DescriptionPreview } from "@/components/ui/description-preview"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  formatPriceValue,
  formatPriceDisplay,
  calculateSellingPrice,
  calculateDiscountFromPrices,
  validatePriceInput,
} from "@/lib/price-utils"
import { DecimalInput } from "@/components/ui/decimal-input"
// Import the DiscountInput component
import { DiscountInput } from "@/components/ui/discount-input"

export default function EditProductPage({ params }) {
  const productId = params.id

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    stock: "",
    price: "",
    discount: "0", // Added discount field with default value of 0
    sellingPrice: "", // Added selling price field
    category: "",
    material: "",
    grade: "",
    gem: "",
    coating: "",
    size: "",
    images: [],
  })

  const [categories, setCategories] = useState([])
  const [materials, setMaterials] = useState([])
  const [grades, setGrades] = useState([])
  const [loading, setLoading] = useState(false)
  const [fetchingProduct, setFetchingProduct] = useState(true)
  const [imageFiles, setImageFiles] = useState([])
  const [imageUrls, setImageUrls] = useState([])
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({}) // Track which fields have been touched
  const [isSubmitAttempted, setIsSubmitAttempted] = useState(false) // Track if form submission has been attempted

  const router = useRouter()
  const { toast } = useToast()

  // Fetch product details and reference data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setFetchingProduct(true)

        // Fetch reference data first
        const [categoriesResponse, materialsResponse, gradesResponse] = await Promise.all([
          fetchApi("/api/v1/category/cat-list/"),
          fetchApi("/api/v1/material/mat-list/"),
          fetchApi("/api/v1/grade/gra-list/"),
        ])

        // Extract data from responses
        const categoriesData = categoriesResponse.success && categoriesResponse.data ? categoriesResponse.data : []
        const materialsData = materialsResponse.success && materialsResponse.data ? materialsResponse.data : []
        const gradesData = gradesResponse.success && gradesResponse.data ? gradesResponse.data : []

        // Set reference data
        setCategories(categoriesData)
        setMaterials(materialsData)
        setGrades(gradesData)

        console.log("Categories:", categoriesData)
        console.log("Materials:", materialsData)
        console.log("Grades:", gradesData)

        // Fetch product details
        const productResponse = await fetchApi(`/api/v1/product/list?productId=${productId}`)
        console.log("Product response:", productResponse)

        if (!productResponse.success || !productResponse.data || !productResponse.data.product) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Product not found",
          })
          router.push("/dashboard/products")
          return
        }

        const productData = productResponse.data.product

        // Find the category ID that matches the product's category name
        const categoryId = findIdByName(categoriesData, "name", productData.category)
        // Find the material ID that matches the product's material name
        const materialId = findIdByName(materialsData, "material", productData.material)
        // Find the grade ID that matches the product's grade name
        const gradeId = findIdByName(gradesData, "grade", productData.grade)

        console.log("Mapped IDs:", { categoryId, materialId, gradeId })

        // Use the correct fields from the API response
        const originalPrice = productData.originalPrice || productData.price || 0
        const sellingPrice = productData.price || 0
        const discountPercentage = productData.discountPercentage || 0

        // Set form data from product
        setFormData({
          name: productData.name || "",
          description: productData.description || "",
          stock: productData.stock?.toString() || "0",
          price: originalPrice.toString(),
          discount: discountPercentage.toString(),
          sellingPrice: sellingPrice.toString(),
          category: categoryId || "",
          material: materialId || "",
          grade: gradeId || "",
          gem: productData.gem || "",
          coating: productData.coating || "",
          size: productData.size || "",
          images: productData.images || [],
        })

        // Set image URLs properly
        if (productData.images && Array.isArray(productData.images) && productData.images.length > 0) {
          console.log("Setting image URLs:", productData.images)
          setImageUrls(productData.images)
        } else {
          console.log("No images found in product data")
          setImageUrls([])
        }
      } catch (error) {
        console.error("Error fetching product data:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load product data",
        })
      } finally {
        setFetchingProduct(false)
      }
    }

    fetchData()
  }, [productId, router, toast])

  // Helper function to find an ID by name in an array of objects
  const findIdByName = (array, nameKey, nameValue) => {
    if (!array || !Array.isArray(array) || !nameValue) return ""

    const item = array.find((item) => item[nameKey] === nameValue)
    return item ? item._id : ""
  }

  // Calculate discount percentage from original price and selling price
  // const calculateDiscountFromPrices = (originalPrice, sellingPrice) => {
  //   if (!originalPrice || !sellingPrice || originalPrice <= 0) return 0
  //   if (sellingPrice >= originalPrice) return 0

  //   const discountAmount = originalPrice - sellingPrice
  //   const discountPercentage = (discountAmount / originalPrice) * 100
  //   return Math.round(discountPercentage * 100) / 100 // Round to 2 decimal places
  // }

  // Calculate selling price based on price and discount (with precision handling)
  // const calculateSellingPrice = (price, discount) => {
  //   if (!price || isNaN(Number(price))) return ""
  //   const numPrice = Number.parseFloat(price)
  //   const numDiscount = Number.parseFloat(discount || "0")

  //   if (isNaN(numPrice) || isNaN(numDiscount)) return ""
  //   if (numPrice <= 0) return "0.00"

  //   // Ensure discount is between 0 and 100
  //   const validDiscount = Math.max(0, Math.min(100, numDiscount))

  //   // Calculate with precision
  //   const discountAmount = (numPrice * validDiscount) / 100
  //   const sellingPrice = numPrice - discountAmount

  //   // Return formatted to 2 decimal places
  //   return sellingPrice.toFixed(2)
  // }

  // Calculate discount percentage from original price and selling price (with precision handling)
  // const calculateDiscountFromSellingPrice = (originalPrice, sellingPrice) => {
  //   if (!originalPrice || !sellingPrice) return "0"

  //   const numOriginalPrice = Number.parseFloat(originalPrice)
  //   const numSellingPrice = Number.parseFloat(sellingPrice)

  //   if (isNaN(numOriginalPrice) || isNaN(numSellingPrice) || numOriginalPrice <= 0) return "0"

  //   // If selling price is higher than original, no discount
  //   if (numSellingPrice >= numOriginalPrice) return "0"

  //   // Calculate discount with precision
  //   const discountAmount = numOriginalPrice - numSellingPrice
  //   const discountPercentage = (discountAmount / numOriginalPrice) * 100

  //   // Return formatted to 2 decimal places
  //   return discountPercentage.toFixed(2)
  // }

  // Format price for display
  const formatPrice = (price) => {
    return formatPriceDisplay(price)
  }

  // Update selling price when price or discount changes
  useEffect(() => {
    if (formData.price && !isNaN(formData.price)) {
      const calculatedSellingPrice = calculateSellingPrice(formData.price, formData.discount)
      setFormData((prev) => ({
        ...prev,
        sellingPrice: calculatedSellingPrice,
      }))
    }
  }, [formData.price, formData.discount])

  const handleChange = (e) => {
    const { name, value } = e.target

    setFormData((prev) => {
      const updatedData = { ...prev, [name]: value }

      // Only update related fields if the current field is one of price, discount, or sellingPrice
      if (name === "price") {
        // When price changes, recalculate selling price based on current discount
        if (value && !isNaN(value)) {
          updatedData.sellingPrice = calculateSellingPrice(value, updatedData.discount)
        } else {
          // If price is invalid, reset selling price
          updatedData.sellingPrice = ""
        }
      } else if (name === "discount") {
        // When discount changes, recalculate selling price
        if (prev.price && value) {
          const numDiscount = Number.parseFloat(value)
          // Ensure discount is between 0 and 100
          if (!isNaN(numDiscount) && numDiscount >= 0 && numDiscount <= 100) {
            updatedData.sellingPrice = calculateSellingPrice(prev.price, value)
          }
        }
      } else if (name === "sellingPrice") {
        // When selling price changes, recalculate discount
        if (prev.price && value) {
          const numPrice = Number.parseFloat(prev.price)
          const numSellingPrice = Number.parseFloat(value)

          // Validate that selling price is not higher than original price
          if (!isNaN(numPrice) && !isNaN(numSellingPrice) && numSellingPrice <= numPrice) {
            updatedData.discount = calculateDiscountFromPrices(prev.price, value)
          } else if (numSellingPrice > numPrice) {
            // If selling price is higher than original, set discount to 0
            updatedData.discount = "0"
            updatedData.sellingPrice = formatPriceValue(prev.price)
          }
        }
      }

      return updatedData
    })

    // Mark field as touched
    setTouched((prev) => ({ ...prev, [name]: true }))

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }))
    }
  }

  const handleBlur = (e) => {
    const { name, value } = e.target

    // Mark field as touched
    setTouched((prev) => ({ ...prev, [name]: true }))

    // Validate the field
    validateField(name, value)
  }

  const validateField = (name, value) => {
    let fieldError = null

    switch (name) {
      case "name":
        if (!value.trim()) {
          fieldError = "Product name is required"
        }
        break
      case "description":
        if (!value.trim()) {
          fieldError = "Product description is required"
        }
        break
      case "price":
        fieldError = validatePriceInput(value, {
          required: true,
          min: 0.01,
          fieldName: "Original price",
        })
        break
      case "discount":
        if (value && (isNaN(value) || Number(value) < 0)) {
          fieldError = "Discount cannot be negative"
        } else if (value && Number(value) > 100) {
          fieldError = "Discount cannot exceed 100%"
        }
        break
      case "sellingPrice":
        fieldError = validatePriceInput(value, {
          min: 0.01,
          fieldName: "Selling price",
        })

        // Additional validation for selling price
        if (!fieldError && formData.price && Number.parseFloat(value) > Number.parseFloat(formData.price)) {
          fieldError = "Selling price cannot be higher than original price"
        }
        break
      case "stock":
        if (!value) {
          fieldError = "Stock is required"
        } else if (isNaN(value) || Number(value) < 0) {
          fieldError = "Stock must be a non-negative number"
        }
        break
      case "category":
        if (!value) {
          fieldError = "Category is required"
        }
        break
      case "material":
        if (!value) {
          fieldError = "Material is required"
        }
        break
      case "grade":
        if (!value) {
          fieldError = "Grade is required"
        }
        break
      default:
        break
    }

    setErrors((prev) => ({
      ...prev,
      [name]: fieldError,
    }))

    return !fieldError
  }

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Mark field as touched
    setTouched((prev) => ({ ...prev, [name]: true }))

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }))
    }
  }

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files)

    if (files.length > 0) {
      console.log("New files selected:", files.length)

      // Add to imageFiles (for upload)
      setImageFiles((prevFiles) => [...prevFiles, ...files])

      // Create preview URLs and add to imageUrls (for display)
      const newImageUrls = files.map((file) => URL.createObjectURL(file))
      setImageUrls((prevUrls) => [...prevUrls, ...newImageUrls])

      console.log("Updated imageUrls length:", imageUrls.length + newImageUrls.length)
    }
  }

  const removeImage = (index) => {
    // Remove from imageUrls (displayed images)
    setImageUrls((prev) => prev.filter((_, i) => i !== index))

    // Remove from imageFiles (newly added images)
    if (index < imageFiles.length) {
      setImageFiles((prev) => prev.filter((_, i) => i !== index))
    }

    // Remove from formData.images (existing images from API)
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }))

    console.log(`Removed image at index ${index}`)
  }

  const validateForm = () => {
    setIsSubmitAttempted(true)
    const newErrors = {}
    let isValid = true

    // Validate basic information fields
    const requiredFields = ["name", "description", "price", "stock", "category", "material", "grade"]

    for (const field of requiredFields) {
      const isFieldValid = validateField(field, formData[field])
      if (!isFieldValid) {
        isValid = false
      }
    }

    // Validate discount and selling price
    if (formData.discount) {
      const isDiscountValid = validateField("discount", formData.discount)
      if (!isDiscountValid) {
        isValid = false
      }
    }

    if (formData.sellingPrice) {
      const isSellingPriceValid = validateField("sellingPrice", formData.sellingPrice)
      if (!isSellingPriceValid) {
        isValid = false
      }
    }

    setErrors(newErrors)
    return isValid
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fix the errors in the form",
      })
      return
    }

    // Format the request data according to the API requirements
    const productData = {
      name: formData.name,
      description: formData.description,
      stock: formData.stock,
      category: formData.category,
      material: formData.material,
      grade: formData.grade,
      originalPrice: formatPriceValue(formData.price), // Format to ensure proper decimal places
      price: formatPriceValue(formData.sellingPrice), // Format to ensure proper decimal places
      discountPercentage: formData.discount || "0",
      gem: formData.gem || undefined,
      coating: formData.coating || undefined,
      size: formData.size || undefined,
    }

    console.log("Updating product with data:", productData)
    console.log("Existing images:", formData.images)
    console.log("New image files:", imageFiles)

    try {
      setLoading(true)

      // Update the product with the new data and any new images
      const result = await updateProductWithFiles(productId, productData, imageFiles)

      if (result.success) {
        toast({
          title: "Success",
          description: "Product updated successfully",
        })
        router.push("/dashboard/products")
      } else {
        throw new Error(result.message || "Failed to update product")
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update product: " + (error.message || "Unknown error"),
      })
    } finally {
      setLoading(false)
    }
  }

  // Helper function to determine input status for styling
  const getInputStatus = (fieldName) => {
    if (errors[fieldName]) return "error"
    if (touched[fieldName] && !errors[fieldName]) return "success"
    return "default"
  }

  // Helper function to render input status icon
  const renderInputStatusIcon = (status) => {
    if (status === "error") return <AlertCircle className="h-4 w-4 text-destructive" />
    if (status === "success") return <CheckCircle2 className="h-4 w-4 text-green-500" />
    return null
  }

  if (fetchingProduct) {
    return (
      <div>
        <Header title="Edit Product" />
        <div className="p-6 flex justify-center items-center h-[calc(100vh-4rem)]">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Header title="Edit Product" />
      <div className="p-6">
        <Button variant="outline" className="mb-6" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Products
        </Button>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Product Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className={errors.name ? "text-destructive" : ""}>
                    Product Name *
                  </Label>
                  <div className="relative">
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`${
                        errors.name
                          ? "border-destructive pr-10"
                          : touched.name && !errors.name
                            ? "border-green-500 pr-10"
                            : ""
                      }`}
                      aria-invalid={errors.name ? "true" : "false"}
                      aria-describedby={errors.name ? "name-error" : undefined}
                    />
                    {(touched.name || isSubmitAttempted) && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        {renderInputStatusIcon(getInputStatus("name"))}
                      </div>
                    )}
                  </div>
                  {errors.name && (
                    <p id="name-error" className="text-sm font-medium text-destructive flex items-center mt-1">
                      <AlertCircle className="h-3.5 w-3.5 mr-1" />
                      {errors.name}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className={errors.description ? "text-destructive" : ""}>
                    Description *
                  </Label>
                  <div className="relative">
                    <FormattedTextarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      rows={4}
                      placeholder="Describe your product. Use formatting tools for better presentation."
                      className={`${
                        errors.description
                          ? "border-destructive"
                          : touched.description && !errors.description
                            ? "border-green-500"
                            : ""
                      }`}
                      aria-invalid={errors.description ? "true" : "false"}
                      aria-describedby={errors.description ? "description-error" : undefined}
                    />
                  </div>
                  {errors.description && (
                    <p id="description-error" className="text-sm font-medium text-destructive flex items-center mt-1">
                      <AlertCircle className="h-3.5 w-3.5 mr-1" />
                      {errors.description}
                    </p>
                  )}
                  <DescriptionPreview description={formData.description} />
                </div>

                {/* Pricing Section */}
                <div className="pt-2">
                  <h3 className="text-sm font-medium mb-3">Pricing Information</h3>
                  <Separator className="mb-4" />

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <Label htmlFor="price" className={errors.price ? "text-destructive" : ""}>
                          Original Price (₹) *
                        </Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <AlertCircle className="h-3.5 w-3.5 ml-1 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              <p className="text-xs">Original price before any discounts</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <div className="relative">
                        <DecimalInput
                          id="price"
                          name="price"
                          value={formData.price}
                          onChange={(value) => {
                            setFormData((prev) => {
                              const updatedData = { ...prev, price: value }

                              // Recalculate selling price when price changes
                              if (value && !isNaN(Number.parseFloat(value))) {
                                updatedData.sellingPrice = calculateSellingPrice(value, updatedData.discount)
                              } else {
                                updatedData.sellingPrice = ""
                              }

                              return updatedData
                            })

                            // Mark field as touched
                            setTouched((prev) => ({ ...prev, price: true }))

                            // Clear error for this field
                            if (errors.price) {
                              setErrors((prev) => ({ ...prev, price: null }))
                            }
                          }}
                          onBlur={(e) => handleBlur(e)}
                          min={0}
                          decimalPlaces={2}
                          className={`${
                            errors.price
                              ? "border-destructive pr-10"
                              : touched.price && !errors.price
                                ? "border-green-500 pr-10"
                                : ""
                          }`}
                          aria-invalid={errors.price ? "true" : "false"}
                          aria-describedby={errors.price ? "price-error" : undefined}
                        />
                        {(touched.price || isSubmitAttempted) && (
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            {renderInputStatusIcon(getInputStatus("price"))}
                          </div>
                        )}
                      </div>
                      {errors.price && (
                        <p id="price-error" className="text-sm font-medium text-destructive flex items-center mt-1">
                          <AlertCircle className="h-3.5 w-3.5 mr-1" />
                          {errors.price}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Replace the discount input in the form */}
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <Label htmlFor="discount" className={errors.discount ? "text-destructive" : ""}>
                            Discount (%)
                          </Label>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <AlertCircle className="h-3.5 w-3.5 ml-1 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                <p className="text-xs">Percentage discount off the original price</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <div className="relative">
                          <DiscountInput
                            id="discount"
                            name="discount"
                            min={0}
                            max={99.999999}
                            value={formData.discount || "0"}
                            onChange={(value) => {
                              setFormData((prev) => {
                                const updatedData = { ...prev, discount: value }

                                // Recalculate selling price when discount changes
                                if (prev.price && value) {
                                  const numDiscount = Number.parseFloat(value)
                                  // Ensure discount is between 0 and 100
                                  if (!isNaN(numDiscount) && numDiscount >= 0 && numDiscount <= 100) {
                                    updatedData.sellingPrice = calculateSellingPrice(prev.price, value)
                                  }
                                }

                                return updatedData
                              })

                              // Mark field as touched
                              setTouched((prev) => ({ ...prev, discount: true }))

                              // Clear error for this field
                              if (errors.discount) {
                                setErrors((prev) => ({ ...prev, discount: null }))
                              }
                            }}
                            onBlur={(e) => handleBlur(e)}
                            className={`pr-6 ${
                              errors.discount
                                ? "border-destructive pr-10"
                                : touched.discount && !errors.discount
                                  ? "border-green-500 pr-10"
                                  : ""
                            }`}
                            aria-invalid={errors.discount ? "true" : "false"}
                            aria-describedby={errors.discount ? "discount-error" : undefined}
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                            %
                          </span>
                          {(touched.discount || isSubmitAttempted) && (
                            <div className="absolute inset-y-0 right-6 flex items-center pointer-events-none">
                              {renderInputStatusIcon(getInputStatus("discount"))}
                            </div>
                          )}
                        </div>
                        {errors.discount && (
                          <p
                            id="discount-error"
                            className="text-sm font-medium text-destructive flex items-center mt-1"
                          >
                            <AlertCircle className="h-3.5 w-3.5 mr-1" />
                            {errors.discount}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center">
                          <Label htmlFor="sellingPrice" className={errors.sellingPrice ? "text-destructive" : ""}>
                            Selling Price (₹)
                          </Label>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <AlertCircle className="h-3.5 w-3.5 ml-1 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                <p className="text-xs">Final price after discount is applied</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <div className="relative">
                          <DecimalInput
                            id="sellingPrice"
                            name="sellingPrice"
                            value={formData.sellingPrice}
                            onChange={(value) => {
                              setFormData((prev) => {
                                const updatedData = { ...prev, sellingPrice: value }

                                // Recalculate discount when selling price changes
                                if (prev.price && value) {
                                  const numPrice = Number.parseFloat(prev.price)
                                  const numSellingPrice = Number.parseFloat(value)

                                  // Validate that selling price is not higher than original price
                                  if (!isNaN(numPrice) && !isNaN(numSellingPrice) && numSellingPrice <= numPrice) {
                                    updatedData.discount = calculateDiscountFromPrices(prev.price, value)
                                  } else if (numSellingPrice > numPrice) {
                                    // If selling price is higher than original, set discount to 0
                                    updatedData.discount = "0"
                                    updatedData.sellingPrice = formatPriceValue(prev.price)
                                  }
                                }

                                return updatedData
                              })

                              // Mark field as touched
                              setTouched((prev) => ({ ...prev, sellingPrice: true }))

                              // Clear error for this field
                              if (errors.sellingPrice) {
                                setErrors((prev) => ({ ...prev, sellingPrice: null }))
                              }
                            }}
                            onBlur={(e) => handleBlur(e)}
                            min={0}
                            decimalPlaces={2}
                            className={`${
                              errors.sellingPrice
                                ? "border-destructive pr-10"
                                : touched.sellingPrice && !errors.sellingPrice
                                  ? "border-green-500 pr-10"
                                  : ""
                            }`}
                            aria-invalid={errors.sellingPrice ? "true" : "false"}
                            aria-describedby={errors.sellingPrice ? "sellingPrice-error" : undefined}
                          />
                          {(touched.sellingPrice || isSubmitAttempted) && (
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                              {renderInputStatusIcon(getInputStatus("sellingPrice"))}
                            </div>
                          )}
                        </div>
                        {errors.sellingPrice && (
                          <p
                            id="sellingPrice-error"
                            className="text-sm font-medium text-destructive flex items-center mt-1"
                          >
                            <AlertCircle className="h-3.5 w-3.5 mr-1" />
                            {errors.sellingPrice}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Price summary with visual indicator */}
                    {formData.price && (
                      <div className="mt-3 p-3 bg-muted/40 rounded-md">
                        <div className="flex flex-col space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Original Price:</span>
                            <span
                              className={`font-medium ${Number(formData.discount) > 0 ? "line-through text-muted-foreground" : ""}`}
                            >
                              {formatPrice(formData.price)}
                            </span>
                          </div>

                          {Number(formData.discount) > 0 && (
                            <>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Discount Applied:</span>
                                <Badge className="bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 font-medium">
                                  {formData.discount}% OFF
                                </Badge>
                              </div>

                              <div className="flex items-center justify-between pt-1 border-t border-border/50">
                                <span className="text-sm text-muted-foreground">Final Selling Price:</span>
                                <span className="font-medium text-green-600">{formatPrice(formData.sellingPrice)}</span>
                              </div>

                              <div className="text-xs text-muted-foreground mt-1">
                                Customers will see the original price crossed out with the discounted price.
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <Label htmlFor="stock" className={errors.stock ? "text-destructive" : ""}>
                    Stock *
                  </Label>
                  <div className="relative">
                    <Input
                      id="stock"
                      name="stock"
                      type="number"
                      min="0"
                      value={formData.stock}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`${
                        errors.stock
                          ? "border-destructive pr-10"
                          : touched.stock && !errors.stock
                            ? "border-green-500 pr-10"
                            : ""
                      }`}
                      aria-invalid={errors.stock ? "true" : "false"}
                      aria-describedby={errors.stock ? "stock-error" : undefined}
                    />
                    {(touched.stock || isSubmitAttempted) && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        {renderInputStatusIcon(getInputStatus("stock"))}
                      </div>
                    )}
                  </div>
                  {errors.stock && (
                    <p id="stock-error" className="text-sm font-medium text-destructive flex items-center mt-1">
                      <AlertCircle className="h-3.5 w-3.5 mr-1" />
                      {errors.stock}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Product Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="category" className={errors.category ? "text-destructive" : ""}>
                    Category *
                  </Label>
                  <div className="relative">
                    <Select
                      value={formData.category}
                      onValueChange={(value) => handleSelectChange("category", value)}
                      name="category"
                    >
                      <SelectTrigger
                        className={`${
                          errors.category
                            ? "border-destructive"
                            : touched.category && !errors.category
                              ? "border-green-500"
                              : ""
                        }`}
                        aria-invalid={errors.category ? "true" : "false"}
                        aria-describedby={errors.category ? "category-error" : undefined}
                      >
                        <SelectValue placeholder="Select category" />
                        {(touched.category || isSubmitAttempted) && (
                          <div className="absolute inset-y-0 right-8 flex items-center pointer-events-none">
                            {renderInputStatusIcon(getInputStatus("category"))}
                          </div>
                        )}
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category._id} value={category._id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {errors.category && (
                    <p id="category-error" className="text-sm font-medium text-destructive flex items-center mt-1">
                      <AlertCircle className="h-3.5 w-3.5 mr-1" />
                      {errors.category}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="material" className={errors.material ? "text-destructive" : ""}>
                    Material *
                  </Label>
                  <div className="relative">
                    <Select
                      value={formData.material}
                      onValueChange={(value) => handleSelectChange("material", value)}
                      name="material"
                    >
                      <SelectTrigger
                        className={`${
                          errors.material
                            ? "border-destructive"
                            : touched.material && !errors.material
                              ? "border-green-500"
                              : ""
                        }`}
                        aria-invalid={errors.material ? "true" : "false"}
                        aria-describedby={errors.material ? "material-error" : undefined}
                      >
                        <SelectValue placeholder="Select material" />
                        {(touched.material || isSubmitAttempted) && (
                          <div className="absolute inset-y-0 right-8 flex items-center pointer-events-none">
                            {renderInputStatusIcon(getInputStatus("material"))}
                          </div>
                        )}
                      </SelectTrigger>
                      <SelectContent>
                        {materials.map((material) => (
                          <SelectItem key={material._id} value={material._id}>
                            {material.material}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {errors.material && (
                    <p id="material-error" className="text-sm font-medium text-destructive flex items-center mt-1">
                      <AlertCircle className="h-3.5 w-3.5 mr-1" />
                      {errors.material}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="grade" className={errors.grade ? "text-destructive" : ""}>
                    Grade *
                  </Label>
                  <div className="relative">
                    <Select
                      value={formData.grade}
                      onValueChange={(value) => handleSelectChange("grade", value)}
                      name="grade"
                    >
                      <SelectTrigger
                        className={`${
                          errors.grade ? "border-destructive" : touched.grade && !errors.grade ? "border-green-500" : ""
                        }`}
                        aria-invalid={errors.grade ? "true" : "false"}
                        aria-describedby={errors.grade ? "grade-error" : undefined}
                      >
                        <SelectValue placeholder="Select grade" />
                        {(touched.grade || isSubmitAttempted) && (
                          <div className="absolute inset-y-0 right-8 flex items-center pointer-events-none">
                            {renderInputStatusIcon(getInputStatus("grade"))}
                          </div>
                        )}
                      </SelectTrigger>
                      <SelectContent>
                        {grades.map((grade) => (
                          <SelectItem key={grade._id} value={grade._id}>
                            {grade.grade}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {errors.grade && (
                    <p id="grade-error" className="text-sm font-medium text-destructive flex items-center mt-1">
                      <AlertCircle className="h-3.5 w-3.5 mr-1" />
                      {errors.grade}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Additional Attributes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="gem">Gem Type</Label>
                  <Input
                    id="gem"
                    name="gem"
                    value={formData.gem}
                    onChange={handleChange}
                    placeholder="e.g., Diamond, Ruby, etc."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="coating">Coating</Label>
                  <Input
                    id="coating"
                    name="coating"
                    value={formData.coating}
                    onChange={handleChange}
                    placeholder="e.g., Gold, Silver, etc."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="size">Size</Label>
                  <Input
                    id="size"
                    name="size"
                    value={formData.size}
                    onChange={handleChange}
                    placeholder="e.g., S, M, L, XL, etc."
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Product Images</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  {imageUrls.map((url, index) => (
                    <div key={index} className="relative aspect-square border rounded-md overflow-hidden">
                      <img
                        src={url || "/placeholder.svg"}
                        alt={`Product preview ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.error("Image failed to load:", url)
                          e.currentTarget.src = `/placeholder.svg?height=200&width=200&query=${encodeURIComponent(formData.name || "product")}`
                        }}
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6"
                        onClick={() => removeImage(index)}
                        type="button"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}

                  <label className="flex flex-col items-center justify-center aspect-square border border-dashed rounded-md cursor-pointer hover:bg-gray-50">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-xs text-gray-500">Upload Image</p>
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} multiple />
                  </label>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button type="submit" className="bg-[#28acc1] hover:bg-[#1e8a9a]" disabled={loading}>
                  {loading ? "Updating..." : "Update Product"}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </form>
      </div>
    </div>
  )
}
