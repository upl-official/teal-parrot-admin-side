"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Upload, X, Plus, Trash2, AlertCircle, ArrowRight, CheckCircle2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { fetchApi, uploadFiles } from "@/lib/api"
import { FormattedTextarea } from "@/components/ui/formatted-textarea"
import { DescriptionPreview } from "@/components/ui/description-preview"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"

export default function AddProductPage() {
  const [formData, setFormData] = useState({
    name: "",
    description: "", // This is required by the API
    stock: "",
    price: "",
    discount: "0", // Add discount field with default value of 0
    sellingPrice: "", // Add selling price field
    category: "",
    material: "",
    grade: "",
    gem: "",
    coating: "",
    size: "",
  })

  const [categories, setCategories] = useState([])
  const [materials, setMaterials] = useState([])
  const [grades, setGrades] = useState([])
  const [loading, setLoading] = useState(false)
  const [imageFiles, setImageFiles] = useState([])
  const [imageUrls, setImageUrls] = useState([])
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState("")
  const [touched, setTouched] = useState({}) // Track which fields have been touched
  const [isSubmitAttempted, setIsSubmitAttempted] = useState(false) // Track if form submission has been attempted

  // Size variations state
  const [hasSizeVariations, setHasSizeVariations] = useState(false)
  const [sizeVariations, setSizeVariations] = useState([
    { size: "", stock: "", price: "", discount: "0", sellingPrice: "" },
  ])
  const [samePriceForAll, setSamePriceForAll] = useState(true)
  const [sameStockForAll, setSameStockForAll] = useState(true)
  const [sameDiscountForAll, setSameDiscountForAll] = useState(true)
  const [activeTab, setActiveTab] = useState("basic")

  // Refs for scrolling to errors
  const nameRef = useRef(null)
  const descriptionRef = useRef(null)
  const priceRef = useRef(null)
  const stockRef = useRef(null)
  const categoryRef = useRef(null)
  const materialRef = useRef(null)
  const gradeRef = useRef(null)
  const imagesRef = useRef(null)

  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    fetchCategories()
    fetchMaterials()
    fetchGrades()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetchApi("/api/v1/category/cat-list/")
      if (response.success && response.data) {
        setCategories(response.data)
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch categories",
        })
        setCategories([])
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch categories",
      })
      setCategories([])
    }
  }

  const fetchMaterials = async () => {
    try {
      const response = await fetchApi("/api/v1/material/mat-list/")
      if (response.success && response.data) {
        setMaterials(response.data)
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch materials",
        })
        setMaterials([])
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch materials",
      })
      setMaterials([])
    }
  }

  const fetchGrades = async () => {
    try {
      const response = await fetchApi("/api/v1/grade/gra-list/")
      if (response.success && response.data) {
        setGrades(response.data)
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch grades",
        })
        setGrades([])
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch grades",
      })
      setGrades([])
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => {
      const updatedData = { ...prev, [name]: value }

      // If price or discount changes, update selling price
      if (name === "price" || name === "discount") {
        if (updatedData.price && !isNaN(updatedData.price)) {
          updatedData.sellingPrice = calculateSellingPrice(updatedData.price, updatedData.discount)
        }
      }

      // If selling price changes, update discount
      if (name === "sellingPrice") {
        if (updatedData.price && value && !isNaN(updatedData.price) && !isNaN(value)) {
          updatedData.discount = calculateDiscountFromSellingPrice(updatedData.price, value)
        }
      }

      return updatedData
    })

    // Mark field as touched
    setTouched((prev) => ({ ...prev, [name]: true }))

    // Validate the field if it's been touched or form submission has been attempted
    if (touched[name] || isSubmitAttempted) {
      validateField(name, value)
    }

    // Clear API error when user makes changes
    if (apiError) {
      setApiError("")
    }
  }

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Mark field as touched
    setTouched((prev) => ({ ...prev, [name]: true }))

    // Validate the field if it's been touched or form submission has been attempted
    if (touched[name] || isSubmitAttempted) {
      validateField(name, value)
    }

    // Clear API error when user makes changes
    if (apiError) {
      setApiError("")
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
        if (!value) {
          fieldError = "Price is required"
        } else if (isNaN(value) || Number(value) <= 0) {
          fieldError = "Price must be a positive number"
        }
        break
      case "discount":
        if (value && (isNaN(value) || Number(value) < 0 || Number(value) > 100)) {
          fieldError = "Discount must be between 0 and 100"
        }
        break
      case "sellingPrice":
        if (value) {
          if (isNaN(value) || Number(value) <= 0) {
            fieldError = "Selling price must be a positive number"
          } else if (formData.price && Number(value) > Number(formData.price)) {
            fieldError = "Selling price cannot be higher than original price"
          }
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

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files)

    if (files.length > 0) {
      setImageFiles((prevFiles) => [...prevFiles, ...files])

      // Create preview URLs
      const newImageUrls = files.map((file) => URL.createObjectURL(file))
      setImageUrls((prevUrls) => [...prevUrls, ...newImageUrls])

      // Clear image error if images are added
      if (errors.images) {
        setErrors((prev) => ({ ...prev, images: null }))
      }
    }
  }

  const removeImage = (index) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index))
    setImageFiles((prev) => prev.filter((_, i) => i !== index))

    // Validate images after removal
    if (isSubmitAttempted) {
      const remainingImages = imageFiles.filter((_, i) => i !== index)
      if (remainingImages.length === 0) {
        setErrors((prev) => ({ ...prev, images: "At least one product image is required" }))
      }
    }
  }

  // Size variation handlers
  const addSizeVariation = () => {
    setSizeVariations([
      ...sizeVariations,
      {
        size: "",
        stock: sameStockForAll ? formData.stock : "",
        price: samePriceForAll ? formData.price : "",
        discount: sameDiscountForAll ? formData.discount : "0",
        sellingPrice: samePriceForAll ? formData.sellingPrice : "",
      },
    ])
  }

  const removeSizeVariation = (index) => {
    if (sizeVariations.length > 1) {
      setSizeVariations(sizeVariations.filter((_, i) => i !== index))

      // Update size variation errors after removal
      if (errors.sizeVariations) {
        const newSizeErrors = [...errors.sizeVariations]
        newSizeErrors.splice(index, 1)
        setErrors((prev) => ({ ...prev, sizeVariations: newSizeErrors }))
      }
    }
  }

  const handleSizeVariationChange = (index, field, value) => {
    const updatedVariations = [...sizeVariations]
    updatedVariations[index] = { ...updatedVariations[index], [field]: value }

    // If price or discount changes, update selling price
    if (field === "price" || field === "discount") {
      const price = field === "price" ? value : updatedVariations[index].price
      const discount = field === "discount" ? value : updatedVariations[index].discount

      if (price && !isNaN(price)) {
        const calculatedSellingPrice = calculateSellingPrice(price, discount)
        updatedVariations[index].sellingPrice = calculatedSellingPrice
      }
    }

    // If selling price changes, update discount
    if (field === "sellingPrice") {
      const price = updatedVariations[index].price

      if (price && value && !isNaN(price) && !isNaN(value)) {
        const calculatedDiscount = calculateDiscountFromSellingPrice(price, value)
        updatedVariations[index].discount = calculatedDiscount
      }
    }

    setSizeVariations(updatedVariations)

    // Validate the size variation field if form submission has been attempted
    if (isSubmitAttempted) {
      validateSizeVariationField(index, field, value)
    }
  }

  const validateSizeVariationField = (index, field, value) => {
    let fieldError = null

    switch (field) {
      case "size":
        if (!value.trim()) {
          fieldError = "Size is required"
        } else {
          // Check for duplicate sizes
          const sizeCount = sizeVariations.filter((v) => v.size === value).length
          if (sizeCount > 1) {
            fieldError = "Duplicate size"
          }
        }
        break
      case "price":
        if (!samePriceForAll) {
          if (!value) {
            fieldError = "Price is required"
          } else if (isNaN(value) || Number(value) <= 0) {
            fieldError = "Price must be a positive number"
          }
        }
        break
      case "stock":
        if (!sameStockForAll) {
          if (!value) {
            fieldError = "Stock is required"
          } else if (isNaN(value) || Number(value) < 0) {
            fieldError = "Stock must be a non-negative number"
          }
        }
        break
      case "discount":
        if (!sameDiscountForAll) {
          if (value && (isNaN(value) || Number(value) < 0 || Number(value) > 100)) {
            fieldError = "Discount must be between 0 and 100"
          }
        }
        break
      case "sellingPrice":
        if (value) {
          if (isNaN(value) || Number(value) <= 0) {
            fieldError = "Selling price must be a positive number"
          } else {
            const price = sizeVariations[index].price
            if (price && Number(value) > Number(price)) {
              fieldError = "Selling price cannot be higher than original price"
            }
          }
        }
        break
      default:
        break
    }

    // Update the errors for this specific size variation field
    setErrors((prev) => {
      const newErrors = { ...prev }
      if (!newErrors.sizeVariations) {
        newErrors.sizeVariations = []
      }
      if (!newErrors.sizeVariations[index]) {
        newErrors.sizeVariations[index] = {}
      }
      newErrors.sizeVariations[index] = {
        ...newErrors.sizeVariations[index],
        [field]: fieldError,
      }
      return newErrors
    })

    return !fieldError
  }

  const handleSamePriceChange = (checked) => {
    setSamePriceForAll(checked)
    if (checked) {
      // Update all size variations to use the main price
      setSizeVariations(
        sizeVariations.map((variation) => {
          const updatedVariation = {
            ...variation,
            price: formData.price,
          }

          // Also update selling price based on the new price and current discount
          if (formData.price) {
            updatedVariation.sellingPrice = calculateSellingPrice(formData.price, variation.discount)
          }

          return updatedVariation
        }),
      )

      // Clear price errors for all size variations if using same price for all
      if (errors.sizeVariations) {
        const newSizeErrors = errors.sizeVariations.map((variationErrors) => {
          if (variationErrors) {
            const { price, ...rest } = variationErrors
            return rest
          }
          return variationErrors
        })
        setErrors((prev) => ({ ...prev, sizeVariations: newSizeErrors }))
      }
    }
  }

  const handleSameStockChange = (checked) => {
    setSameStockForAll(checked)
    if (checked) {
      // Update all size variations to use the main stock
      setSizeVariations(
        sizeVariations.map((variation) => ({
          ...variation,
          stock: formData.stock,
        })),
      )

      // Clear stock errors for all size variations if using same stock for all
      if (errors.sizeVariations) {
        const newSizeErrors = errors.sizeVariations.map((variationErrors) => {
          if (variationErrors) {
            const { stock, ...rest } = variationErrors
            return rest
          }
          return variationErrors
        })
        setErrors((prev) => ({ ...prev, sizeVariations: newSizeErrors }))
      }
    }
  }

  const handleSameDiscountChange = (checked) => {
    setSameDiscountForAll(checked)
    if (checked) {
      // Update all size variations to use the main discount
      setSizeVariations(
        sizeVariations.map((variation) => {
          const updatedVariation = {
            ...variation,
            discount: formData.discount,
          }

          // Also update selling price based on current price and the new discount
          if (variation.price) {
            updatedVariation.sellingPrice = calculateSellingPrice(variation.price, formData.discount)
          }

          return updatedVariation
        }),
      )

      // Clear discount and selling price errors for all size variations if using same discount for all
      if (errors.sizeVariations) {
        const newSizeErrors = errors.sizeVariations.map((variationErrors) => {
          if (variationErrors) {
            const { discount, sellingPrice, ...rest } = variationErrors
            return rest
          }
          return variationErrors
        })
        setErrors((prev) => ({ ...prev, sizeVariations: newSizeErrors }))
      }
    }
  }

  // Update size variations when main price, stock, or discount changes
  useEffect(() => {
    if (samePriceForAll) {
      setSizeVariations(
        sizeVariations.map((variation) => {
          const updatedVariation = {
            ...variation,
            price: formData.price,
          }

          // Also update selling price based on the new price and current discount
          if (formData.price) {
            updatedVariation.sellingPrice = calculateSellingPrice(formData.price, variation.discount)
          }

          return updatedVariation
        }),
      )
    }
  }, [formData.price, samePriceForAll])

  useEffect(() => {
    if (sameStockForAll) {
      setSizeVariations(
        sizeVariations.map((variation) => ({
          ...variation,
          stock: formData.stock,
        })),
      )
    }
  }, [formData.stock, sameStockForAll])

  useEffect(() => {
    if (sameDiscountForAll) {
      setSizeVariations(
        sizeVariations.map((variation) => {
          const updatedVariation = {
            ...variation,
            discount: formData.discount,
          }

          // Also update selling price based on current price and the new discount
          if (variation.price) {
            updatedVariation.sellingPrice = calculateSellingPrice(variation.price, formData.discount)
          }

          return updatedVariation
        }),
      )
    }
  }, [formData.discount, sameDiscountForAll])

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

    // Validate size variations if enabled
    if (hasSizeVariations) {
      const sizeErrors = []
      let hasSizeErrors = false
      const sizeValues = new Set()

      sizeVariations.forEach((variation, index) => {
        // Validate size
        const isSizeValid = validateSizeVariationField(index, "size", variation.size)
        if (!isSizeValid) {
          hasSizeErrors = true
        } else {
          sizeValues.add(variation.size)
        }

        // Validate price if not using same price for all
        if (!samePriceForAll) {
          const isPriceValid = validateSizeVariationField(index, "price", variation.price)
          if (!isPriceValid) {
            hasSizeErrors = true
          }
        }

        // Validate stock if not using same stock for all
        if (!sameStockForAll) {
          const isStockValid = validateSizeVariationField(index, "stock", variation.stock)
          if (!isStockValid) {
            hasSizeErrors = true
          }
        }

        // Validate discount if not using same discount for all
        if (!sameDiscountForAll) {
          const isDiscountValid = validateSizeVariationField(index, "discount", variation.discount)
          if (!isDiscountValid) {
            hasSizeErrors = true
          }
        }

        // Validate selling price
        if (variation.sellingPrice) {
          const isSellingPriceValid = validateSizeVariationField(index, "sellingPrice", variation.sellingPrice)
          if (!isSellingPriceValid) {
            hasSizeErrors = true
          }
        }
      })

      if (hasSizeErrors) {
        isValid = false
      }
    }

    // Validate images
    if (imageFiles.length === 0) {
      setErrors((prev) => ({ ...prev, images: "At least one product image is required" }))
      isValid = false
    } else {
      setErrors((prev) => ({ ...prev, images: null }))
    }

    return isValid
  }

  const scrollToFirstError = () => {
    // Define the order of fields to check
    const fieldOrder = [
      { name: "name", ref: nameRef },
      { name: "description", ref: descriptionRef },
      { name: "price", ref: priceRef },
      { name: "stock", ref: stockRef },
      { name: "category", ref: categoryRef },
      { name: "material", ref: materialRef },
      { name: "grade", ref: gradeRef },
      { name: "images", ref: imagesRef },
    ]

    // Find the first field with an error
    for (const field of fieldOrder) {
      if (errors[field.name] && field.ref.current) {
        // Switch to the appropriate tab first
        if (field.name === "images") {
          setActiveTab("images")
        } else if (field.name === "size" && hasSizeVariations) {
          setActiveTab("variations")
        } else {
          setActiveTab("basic")
        }

        // Scroll to the field with error
        setTimeout(() => {
          field.ref.current.scrollIntoView({ behavior: "smooth", block: "center" })
        }, 100)

        return
      }
    }

    // If there are size variation errors, switch to variations tab
    if (errors.sizeVariations && hasSizeVariations) {
      setActiveTab("variations")
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Clear any previous API errors
    setApiError("")

    if (!validateForm()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fix the errors in the form",
      })

      // Scroll to the first error
      scrollToFirstError()

      return
    }

    try {
      setLoading(true)

      if (hasSizeVariations) {
        // Create multiple products, one for each size variation
        const results = []
        let hasErrors = false

        for (let i = 0; i < sizeVariations.length; i++) {
          const variation = sizeVariations[i]

          // Prepare the data for the API request
          const productData = {
            name: formData.name,
            description: formData.description, // Ensure description is included
            stock: sameStockForAll ? formData.stock : variation.stock,
            category: formData.category,
            material: formData.material,
            grade: formData.grade,
            price: samePriceForAll ? formData.price : variation.price,
            gem: formData.gem || undefined,
            coating: formData.coating || undefined,
            size: variation.size,
            discount: sameDiscountForAll ? formData.discount : variation.discount || "0",
          }

          try {
            // For the first product, upload with images
            if (i === 0) {
              const result = await uploadFiles(imageFiles, productData)
              if (result.success) {
                results.push(result)
              } else {
                throw new Error(result.message || "Failed to add product")
              }
            } else {
              // For subsequent products, use the same images (reference by URL)
              // This would require backend support for image referencing
              // For now, we'll upload the same images again
              const result = await uploadFiles(imageFiles, productData)
              if (result.success) {
                results.push(result)
              } else {
                throw new Error(result.message || "Failed to add product")
              }
            }
          } catch (error) {
            hasErrors = true
            toast({
              variant: "destructive",
              title: `Error adding size ${variation.size}`,
              description: error.message || "Unknown error",
            })

            // Set API error for display
            setApiError(error.message || "Unknown error occurred while adding product")
          }
        }

        if (hasErrors) {
          toast({
            variant: "destructive",
            title: "Some products failed to add",
            description: "Check the errors for details",
          })
        } else {
          toast({
            title: "Success",
            description: `Added ${sizeVariations.length} product variations`,
          })
          router.push("/dashboard/products")
        }
      } else {
        // Single product creation (original flow)
        const productData = {
          name: formData.name,
          description: formData.description, // Ensure description is included
          stock: formData.stock,
          category: formData.category,
          material: formData.material,
          grade: formData.grade,
          price: formData.price,
          gem: formData.gem || undefined,
          coating: formData.coating || undefined,
          size: formData.size || undefined,
          discount: formData.discount || "0", // Include discount in the product data
        }

        const result = await uploadFiles(imageFiles, productData)

        if (result.success) {
          toast({
            title: "Success",
            description: "Product added successfully",
          })
          router.push("/dashboard/products")
        } else {
          throw new Error(result.message || "Failed to add product")
        }
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add product: " + (error.message || "Unknown error"),
      })

      // Set API error for display
      setApiError(error.message || "Unknown error occurred while adding product")
    } finally {
      setLoading(false)
    }
  }

  // Calculate selling price based on price and discount
  const calculateSellingPrice = (price, discount) => {
    if (!price) return ""
    const numPrice = Number.parseFloat(price)
    const numDiscount = Number.parseFloat(discount || "0")
    if (isNaN(numPrice) || isNaN(numDiscount)) return ""

    // Ensure discount is between 0 and 100
    const validDiscount = Math.max(0, Math.min(100, numDiscount))

    return (numPrice - (numPrice * validDiscount) / 100).toFixed(2)
  }

  // Calculate discount percentage from original price and selling price
  const calculateDiscountFromSellingPrice = (originalPrice, sellingPrice) => {
    if (!originalPrice || !sellingPrice) return "0"
    const numOriginalPrice = Number.parseFloat(originalPrice)
    const numSellingPrice = Number.parseFloat(sellingPrice)

    if (isNaN(numOriginalPrice) || isNaN(numSellingPrice) || numOriginalPrice <= 0) return "0"

    // If selling price is higher than original, no discount
    if (numSellingPrice >= numOriginalPrice) return "0"

    const discountPercentage = ((numOriginalPrice - numSellingPrice) / numOriginalPrice) * 100
    return discountPercentage.toFixed(2)
  }

  // Format price for display
  const formatPrice = (price) => {
    if (!price || isNaN(price)) return "₹0"
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price)
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

  return (
    <div>
      <Header title="Add Product" />
      <div className="p-6">
        <Button variant="outline" className="mb-6" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Products
        </Button>

        {apiError && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{apiError}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="basic" className="relative">
              Basic Information
              {isSubmitAttempted &&
                (errors.name ||
                  errors.description ||
                  errors.price ||
                  errors.stock ||
                  errors.category ||
                  errors.material ||
                  errors.grade ||
                  errors.discount ||
                  errors.sellingPrice) && (
                  <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-destructive"></span>
                )}
            </TabsTrigger>
            <TabsTrigger value="variations" className="relative">
              Size Variations
              {isSubmitAttempted && hasSizeVariations && errors.sizeVariations && (
                <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-destructive"></span>
              )}
            </TabsTrigger>
            <TabsTrigger value="images" className="relative">
              Images
              {isSubmitAttempted && errors.images && (
                <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-destructive"></span>
              )}
            </TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} noValidate>
            <TabsContent value="basic" className="mt-0">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Product Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2" ref={nameRef}>
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

                    <div className="space-y-2" ref={descriptionRef}>
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
                        <p
                          id="description-error"
                          className="text-sm font-medium text-destructive flex items-center mt-1"
                        >
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
                        <div className="space-y-2" ref={priceRef}>
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
                            <Input
                              id="price"
                              name="price"
                              type="number"
                              min="0"
                              step="0.01"
                              value={formData.price}
                              onChange={handleChange}
                              onBlur={handleBlur}
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
                              <Input
                                id="discount"
                                name="discount"
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                value={formData.discount || "0"}
                                onChange={handleChange}
                                onBlur={handleBlur}
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
                              <Input
                                id="sellingPrice"
                                name="sellingPrice"
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.sellingPrice}
                                onChange={handleChange}
                                onBlur={handleBlur}
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
                          <div className="mt-2 p-3 bg-muted/40 rounded-md">
                            <div className="flex items-center text-sm">
                              <span
                                className={
                                  Number(formData.discount) > 0 ? "line-through text-muted-foreground" : "font-medium"
                                }
                              >
                                {formatPrice(formData.price)}
                              </span>

                              {Number(formData.discount) > 0 && (
                                <>
                                  <ArrowRight className="h-3.5 w-3.5 mx-2 text-muted-foreground" />
                                  <span className="font-medium text-green-600">
                                    {formatPrice(formData.sellingPrice)}
                                  </span>
                                  <Badge className="ml-2 bg-orange-500/10 text-orange-600 hover:bg-orange-500/20">
                                    {formData.discount}% OFF
                                  </Badge>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 pt-2" ref={stockRef}>
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
                    <div className="space-y-2" ref={categoryRef}>
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

                    <div className="space-y-2" ref={materialRef}>
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

                    <div className="space-y-2" ref={gradeRef}>
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
                              errors.grade
                                ? "border-destructive"
                                : touched.grade && !errors.grade
                                  ? "border-green-500"
                                  : ""
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
                        disabled={hasSizeVariations}
                      />
                      {hasSizeVariations && (
                        <p className="text-xs text-muted-foreground">Size is managed in the Size Variations tab</p>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 pt-4">
                      <Checkbox
                        id="hasSizeVariations"
                        checked={hasSizeVariations}
                        onCheckedChange={setHasSizeVariations}
                      />
                      <Label htmlFor="hasSizeVariations" className="font-medium cursor-pointer">
                        This product has multiple size variations
                      </Label>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="variations" className="mt-0">
              {hasSizeVariations ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Size Variations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="samePriceForAll"
                            checked={samePriceForAll}
                            onCheckedChange={handleSamePriceChange}
                          />
                          <Label htmlFor="samePriceForAll" className="cursor-pointer">
                            Same price for all sizes
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="sameStockForAll"
                            checked={sameStockForAll}
                            onCheckedChange={handleSameStockChange}
                          />
                          <Label htmlFor="sameStockForAll" className="cursor-pointer">
                            Same stock for all sizes
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="sameDiscountForAll"
                            checked={sameDiscountForAll}
                            onCheckedChange={handleSameDiscountChange}
                          />
                          <Label htmlFor="sameDiscountForAll" className="cursor-pointer">
                            Same discount for all sizes
                          </Label>
                        </div>
                      </div>

                      <ScrollArea className="h-[400px] pr-4">
                        {sizeVariations.map((variation, index) => (
                          <div key={index} className="mb-6 p-4 border rounded-md relative">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute top-2 right-2 h-8 w-8"
                              onClick={() => removeSizeVariation(index)}
                              disabled={sizeVariations.length <= 1}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div className="space-y-2">
                                <Label
                                  htmlFor={`size-${index}`}
                                  className={errors.sizeVariations?.[index]?.size ? "text-destructive" : ""}
                                >
                                  Size *
                                </Label>
                                <div className="relative">
                                  <Input
                                    id={`size-${index}`}
                                    value={variation.size}
                                    onChange={(e) => handleSizeVariationChange(index, "size", e.target.value)}
                                    onBlur={(e) => validateSizeVariationField(index, "size", e.target.value)}
                                    placeholder="e.g., S, M, L, XL"
                                    className={`${errors.sizeVariations?.[index]?.size ? "border-destructive pr-10" : ""}`}
                                    aria-invalid={errors.sizeVariations?.[index]?.size ? "true" : "false"}
                                  />
                                  {isSubmitAttempted && (
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                      {errors.sizeVariations?.[index]?.size ? (
                                        <AlertCircle className="h-4 w-4 text-destructive" />
                                      ) : variation.size ? (
                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                      ) : null}
                                    </div>
                                  )}
                                </div>
                                {errors.sizeVariations?.[index]?.size && (
                                  <p className="text-sm font-medium text-destructive flex items-center mt-1">
                                    <AlertCircle className="h-3.5 w-3.5 mr-1" />
                                    {errors.sizeVariations[index].size}
                                  </p>
                                )}
                              </div>

                              <div className="space-y-2">
                                <Label
                                  htmlFor={`stock-${index}`}
                                  className={errors.sizeVariations?.[index]?.stock ? "text-destructive" : ""}
                                >
                                  Stock *
                                </Label>
                                <div className="relative">
                                  <Input
                                    id={`stock-${index}`}
                                    type="number"
                                    min="0"
                                    value={variation.stock}
                                    onChange={(e) => handleSizeVariationChange(index, "stock", e.target.value)}
                                    onBlur={(e) => validateSizeVariationField(index, "stock", e.target.value)}
                                    disabled={sameStockForAll}
                                    className={`${errors.sizeVariations?.[index]?.stock ? "border-destructive pr-10" : ""}`}
                                    aria-invalid={errors.sizeVariations?.[index]?.stock ? "true" : "false"}
                                  />
                                  {isSubmitAttempted && !sameStockForAll && (
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                      {errors.sizeVariations?.[index]?.stock ? (
                                        <AlertCircle className="h-4 w-4 text-destructive" />
                                      ) : variation.stock ? (
                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                      ) : null}
                                    </div>
                                  )}
                                </div>
                                {errors.sizeVariations?.[index]?.stock && (
                                  <p className="text-sm font-medium text-destructive flex items-center mt-1">
                                    <AlertCircle className="h-3.5 w-3.5 mr-1" />
                                    {errors.sizeVariations[index].stock}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="space-y-2">
                                <div className="flex items-center">
                                  <Label
                                    htmlFor={`price-${index}`}
                                    className={errors.sizeVariations?.[index]?.price ? "text-destructive" : ""}
                                  >
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
                                  <Input
                                    id={`price-${index}`}
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={variation.price}
                                    onChange={(e) => handleSizeVariationChange(index, "price", e.target.value)}
                                    onBlur={(e) => validateSizeVariationField(index, "price", e.target.value)}
                                    disabled={samePriceForAll}
                                    className={`${errors.sizeVariations?.[index]?.price ? "border-destructive pr-10" : ""}`}
                                    aria-invalid={errors.sizeVariations?.[index]?.price ? "true" : "false"}
                                  />
                                  {isSubmitAttempted && !samePriceForAll && (
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                      {errors.sizeVariations?.[index]?.price ? (
                                        <AlertCircle className="h-4 w-4 text-destructive" />
                                      ) : variation.price ? (
                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                      ) : null}
                                    </div>
                                  )}
                                </div>
                                {errors.sizeVariations?.[index]?.price && (
                                  <p className="text-sm font-medium text-destructive flex items-center mt-1">
                                    <AlertCircle className="h-3.5 w-3.5 mr-1" />
                                    {errors.sizeVariations[index].price}
                                  </p>
                                )}
                              </div>

                              <div className="space-y-2">
                                <div className="flex items-center">
                                  <Label
                                    htmlFor={`discount-${index}`}
                                    className={errors.sizeVariations?.[index]?.discount ? "text-destructive" : ""}
                                  >
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
                                  <Input
                                    id={`discount-${index}`}
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    value={variation.discount || "0"}
                                    onChange={(e) => handleSizeVariationChange(index, "discount", e.target.value)}
                                    onBlur={(e) => validateSizeVariationField(index, "discount", e.target.value)}
                                    disabled={sameDiscountForAll}
                                    className={`pr-6 ${errors.sizeVariations?.[index]?.discount ? "border-destructive pr-10" : ""}`}
                                  />
                                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                                    %
                                  </span>
                                  {isSubmitAttempted && !sameDiscountForAll && (
                                    <div className="absolute inset-y-0 right-6 flex items-center pointer-events-none">
                                      {errors.sizeVariations?.[index]?.discount ? (
                                        <AlertCircle className="h-4 w-4 text-destructive" />
                                      ) : (
                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                      )}
                                    </div>
                                  )}
                                </div>
                                {errors.sizeVariations?.[index]?.discount && (
                                  <p className="text-sm font-medium text-destructive flex items-center mt-1">
                                    <AlertCircle className="h-3.5 w-3.5 mr-1" />
                                    {errors.sizeVariations[index].discount}
                                  </p>
                                )}
                              </div>

                              <div className="space-y-2">
                                <div className="flex items-center">
                                  <Label
                                    htmlFor={`sellingPrice-${index}`}
                                    className={errors.sizeVariations?.[index]?.sellingPrice ? "text-destructive" : ""}
                                  >
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
                                  <Input
                                    id={`sellingPrice-${index}`}
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={variation.sellingPrice}
                                    onChange={(e) => handleSizeVariationChange(index, "sellingPrice", e.target.value)}
                                    onBlur={(e) => validateSizeVariationField(index, "sellingPrice", e.target.value)}
                                    disabled={sameDiscountForAll}
                                    className={`${errors.sizeVariations?.[index]?.sellingPrice ? "border-destructive pr-10" : ""}`}
                                  />
                                  {isSubmitAttempted && !sameDiscountForAll && (
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                      {errors.sizeVariations?.[index]?.sellingPrice ? (
                                        <AlertCircle className="h-4 w-4 text-destructive" />
                                      ) : variation.sellingPrice ? (
                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                      ) : null}
                                    </div>
                                  )}
                                </div>
                                {errors.sizeVariations?.[index]?.sellingPrice && (
                                  <p className="text-sm font-medium text-destructive flex items-center mt-1">
                                    <AlertCircle className="h-3.5 w-3.5 mr-1" />
                                    {errors.sizeVariations[index].sellingPrice}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Price summary with visual indicator */}
                            {variation.price && (
                              <div className="mt-3 p-2 bg-muted/40 rounded-md">
                                <div className="flex items-center text-sm">
                                  <span
                                    className={
                                      Number(variation.discount) > 0
                                        ? "line-through text-muted-foreground"
                                        : "font-medium"
                                    }
                                  >
                                    {formatPrice(variation.price)}
                                  </span>

                                  {Number(variation.discount) > 0 && (
                                    <>
                                      <ArrowRight className="h-3.5 w-3.5 mx-2 text-muted-foreground" />
                                      <span className="font-medium text-green-600">
                                        {formatPrice(variation.sellingPrice || variation.price)}
                                      </span>
                                      <Badge className="ml-2 bg-orange-500/10 text-orange-600 hover:bg-orange-500/20">
                                        {variation.discount}% OFF
                                      </Badge>
                                    </>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </ScrollArea>

                      <Button type="button" variant="outline" onClick={addSizeVariation} className="w-full">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Another Size
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className="mb-4 rounded-full bg-muted p-3">
                        <Plus className="h-6 w-6" />
                      </div>
                      <h3 className="mb-2 text-lg font-medium">Enable Size Variations</h3>
                      <p className="mb-4 text-sm text-muted-foreground max-w-md">
                        To add multiple size variations for this product, go to the Basic Information tab and check
                        "This product has multiple size variations"
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setHasSizeVariations(true)
                        }}
                      >
                        Enable Size Variations
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="images" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Product Images</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4" ref={imagesRef}>
                    {imageUrls.map((url, index) => (
                      <div key={index} className="relative aspect-square border rounded-md overflow-hidden">
                        <img
                          src={url || "/placeholder.svg"}
                          alt={`Product preview ${index + 1}`}
                          className="w-full h-full object-cover"
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

                    <label
                      className={`flex flex-col items-center justify-center aspect-square border ${errors.images ? "border-destructive border-dashed" : "border-dashed"} rounded-md cursor-pointer hover:bg-gray-50`}
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className={`h-8 w-8 mb-2 ${errors.images ? "text-destructive" : "text-gray-400"}`} />
                        <p className={`text-xs ${errors.images ? "text-destructive" : "text-gray-500"}`}>
                          Upload Image
                        </p>
                      </div>
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} multiple />
                    </label>
                  </div>

                  {errors.images && (
                    <div className="mt-2 p-3 bg-destructive/10 rounded-md border border-destructive">
                      <p className="text-sm font-medium text-destructive flex items-center">
                        <AlertCircle className="h-4 w-4 mr-2" />
                        {errors.images}
                      </p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => router.back()}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-[#28acc1] hover:bg-[#1e8a9a]" disabled={loading}>
                    {loading
                      ? "Adding..."
                      : hasSizeVariations
                        ? `Add ${sizeVariations.length} Product${sizeVariations.length > 1 ? "s" : ""}`
                        : "Add Product"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </form>
        </Tabs>
      </div>
    </div>
  )
}
