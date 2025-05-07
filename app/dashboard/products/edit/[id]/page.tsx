"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Upload, X } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { fetchApi, updateProductWithFiles } from "@/lib/api"
import { FormattedTextarea } from "@/components/ui/formatted-textarea"
import { DescriptionPreview } from "@/components/ui/description-preview"

export default function EditProductPage({ params }) {
  const productId = params.id

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    stock: "",
    price: "",
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

        // Set form data from product
        setFormData({
          name: productData.name || "",
          description: productData.description || "",
          stock: productData.stock?.toString() || "0",
          price: productData.price?.toString() || "0",
          category: categoryId || "",
          material: materialId || "",
          grade: gradeId || "",
          gem: productData.gem || "",
          coating: productData.coating || "",
          size: productData.size || "",
          images: productData.images || [],
        })

        // Set image URLs
        if (productData.images && productData.images.length > 0) {
          setImageUrls(productData.images)
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

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }))
    }
  }

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }))
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
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }))
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = "Product name is required"
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

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
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

    try {
      setLoading(true)

      // Format the request data according to the API requirements
      const productData = {
        name: formData.name,
        description: formData.description,
        stock: formData.stock,
        category: formData.category, // This is already the ID from the select
        material: formData.material, // This is already the ID from the select
        grade: formData.grade, // This is already the ID from the select
        price: formData.price,
        gem: formData.gem || undefined,
        coating: formData.coating || undefined,
        size: formData.size || undefined,
      }

      console.log("Updating product with data:", productData)

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
                  <Label htmlFor="description">Description</Label>
                  <FormattedTextarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Describe your product. Use formatting tools for better presentation."
                  />
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
                  <Select value={formData.category} onValueChange={(value) => handleSelectChange("category", value)}>
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
                  <Select value={formData.material} onValueChange={(value) => handleSelectChange("material", value)}>
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
