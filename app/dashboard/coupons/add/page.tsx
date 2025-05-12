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
import { HierarchicalProductSelector } from "@/components/ui/hierarchical-product-selector"
import { Separator } from "@/components/ui/separator"

export default function AddCouponPage() {
  const [formData, setFormData] = useState({
    code: "",
    offerPercentage: "",
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
      const response = await fetchApi("/api/v1/product/list/")

      // Log the response to see its structure
      console.log("Product API response:", response)

      const productsData = response.data?.products || response.products || []

      // Log the extracted products
      console.log("Extracted products:", productsData)

      // Log a sample product if available
      if (productsData.length > 0) {
        console.log("Sample product:", productsData[0])
      }

      setProducts(productsData)
    } catch (error) {
      console.error("Error fetching products:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch products",
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

  const validateForm = () => {
    const newErrors = {}

    if (!formData.code.trim()) {
      newErrors.code = "Coupon code is required"
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

    if (!startDate) {
      newErrors.validFrom = "Valid from date is required"
    }

    if (!endDate) {
      newErrors.validUntil = "Valid until date is required"
    } else if (endDate < startDate) {
      newErrors.validUntil = "Valid until date must be after valid from date"
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

      // Format dates for API
      const apiData = {
        ...formData,
        validFrom: startDate.toISOString(),
        validUntil: endDate.toISOString(),
        products: selectedProductIds,
      }

      await fetchApi("/api/v1/admin/coupon/add", {
        method: "POST",
        body: JSON.stringify(apiData),
      })

      toast({
        title: "Success",
        description: "Coupon added successfully",
      })

      router.push("/dashboard/coupons")
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add coupon: " + (error.message || "Unknown error"),
      })
    } finally {
      setLoading(false)
    }
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
                      value={formData.offerPercentage}
                      onChange={handleChange}
                      className={errors.offerPercentage ? "border-destructive" : ""}
                      placeholder="e.g., 10"
                    />
                    {errors.offerPercentage && <p className="text-sm text-destructive">{errors.offerPercentage}</p>}
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

                {productsLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    <span className="ml-3">Loading products...</span>
                  </div>
                ) : (
                  <HierarchicalProductSelector
                    products={products}
                    selectedProductIds={selectedProductIds}
                    onChange={setSelectedProductIds}
                    error={errors.products}
                  />
                )}
              </CardContent>
              <CardFooter className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => router.push("/dashboard/coupons")}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-[#28acc1] hover:bg-[#1e8a9a]" disabled={loading || productsLoading}>
                  {loading ? "Adding..." : "Create Coupon"}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </form>
      </div>
    </div>
  )
}
