"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { fetchApi } from "@/lib/api"
import { EnhancedDateRangePicker } from "@/components/ui/enhanced-date-range-picker"
import { CouponProductSelector } from "@/components/ui/coupon-product-selector"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function AddCouponPage() {
  const [formData, setFormData] = useState({
    code: "",
    offerPercentage: "",
    type: "normal",
    minimumOrderAmount: "",
  })

  const [products, setProducts] = useState([])
  const [selectedProductIds, setSelectedProductIds] = useState([])
  const [loading, setLoading] = useState(false)
  const [productsLoading, setProductsLoading] = useState(true)
  const [errors, setErrors] = useState({})
  const [startDate, setStartDate] = useState<Date>(new Date())
  const [endDate, setEndDate] = useState<Date>(new Date(new Date().setMonth(new Date().getMonth() + 1)))

  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setProductsLoading(true)
      console.log("Fetching products for coupon creation...")

      const response = await fetchApi("/api/v1/product/list/")
      console.log("Raw product API response:", response)

      // Handle different possible response structures
      let productsData = []

      if (response && response.success) {
        if (response.data && response.data.success && Array.isArray(response.data.products)) {
          // Structure: { success: true, data: { success: true, products: [...] } }
          productsData = response.data.products
        } else if (response.data && Array.isArray(response.data.products)) {
          // Structure: { success: true, data: { products: [...] } }
          productsData = response.data.products
        } else if (Array.isArray(response.data)) {
          // Structure: { success: true, data: [...] }
          productsData = response.data
        }
      } else if (Array.isArray(response)) {
        // Direct array response
        productsData = response
      }

      console.log("Processed products data:", productsData)
      console.log("Number of products:", productsData.length)

      // Log a sample product to understand the structure
      if (productsData.length > 0) {
        console.log("Sample product structure:", productsData[0])
      }

      // Ensure products have the required fields for the consolidated selector
      const formattedProducts = productsData.map((product) => ({
        _id: product._id,
        name: product.name || "Unnamed Product",
        price: product.price || product.sellingPrice || 0,
        image: product.images && product.images.length > 0 ? product.images[0] : null,
        images: product.images || [],
        category: product.category || "Uncategorized",
        size: product.size || null,
        grade: product.grade || null,
        material: product.material || null,
      }))

      console.log("Formatted products for consolidated selector:", formattedProducts)
      setProducts(formattedProducts)

      if (formattedProducts.length === 0) {
        toast({
          variant: "destructive",
          title: "No Products Found",
          description: "No products are available for selection. Please add products first.",
        })
      }
    } catch (error) {
      console.error("Error fetching products:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch products: " + (error.message || "Unknown error"),
      })
      setProducts([])
    } finally {
      setProductsLoading(false)
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

  const handleTypeChange = (value) => {
    setFormData((prev) => ({ ...prev, type: value }))

    // Clear product selection if switching to normal type
    if (value === "normal") {
      setSelectedProductIds([])
    }

    // Clear error for this field
    if (errors.type) {
      setErrors((prev) => ({ ...prev, type: null }))
    }
  }

  const handleProductSelectionChange = (newSelectedIds) => {
    console.log("Product selection changed:", newSelectedIds)
    setSelectedProductIds(newSelectedIds)

    // Clear products error if products are selected
    if (newSelectedIds.length > 0 && errors.products) {
      setErrors((prev) => ({ ...prev, products: null }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.code.trim()) {
      newErrors.code = "Coupon code is required"
    } else if (formData.code.length < 3) {
      newErrors.code = "Coupon code must be at least 3 characters"
    }

    if (!formData.offerPercentage) {
      newErrors.offerPercentage = "Offer percentage is required"
    } else if (
      isNaN(formData.offerPercentage) ||
      Number(formData.offerPercentage) <= 0 ||
      Number(formData.offerPercentage) > 100
    ) {
      newErrors.offerPercentage = "Offer percentage must be between 1 and 100"
    }

    if (
      formData.minimumOrderAmount &&
      (isNaN(formData.minimumOrderAmount) || Number(formData.minimumOrderAmount) < 0)
    ) {
      newErrors.minimumOrderAmount = "Minimum order amount must be a valid positive number"
    }

    if (!startDate) {
      newErrors.validFrom = "Valid from date is required"
    }

    if (!endDate) {
      newErrors.validUntil = "Valid until date is required"
    } else if (endDate <= startDate) {
      newErrors.validUntil = "Valid until date must be after valid from date"
    }

    if (formData.type === "product" && selectedProductIds.length === 0) {
      newErrors.products = "Please select at least one product variant for product-specific coupons"
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

      // Prepare API data according to the specified format
      const apiData = {
        code: formData.code.toUpperCase().trim(),
        offerPercentage: Number(formData.offerPercentage),
        validFrom: startDate.toISOString(),
        validUntil: endDate.toISOString(),
        type: formData.type,
        minimumOrderAmount: formData.minimumOrderAmount ? Number(formData.minimumOrderAmount) : 0,
      }

      // Add products array only for product-specific coupons
      if (formData.type === "product") {
        apiData.products = selectedProductIds
      }

      console.log("Submitting coupon data:", apiData)
      console.log("Selected product variant IDs:", selectedProductIds)

      const response = await fetchApi("/api/v1/admin/coupon/add", {
        method: "POST",
        body: JSON.stringify(apiData),
      })

      console.log("Coupon creation response:", response)

      toast({
        title: "Success",
        description: "Coupon added successfully",
      })

      router.push("/dashboard/coupons")
    } catch (error) {
      console.error("Error adding coupon:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add coupon: " + (error.message || "Unknown error"),
      })
    } finally {
      setLoading(false)
    }
  }

  // Get selected product summary for display
  const getSelectedProductSummary = () => {
    if (selectedProductIds.length === 0) return "No products selected"

    const selectedProducts = products.filter((p) => selectedProductIds.includes(p._id))
    const productGroups = new Map()

    selectedProducts.forEach((product) => {
      const categoryName =
        typeof product.category === "object" ? product.category.name : product.category || "Uncategorized"
      const key = `${product.name}-${categoryName}`

      if (!productGroups.has(key)) {
        productGroups.set(key, {
          name: product.name,
          sizes: new Set(),
          count: 0,
        })
      }

      const group = productGroups.get(key)
      if (product.size) {
        group.sizes.add(product.size)
      }
      group.count++
    })

    const summary = Array.from(productGroups.values())
      .map((group) => {
        const sizeInfo = group.sizes.size > 0 ? ` (${Array.from(group.sizes).join(", ")})` : ""
        return `${group.name}${sizeInfo}`
      })
      .join(", ")

    return `${selectedProductIds.length} variants: ${summary}`
  }

  return (
    <div>
      <Header title="Add Coupon" />
      <div className="p-6">
        <Button variant="outline" className="mb-6" onClick={() => router.back()} type="button">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Coupons
        </Button>

        <form onSubmit={handleSubmit} noValidate>
          <div className="max-w-3xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Create New Coupon</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="code" className={errors.code ? "text-destructive" : ""}>
                      Coupon Code *
                    </Label>
                    <Input
                      id="code"
                      name="code"
                      value={formData.code}
                      onChange={handleChange}
                      className={errors.code ? "border-destructive" : ""}
                      placeholder="e.g., SUMMER2024"
                      maxLength={20}
                    />
                    {errors.code && <p className="text-sm text-destructive">{errors.code}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="offerPercentage" className={errors.offerPercentage ? "text-destructive" : ""}>
                      Discount Percentage (%) *
                    </Label>
                    <Input
                      id="offerPercentage"
                      name="offerPercentage"
                      type="number"
                      min="1"
                      max="100"
                      step="0.01"
                      value={formData.offerPercentage}
                      onChange={handleChange}
                      className={errors.offerPercentage ? "border-destructive" : ""}
                      placeholder="e.g., 10"
                    />
                    {errors.offerPercentage && <p className="text-sm text-destructive">{errors.offerPercentage}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="type" className={errors.type ? "text-destructive" : ""}>
                      Coupon Type *
                    </Label>
                    <Select value={formData.type} onValueChange={handleTypeChange}>
                      <SelectTrigger className={errors.type ? "border-destructive" : ""}>
                        <SelectValue placeholder="Select coupon type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal (All Products)</SelectItem>
                        <SelectItem value="product">Product Specific</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.type && <p className="text-sm text-destructive">{errors.type}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="minimumOrderAmount" className={errors.minimumOrderAmount ? "text-destructive" : ""}>
                      Minimum Order Amount (₹)
                    </Label>
                    <Input
                      id="minimumOrderAmount"
                      name="minimumOrderAmount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.minimumOrderAmount}
                      onChange={handleChange}
                      className={errors.minimumOrderAmount ? "border-destructive" : ""}
                      placeholder="0 (No minimum)"
                    />
                    {errors.minimumOrderAmount && (
                      <p className="text-sm text-destructive">{errors.minimumOrderAmount}</p>
                    )}
                    <p className="text-xs text-muted-foreground">Leave empty or 0 for no minimum order requirement</p>
                  </div>
                </div>

                <Separator />

                <EnhancedDateRangePicker
                  startDate={startDate}
                  endDate={endDate}
                  onStartDateChange={setStartDate}
                  onEndDateChange={setEndDate}
                  startError={errors.validFrom}
                  endError={errors.validUntil}
                />

                <Separator />

                {formData.type === "product" && (
                  <>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">Product Selection</h3>
                        <div className="text-sm text-muted-foreground">
                          {selectedProductIds.length} variant{selectedProductIds.length !== 1 ? "s" : ""} selected
                        </div>
                      </div>

                      {selectedProductIds.length > 0 && (
                        <div className="bg-muted/50 p-3 rounded-lg">
                          <p className="text-sm font-medium mb-1">Selected Products:</p>
                          <p className="text-sm text-muted-foreground">{getSelectedProductSummary()}</p>
                        </div>
                      )}

                      {productsLoading ? (
                        <div className="flex items-center justify-center p-8 border rounded-lg">
                          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                          <span className="ml-3">Loading products...</span>
                        </div>
                      ) : products.length === 0 ? (
                        <div className="text-center p-8 border rounded-lg">
                          <p className="text-muted-foreground">No products available for selection.</p>
                          <p className="text-sm text-muted-foreground mt-2">Please add products first.</p>
                        </div>
                      ) : (
                        <CouponProductSelector
                          products={products}
                          selectedProductIds={selectedProductIds}
                          onChange={handleProductSelectionChange}
                          error={errors.products}
                        />
                      )}
                    </div>
                    <Separator />
                  </>
                )}

                {formData.type === "normal" && (
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Normal Coupon</h4>
                    <p className="text-sm text-muted-foreground">
                      This coupon will be applicable to all products in your store.
                    </p>
                  </div>
                )}

                {/* Debug information in development */}
                {process.env.NODE_ENV === "development" && formData.type === "product" && (
                  <div className="bg-gray-100 p-4 rounded-lg text-xs">
                    <h4 className="font-medium mb-2">Debug Info:</h4>
                    <p>Products loaded: {products.length}</p>
                    <p>Selected product variant IDs: {JSON.stringify(selectedProductIds)}</p>
                    <p>Products loading: {productsLoading.toString()}</p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => router.push("/dashboard/coupons")}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-[#28acc1] hover:bg-[#1e8a9a]"
                  disabled={loading || (formData.type === "product" && productsLoading)}
                >
                  {loading ? "Creating..." : "Create Coupon"}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </form>
      </div>
    </div>
  )
}
