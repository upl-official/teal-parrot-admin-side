"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Calendar } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { fetchApi } from "@/lib/api"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format } from "date-fns"

export default function AddCouponPage() {
  const [formData, setFormData] = useState({
    code: "",
    offerPercentage: "",
    validFrom: new Date(),
    validUntil: new Date(new Date().setMonth(new Date().getMonth() + 1)), // Default to 1 month from now
    products: [],
  })

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetchApi("/api/v1/product/list/")
      const productsData = response.data?.products || response.products || []
      setProducts(productsData)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch products",
      })
      setProducts([])
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

  const handleProductsChange = (selectedProducts) => {
    setFormData((prev) => ({ ...prev, products: selectedProducts }))

    // Clear error for this field
    if (errors.products) {
      setErrors((prev) => ({ ...prev, products: null }))
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

    if (!formData.validFrom) {
      newErrors.validFrom = "Valid from date is required"
    }

    if (!formData.validUntil) {
      newErrors.validUntil = "Valid until date is required"
    } else if (formData.validUntil < formData.validFrom) {
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
        validFrom: formData.validFrom.toISOString(),
        validUntil: formData.validUntil.toISOString(),
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
        <Button variant="outline" className="mb-6" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Coupons
        </Button>

        <form onSubmit={handleSubmit}>
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Coupon Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="validFrom" className={errors.validFrom ? "text-destructive" : ""}>
                      Valid From *
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={`w-full justify-start text-left font-normal ${
                            errors.validFrom ? "border-destructive" : ""
                          }`}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {formData.validFrom ? format(formData.validFrom, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                          mode="single"
                          selected={formData.validFrom}
                          onSelect={(date) => setFormData((prev) => ({ ...prev, validFrom: date }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {errors.validFrom && <p className="text-sm text-destructive">{errors.validFrom}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="validUntil" className={errors.validUntil ? "text-destructive" : ""}>
                      Valid Until *
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={`w-full justify-start text-left font-normal ${
                            errors.validUntil ? "border-destructive" : ""
                          }`}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {formData.validUntil ? format(formData.validUntil, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                          mode="single"
                          selected={formData.validUntil}
                          onSelect={(date) => setFormData((prev) => ({ ...prev, validUntil: date }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {errors.validUntil && <p className="text-sm text-destructive">{errors.validUntil}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="products" className={errors.products ? "text-destructive" : ""}>
                    Applicable Products
                  </Label>
                  <Select
                    value={formData.products.length > 0 ? "selected" : ""}
                    onValueChange={(value) => {
                      if (value === "all") {
                        handleProductsChange(products.map((p) => p._id))
                      } else if (value === "none") {
                        handleProductsChange([])
                      }
                    }}
                  >
                    <SelectTrigger className={errors.products ? "border-destructive" : ""}>
                      <SelectValue placeholder="Select products">
                        {formData.products.length > 0
                          ? `${formData.products.length} product(s) selected`
                          : "Select products"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Products</SelectItem>
                      <SelectItem value="none">No Products</SelectItem>
                      <SelectItem value="selected">Selected Products</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.products && <p className="text-sm text-destructive">{errors.products}</p>}

                  {formData.products.length > 0 && (
                    <div className="mt-2 space-y-2">
                      <Label>Selected Products:</Label>
                      <div className="max-h-40 overflow-y-auto border rounded-md p-2">
                        {formData.products.map((productId) => {
                          const product = products.find((p) => p._id === productId)
                          return (
                            <div key={productId} className="flex items-center justify-between py-1">
                              <span>{product ? product.name : productId}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleProductsChange(formData.products.filter((id) => id !== productId))}
                              >
                                Remove
                              </Button>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {formData.products.length < products.length && (
                    <div className="mt-2">
                      <Label>Add Products:</Label>
                      <div className="max-h-40 overflow-y-auto border rounded-md p-2 mt-1">
                        {products
                          .filter((product) => !formData.products.includes(product._id))
                          .map((product) => (
                            <div key={product._id} className="flex items-center justify-between py-1">
                              <span>{product.name}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleProductsChange([...formData.products, product._id])}
                              >
                                Add
                              </Button>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button type="submit" className="bg-[#28acc1] hover:bg-[#1e8a9a]" disabled={loading}>
                  {loading ? "Adding..." : "Add Coupon"}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </form>
      </div>
    </div>
  )
}
