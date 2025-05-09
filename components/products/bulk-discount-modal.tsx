"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Progress } from "@/components/ui/progress"
import { Check, X } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { fetchApi } from "@/lib/api"

export function BulkDiscountModal({ open, onOpenChange, selectedProducts, onSuccess }) {
  const [discountType, setDiscountType] = useState("percentage")
  const [discountPercentage, setDiscountPercentage] = useState("10")
  const [isApplying, setIsApplying] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0, success: 0, failed: 0 })
  const [errors, setErrors] = useState([])

  const { toast } = useToast()

  const resetState = () => {
    setDiscountType("percentage")
    setDiscountPercentage("10")
    setIsApplying(false)
    setProgress({ current: 0, total: 0, success: 0, failed: 0 })
    setErrors([])
  }

  const handleOpenChange = (open) => {
    if (!open) {
      resetState()
    }
    onOpenChange(open)
  }

  const applyDiscountToProduct = async (productId, discountPercentage) => {
    try {
      const discountData = {
        productId: productId,
        discountPercentage: discountPercentage.toString(),
      }

      const response = await fetchApi("/api/v1/admin/product/add-discount", {
        method: "POST",
        body: JSON.stringify(discountData),
      })

      return { success: true, data: response }
    } catch (error) {
      console.error("Failed to apply discount:", error)
      throw new Error(`Failed to apply discount: ${error.message || "Unknown error"}`)
    }
  }

  const removeDiscountFromProduct = async (productId) => {
    try {
      const data = {
        productId: productId,
      }

      const response = await fetchApi("/api/v1/admin/product/remove-discount", {
        method: "POST",
        body: JSON.stringify(data),
      })

      return { success: true, data: response }
    } catch (error) {
      console.error("Failed to remove discount:", error)
      throw new Error(`Failed to remove discount: ${error.message || "Unknown error"}`)
    }
  }

  const handleApplyDiscount = async () => {
    if (
      discountType === "percentage" &&
      (isNaN(Number(discountPercentage)) || Number(discountPercentage) <= 0 || Number(discountPercentage) >= 100)
    ) {
      toast({
        variant: "destructive",
        title: "Invalid discount",
        description: "Please enter a valid discount percentage between 1 and 99.",
      })
      return
    }

    try {
      setIsApplying(true)
      const total = selectedProducts.length
      let success = 0
      let failed = 0
      const newErrors = []

      setProgress({
        current: 0,
        total,
        success: 0,
        failed: 0,
      })

      // Create a copy of selected products to avoid race conditions
      const productsToUpdate = [...selectedProducts]

      for (let i = 0; i < productsToUpdate.length; i++) {
        const productId = productsToUpdate[i]

        try {
          // Update progress
          setProgress((prev) => ({
            ...prev,
            current: i + 1,
          }))

          if (discountType === "percentage") {
            // Apply discount
            await applyDiscountToProduct(productId, discountPercentage)
          } else {
            // Remove discount
            await removeDiscountFromProduct(productId)
          }

          // Increment success count
          success++
          setProgress((prev) => ({
            ...prev,
            success,
          }))
        } catch (error) {
          // Handle error for this product
          failed++
          setProgress((prev) => ({
            ...prev,
            failed,
          }))

          // Store the error
          newErrors.push({
            productId,
            error: error.message || `Failed to ${discountType === "percentage" ? "apply" : "remove"} discount`,
          })
        }
      }

      // Store any errors for display
      setErrors(newErrors)

      // Show toast with summary
      if (newErrors.length === 0) {
        toast({
          title: "Success",
          description:
            discountType === "percentage"
              ? `Successfully applied ${discountPercentage}% discount to ${success} products`
              : `Successfully removed discounts from ${success} products`,
        })

        // Close the modal and refresh the product list
        setTimeout(() => {
          handleOpenChange(false)
          if (onSuccess) onSuccess()
        }, 1500)
      } else {
        toast({
          variant: "destructive",
          title: "Partial Success",
          description:
            discountType === "percentage"
              ? `Applied discount to ${success} products. Failed for ${failed} products.`
              : `Removed discount from ${success} products. Failed for ${failed} products.`,
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: discountType === "percentage" ? "Failed to apply discounts" : "Failed to remove discounts",
      })
    } finally {
      setIsApplying(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Bulk Discount Management</DialogTitle>
          <DialogDescription>
            Apply or remove discounts for {selectedProducts.length} selected products.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <RadioGroup value={discountType} onValueChange={setDiscountType} className="grid grid-cols-1 gap-4">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="percentage" id="percentage" />
              <Label htmlFor="percentage" className="font-medium">
                Apply percentage discount
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <RadioGroupItem value="remove" id="remove" />
              <Label htmlFor="remove" className="font-medium">
                Remove all discounts
              </Label>
            </div>
          </RadioGroup>

          {discountType === "percentage" && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="discountPercentage" className="text-right col-span-1">
                Discount %
              </Label>
              <div className="col-span-3">
                <Input
                  id="discountPercentage"
                  type="number"
                  min="1"
                  max="99"
                  value={discountPercentage}
                  onChange={(e) => setDiscountPercentage(e.target.value)}
                  className="w-20"
                />
              </div>
            </div>
          )}

          {isApplying && (
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span>
                  {discountType === "percentage" ? `Applying ${discountPercentage}% discount` : "Removing discounts"}(
                  {progress.current} of {progress.total})
                </span>
                <span>
                  <span className="text-green-600 mr-3">
                    <Check className="h-4 w-4 inline-block mr-1" />
                    {progress.success}
                  </span>
                  <span className="text-red-600">
                    <X className="h-4 w-4 inline-block mr-1" />
                    {progress.failed}
                  </span>
                </span>
              </div>
              <Progress value={(progress.current / progress.total) * 100} className="h-2" />

              {errors.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-red-600">Failed operations:</p>
                  <div className="mt-1 max-h-24 overflow-y-auto text-xs">
                    {errors.map((error, index) => (
                      <div key={index} className="py-1">
                        {error.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isApplying}>
            Cancel
          </Button>
          {discountType === "percentage" ? (
            <Button onClick={handleApplyDiscount} disabled={isApplying} className="bg-orange-600 hover:bg-orange-700">
              Apply Discount
            </Button>
          ) : (
            <Button onClick={handleApplyDiscount} disabled={isApplying} variant="destructive">
              Remove All Discounts
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
