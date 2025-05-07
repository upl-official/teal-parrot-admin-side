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
  const [sellingPrice, setSellingPrice] = useState(product?.price || 0)
  const { toast } = useToast()

  // Initialize values when modal opens or product changes
  useEffect(() => {
    if (product) {
      setOriginalPrice(product.price || 0)

      // Calculate discount percentage if discountPrice exists
      if (product.discountPrice) {
        const calculatedDiscount = Math.round(((product.price - product.discountPrice) / product.price) * 100)
        setDiscountPercentage(calculatedDiscount)
        setSellingPrice(product.discountPrice)
      } else {
        setDiscountPercentage(0)
        setSellingPrice(product.price || 0)
      }
    }
  }, [product, open])

  // Calculate selling price when original price or discount percentage changes
  const calculateSellingPrice = (price: number, discount: number) => {
    if (discount <= 0) return price
    return Math.round(price - (price * discount) / 100)
  }

  // Calculate discount percentage when original price or selling price changes
  const calculateDiscountPercentage = (originalPrice: number, sellingPrice: number) => {
    if (sellingPrice >= originalPrice) return 0
    return Math.round(((originalPrice - sellingPrice) / originalPrice) * 100)
  }

  // Original price is now fixed and unchangeable
  const handleOriginalPriceChange = () => {
    // No-op function as original price is now fixed
  }

  // Handle discount percentage change
  const handleDiscountPercentageChange = (value: string) => {
    const discount = Number.parseFloat(value) || 0
    setDiscountPercentage(discount)
    setSellingPrice(calculateSellingPrice(originalPrice, discount))
  }

  // Handle selling price change
  const handleSellingPriceChange = (value: string) => {
    const price = Number.parseFloat(value) || 0
    setSellingPrice(price)
    setDiscountPercentage(calculateDiscountPercentage(originalPrice, price))
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
    if (!product.discountPrice) {
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
          <DialogDescription>
            Set a discount for {product?.name}.
          </DialogDescription>
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
              <Input
                id="discountPercentage"
                type="number"
                min="0"
                max="99"
                step="1"
                value={discountPercentage}
                onChange={(e) => handleDiscountPercentageChange(e.target.value)}
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
            <Input
              id="sellingPrice"
              type="number"
              min="0"
              step="1"
              value={sellingPrice}
              onChange={(e) => handleSellingPriceChange(e.target.value)}
            />
          </div>

          {product.discountPrice && (
            <div className="p-3 bg-blue-50 text-blue-700 rounded-md text-sm">
              Current discount: {calculateDiscountPercentage(product.price, product.discountPrice)}% off (₹
              {product.price.toFixed(2)} → ₹{product.discountPrice.toFixed(2)})
            </div>
          )}
        </div>
        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2 border-t">
          {product.discountPrice ? (
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
