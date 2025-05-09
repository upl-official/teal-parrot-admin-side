"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Upload, X, Plus, Trash2, AlertCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { fetchApi, uploadFiles } from "@/lib/api"
import { FormattedTextarea } from "@/components/ui/formatted-textarea"
import { DescriptionPreview } from "@/components/ui/description-preview"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function AddProductPage() {
  const [formData, setFormData] = useState({
    name: "",
    description: "", // This is required by the API
    stock: "",
    price: "",
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

  // Size variations state
  const [hasSizeVariations, setHasSizeVariations] = useState(false)
  const [sizeVariations, setSizeVariations] = useState([{ size: "", stock: "", price: "", discount: "0" }])
  const [samePriceForAll, setSamePriceForAll] = useState(true)
  const [sameStockForAll, setSameStockForAll] = useState(true)
  const [sameDiscountForAll, setSameDiscountForAll] = useState(true)
  const [activeTab, setActiveTab] = useState("basic")

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
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }))
    }

    // Clear API error when user makes changes
    if (apiError) {
      setApiError("")
    }
  }

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }))
    }

    // Clear API error when user makes changes
    if (apiError) {
      setApiError("")
    }
  }

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files)

    if (files.length > 0) {
      setImageFiles((prevFiles) => [...prevFiles, ...files])

      // Create preview URLs
      const newImageUrls = files.map((file) => URL.createObjectURL(file))
      setImageUrls((prevUrls) => [...prevUrls, ...newImageUrls])
    }
  }

  const removeImage = (index) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index))
    setImageFiles((prev) => prev.filter((_, i) => i !== index))
  }

  // Size variation handlers
  const addSizeVariation = () => {
    setSizeVariations([
      ...sizeVariations,
      {
        size: "",
        stock: sameStockForAll ? formData.stock : "",
        price: samePriceForAll ? formData.price : "",
        discount: sameDiscountForAll ? "0" : "",
      },
    ])
  }

  const removeSizeVariation = (index) => {
    if (sizeVariations.length > 1) {
      setSizeVariations(sizeVariations.filter((_, i) => i !== index))
    }
  }

  const handleSizeVariationChange = (index, field, value) => {
    const updatedVariations = [...sizeVariations]
    updatedVariations[index] = { ...updatedVariations[index], [field]: value }
    setSizeVariations(updatedVariations)
  }

  const handleSamePriceChange = (checked) => {
    setSamePriceForAll(checked)
    if (checked) {
      // Update all size variations to use the main price
      setSizeVariations(
        sizeVariations.map((variation) => ({
          ...variation,
          price: formData.price,
        })),
      )
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
    }
  }

  const handleSameDiscountChange = (checked) => {
    setSameDiscountForAll(checked)
    if (checked) {
      // Update all size variations to use the main discount (0 by default)
      setSizeVariations(
        sizeVariations.map((variation) => ({
          ...variation,
          discount: "0",
        })),
      )
    }
  }

  // Update size variations when main price or stock changes
  useEffect(() => {
    if (samePriceForAll) {
      setSizeVariations(
        sizeVariations.map((variation) => ({
          ...variation,
          price: formData.price,
        })),
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

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = "Product name is required"
    }

    // Make description required
    if (!formData.description.trim()) {
      newErrors.description = "Product description is required"
    }

    if (!formData.price) {
      newErrors.price = "Price is required"
    } else if (isNaN(formData.price) || Number(formData.price) <= 0) {
      newErrors.price = "Price must be a positive number"
    }

    if (!formData.stock) {
      newErrors.stock = "Stock is required"
    } else if (isNaN(formData.stock) || Number(formData.stock) < 0) {
      newErrors.stock = "Stock must be a non-negative number"
    }

    if (!formData.category) {
      newErrors.category = "Category is required"
    }

    if (!formData.material) {
      newErrors.material = "Material is required"
    }

    if (!formData.grade) {
      newErrors.grade = "Grade is required"
    }

    // Validate size variations if enabled
    if (hasSizeVariations) {
      const sizeErrors = []
      const sizeValues = new Set()

      sizeVariations.forEach((variation, index) => {
        const variationErrors = {}

        if (!variation.size.trim()) {
          variationErrors.size = "Size is required"
        } else if (sizeValues.has(variation.size)) {
          variationErrors.size = "Duplicate size"
        } else {
          sizeValues.add(variation.size)
        }

        if (!samePriceForAll) {
          if (!variation.price) {
            variationErrors.price = "Price is required"
          } else if (isNaN(variation.price) || Number(variation.price) <= 0) {
            variationErrors.price = "Price must be a positive number"
          }
        }

        if (!sameStockForAll) {
          if (!variation.stock) {
            variationErrors.stock = "Stock is required"
          } else if (isNaN(variation.stock) || Number(variation.stock) < 0) {
            variationErrors.stock = "Stock must be a non-negative number"
          }
        }

        if (!sameDiscountForAll) {
          if (
            variation.discount &&
            (isNaN(variation.discount) || Number(variation.discount) < 0 || Number(variation.discount) > 100)
          ) {
            variationErrors.discount = "Discount must be between 0 and 100"
          }
        }

        if (Object.keys(variationErrors).length > 0) {
          sizeErrors[index] = variationErrors
        }
      })

      if (sizeErrors.length > 0) {
        newErrors.sizeVariations = sizeErrors
      }
    }

    // Validate images
    if (imageFiles.length === 0) {
      newErrors.images = "At least one product image is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
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

      // If there's an error with description, switch to the basic tab
      if (errors.description) {
        setActiveTab("basic")
      }

      // If there's an error with images, switch to the images tab
      if (errors.images) {
        setActiveTab("images")
      }

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
            discount: sameDiscountForAll ? "0" : variation.discount || "0",
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

      // If the error is related to description, switch to the basic tab
      if (error.message && error.message.toLowerCase().includes("description")) {
        setActiveTab("basic")
      }
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
    return (numPrice - (numPrice * numDiscount) / 100).toFixed(2)
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
            <TabsTrigger value="basic">Basic Information</TabsTrigger>
            <TabsTrigger value="variations">Size Variations</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit}>
            <TabsContent value="basic" className="mt-0">
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
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className={errors.name ? "border-destructive" : ""}
                      />
                      {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description" className={errors.description ? "text-destructive" : ""}>
                        Description *
                      </Label>
                      <FormattedTextarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={4}
                        placeholder="Describe your product. Use formatting tools for better presentation."
                        className={errors.description ? "border-destructive" : ""}
                      />
                      {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
                      <DescriptionPreview description={formData.description} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="price" className={errors.price ? "text-destructive" : ""}>
                          Price (₹) *
                        </Label>
                        <Input
                          id="price"
                          name="price"
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.price}
                          onChange={handleChange}
                          className={errors.price ? "border-destructive" : ""}
                        />
                        {errors.price && <p className="text-sm text-destructive">{errors.price}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="stock" className={errors.stock ? "text-destructive" : ""}>
                          Stock *
                        </Label>
                        <Input
                          id="stock"
                          name="stock"
                          type="number"
                          min="0"
                          value={formData.stock}
                          onChange={handleChange}
                          className={errors.stock ? "border-destructive" : ""}
                        />
                        {errors.stock && <p className="text-sm text-destructive">{errors.stock}</p>}
                      </div>
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
                      <Select
                        value={formData.category}
                        onValueChange={(value) => handleSelectChange("category", value)}
                      >
                        <SelectTrigger className={errors.category ? "border-destructive" : ""}>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category._id} value={category._id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.category && <p className="text-sm text-destructive">{errors.category}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="material" className={errors.material ? "text-destructive" : ""}>
                        Material *
                      </Label>
                      <Select
                        value={formData.material}
                        onValueChange={(value) => handleSelectChange("material", value)}
                      >
                        <SelectTrigger className={errors.material ? "border-destructive" : ""}>
                          <SelectValue placeholder="Select material" />
                        </SelectTrigger>
                        <SelectContent>
                          {materials.map((material) => (
                            <SelectItem key={material._id} value={material._id}>
                              {material.material}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.material && <p className="text-sm text-destructive">{errors.material}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="grade" className={errors.grade ? "text-destructive" : ""}>
                        Grade *
                      </Label>
                      <Select value={formData.grade} onValueChange={(value) => handleSelectChange("grade", value)}>
                        <SelectTrigger className={errors.grade ? "border-destructive" : ""}>
                          <SelectValue placeholder="Select grade" />
                        </SelectTrigger>
                        <SelectContent>
                          {grades.map((grade) => (
                            <SelectItem key={grade._id} value={grade._id}>
                              {grade.grade}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.grade && <p className="text-sm text-destructive">{errors.grade}</p>}
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

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                              <div className="space-y-2">
                                <Label
                                  htmlFor={`size-${index}`}
                                  className={errors.sizeVariations?.[index]?.size ? "text-destructive" : ""}
                                >
                                  Size *
                                </Label>
                                <Input
                                  id={`size-${index}`}
                                  value={variation.size}
                                  onChange={(e) => handleSizeVariationChange(index, "size", e.target.value)}
                                  placeholder="e.g., S, M, L, XL"
                                  className={errors.sizeVariations?.[index]?.size ? "border-destructive" : ""}
                                />
                                {errors.sizeVariations?.[index]?.size && (
                                  <p className="text-sm text-destructive">{errors.sizeVariations[index].size}</p>
                                )}
                              </div>

                              <div className="space-y-2">
                                <Label
                                  htmlFor={`price-${index}`}
                                  className={errors.sizeVariations?.[index]?.price ? "text-destructive" : ""}
                                >
                                  Price (₹) *
                                </Label>
                                <Input
                                  id={`price-${index}`}
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={variation.price}
                                  onChange={(e) => handleSizeVariationChange(index, "price", e.target.value)}
                                  disabled={samePriceForAll}
                                  className={errors.sizeVariations?.[index]?.price ? "border-destructive" : ""}
                                />
                                {errors.sizeVariations?.[index]?.price && (
                                  <p className="text-sm text-destructive">{errors.sizeVariations[index].price}</p>
                                )}
                              </div>

                              <div className="space-y-2">
                                <Label
                                  htmlFor={`discount-${index}`}
                                  className={errors.sizeVariations?.[index]?.discount ? "text-destructive" : ""}
                                >
                                  Discount (%)
                                </Label>
                                <Input
                                  id={`discount-${index}`}
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.01"
                                  value={variation.discount || "0"}
                                  onChange={(e) => handleSizeVariationChange(index, "discount", e.target.value)}
                                  disabled={sameDiscountForAll}
                                  className={errors.sizeVariations?.[index]?.discount ? "border-destructive" : ""}
                                />
                                {errors.sizeVariations?.[index]?.discount && (
                                  <p className="text-sm text-destructive">{errors.sizeVariations[index].discount}</p>
                                )}
                              </div>

                              <div className="space-y-2">
                                <Label
                                  htmlFor={`stock-${index}`}
                                  className={errors.sizeVariations?.[index]?.stock ? "text-destructive" : ""}
                                >
                                  Stock *
                                </Label>
                                <Input
                                  id={`stock-${index}`}
                                  type="number"
                                  min="0"
                                  value={variation.stock}
                                  onChange={(e) => handleSizeVariationChange(index, "stock", e.target.value)}
                                  disabled={sameStockForAll}
                                  className={errors.sizeVariations?.[index]?.stock ? "border-destructive" : ""}
                                />
                                {errors.sizeVariations?.[index]?.stock && (
                                  <p className="text-sm text-destructive">{errors.sizeVariations[index].stock}</p>
                                )}
                              </div>
                            </div>

                            {/* Selling price calculation */}
                            {variation.price && variation.discount && (
                              <div className="mt-2 text-sm text-muted-foreground">
                                Selling price: ₹{calculateSellingPrice(variation.price, variation.discount)}
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
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
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

                    <label className="flex flex-col items-center justify-center aspect-square border border-dashed rounded-md cursor-pointer hover:bg-gray-50">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-xs text-gray-500">Upload Image</p>
                      </div>
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} multiple />
                    </label>
                  </div>

                  {errors.images && <p className="text-sm text-destructive mt-2">{errors.images}</p>}
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
