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
import { fetchApi, uploadFiles } from "@/lib/api"
import { FormattedTextarea } from "@/components/ui/formatted-textarea"
import { DescriptionPreview } from "@/components/ui/description-preview"

export default function AddProductPage() {
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
  })

  const [categories, setCategories] = useState([])
  const [materials, setMaterials] = useState([])
  const [grades, setGrades] = useState([])
  const [loading, setLoading] = useState(false)
  const [imageFiles, setImageFiles] = useState([])
  const [imageUrls, setImageUrls] = useState([])
  const [errors, setErrors] = useState({})

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

      // Prepare the data for the API request
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

      console.log("Submitting product data:", productData)

      // Upload the product with images
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
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add product: " + (error.message || "Unknown error"),
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Header title="Add Product" />
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
                  {loading ? "Adding..." : "Add Product"}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </form>
      </div>
    </div>
  )
}
