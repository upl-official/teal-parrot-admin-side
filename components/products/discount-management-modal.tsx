"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { fetchApi } from "@/lib/api"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Percent, Tag, ArrowRight } from "lucide-react"
// Import the new DiscountInput component
import { DiscountInput } from "@/components/ui/discount-input"
import { DecimalInput } from "@/components/ui/decimal-input"
// Add the new function to the imports
import { calculateSellingPriceAsNumber, calculateDiscountFromPrices } from "@/lib/price-utils"

interface DiscountManagementModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: any
  onSuccess: () => void
}

export function DiscountManagementModal({ open, onOpenChange, product, onSuccess }: DiscountManagementModalProps) {
  const [loading, setLoading] = useState(false)
  const [originalPrice, setOriginalPrice] = useState(product?.price || 0)
  const [discountPercentage, setDiscountPercentage] = useState(0)
  const [sellingPrice, setSellingPrice] = useState<number>(Number(product?.price || 0))
  const { toast } = useToast()

  // Initialize values when modal opens or product changes
  useEffect(() => {
    if (product) {
      // Use originalPrice as the original price (before discount)
      setOriginalPrice(Number(product.originalPrice || product.price || 0))

      // Use the provided discountPercentage
      setDiscountPercentage(Number(product.discountPercentage || 0))

      // Use price as the selling price (after discount)
      setSellingPrice(Number(product.price || 0))
    }
  }, [product, open])

  // Calculate selling price when original price or discount percentage changes
  const calculateSellingPriceOld = (price: number, discount: number) => {
    if (discount <= 0) return price
    return Math.round(price - (price * discount) / 100)
  }

  // Calculate discount percentage when original price or selling price changes
  const calculateDiscountPercentageOld = (originalPrice: number, sellingPrice: number) => {
    if (sellingPrice >= originalPrice) return 0
    return Math.round(((originalPrice - sellingPrice) / originalPrice) * 100)
  }

  // Original price is now fixed and unchangeable
  const handleOriginalPriceChange = () => {
    // No-op function as original price is now fixed
  }

  // Replace this function:
  // const handleDiscountPercentageChange = (value: string) => {
  //   const discount = Number.parseFloat(value) || 0
  //   setDiscountPercentage(discount)

  //   // Calculate selling price with high precision and ensure it's a number
  //   const calculatedSellingPrice = Number(calculateSellingPrice(originalPrice, discount))
  //   setSellingPrice(calculatedSellingPrice)
  // }

  // With this:
  const handleDiscountPercentageChange = (value: string) => {
    const discount = Number.parseFloat(value) || 0
    setDiscountPercentage(discount)

    // Use the numeric version of the function
    const calculatedSellingPrice = calculateSellingPriceAsNumber(originalPrice, discount)
    setSellingPrice(calculatedSellingPrice)
  }

  // Replace the handleSellingPriceChange function
  const handleSellingPriceChange = (value: string) => {
    const price = Number.parseFloat(value) || 0
    setSellingPrice(price)

    // Calculate discount with high precision
    const calculatedDiscount = calculateDiscountFromPrices(originalPrice, price)
    setDiscountPercentage(Number.parseFloat(calculatedDiscount) || 0)
  }

  // Apply discount
  const handleApplyDiscount = async () => {
    if (discountPercentage <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid Discount",
        description: "Please enter a valid discount percentage greater than 0.",
      })
      return
    }

    if (discountPercentage >= 100) {
      toast({
        variant: "destructive",
        title: "Invalid Discount",
        description: "Discount percentage cannot be 100% or greater.",
      })
      return
    }

    setLoading(true)
    try {
      await fetchApi("/api/v1/admin/product/add-discount", {
        method: "POST",
        body: JSON.stringify({
          productId: product._id,
          discountPercentage: discountPercentage,
        }),
      })

      toast({
        title: "Success",
        description: `Discount of ${discountPercentage}% applied successfully.`,
      })
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to apply discount. Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  // Remove discount
  const handleRemoveDiscount = async () => {
    if (!product.discountPercentage || product.discountPercentage <= 0) {
      onOpenChange(false)
      return
    }

    setLoading(true)
    try {
      await fetchApi("/api/v1/admin/product/remove-discount", {
        method: "POST",
        body: JSON.stringify({
          productId: product._id,
        }),
      })

      toast({
        title: "Success",
        description: "Discount removed successfully.",
      })
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove discount. Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Manage Product Discount</DialogTitle>
          <DialogDescription>Set a discount for {product?.name}.</DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {/* Price Preview Card */}
          <Card className="p-4 bg-muted/50">
            <div className="flex flex-col space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">Original Price:</span>
                <span className="font-semibold">₹{originalPrice.toFixed(2)}</span>
              </div>

              {discountPercentage > 0 && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-muted-foreground flex items-center">
                      <Percent className="h-3.5 w-3.5 mr-1 text-orange-500" />
                      Discount:
                    </span>
                    <Badge variant="outline" className="bg-orange-500/10 text-orange-600 hover:bg-orange-500/20">
                      {discountPercentage}% OFF
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-sm font-medium text-muted-foreground flex items-center">
                      <Tag className="h-3.5 w-3.5 mr-1 text-green-500" />
                      Selling Price:
                    </span>
                    <span className="font-bold text-green-600">₹{sellingPrice.toFixed(2)}</span>
                  </div>

                  <div className="flex items-center justify-center mt-2 text-sm text-muted-foreground">
                    <span className="line-through">₹{originalPrice.toFixed(2)}</span>
                    <ArrowRight className="h-3.5 w-3.5 mx-2" />
                    <span className="font-medium text-green-600">₹{sellingPrice.toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>
          </Card>

          {/* Original Price - Read Only */}
          <div className="space-y-2">
            <Label htmlFor="originalPrice" className="text-sm font-medium">
              Original Price
            </Label>
            <Input
              id="originalPrice"
              type="number"
              value={originalPrice}
              disabled
              className="bg-muted/50 cursor-not-allowed"
            />
          </div>

          {/* Discount Percentage */}
          <div className="space-y-2">
            <Label htmlFor="discountPercentage" className="text-sm font-medium">
              Discount Percentage
            </Label>
            <div className="relative">
              <DiscountInput
                id="discountPercentage"
                min={0}
                max={99.999999}
                value={discountPercentage.toString()}
                onChange={(value) => handleDiscountPercentageChange(value)}
                className="pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
            </div>
          </div>

          {/* Selling Price */}
          <div className="space-y-2">
            <Label htmlFor="sellingPrice" className="text-sm font-medium">
              Selling Price
            </Label>
            <DecimalInput
              id="sellingPrice"
              min={0}
              value={sellingPrice.toString()}
              onChange={(value) => handleSellingPriceChange(value)}
              decimalPlaces={2}
            />
          </div>

          {product.discountPercentage > 0 && (
            <div className="p-3 bg-blue-50 text-blue-700 rounded-md text-sm">
              Current discount: {product.discountPercentage}% off (₹
              {product.originalPrice.toFixed(2)} → ₹{product.price.toFixed(2)})
            </div>
          )}
        </div>
        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2 border-t">
          {product.discountPercentage ? (
            <Button
              variant="outline"
              onClick={handleRemoveDiscount}
              disabled={loading}
              className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              Remove Discount
            </Button>
          ) : null}
          <Button
            onClick={handleApplyDiscount}
            disabled={loading || discountPercentage <= 0}
            className={discountPercentage > 0 ? "bg-green-600 hover:bg-green-700" : ""}
          >
            {loading ? "Applying..." : "Apply Discount"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
