"use client"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { AlertCircle } from "lucide-react"
import { formatPriceValue, formatPriceDisplay } from "@/lib/price-utils"

interface PriceDiscountFieldsProps {
  originalPrice: string
  discountPercentage: string
  sellingPrice: string
  errors: Record<string, string | null>
  touched: Record<string, boolean>
  isSubmitAttempted: boolean
  onOriginalPriceChange: (value: string) => void
  onDiscountPercentageChange: (value: string) => void
  onSellingPriceChange: (value: string) => void
  onBlur: (fieldName: string, value: string) => void
  readonly?: boolean
}

export function PriceDiscountFields({
  originalPrice,
  discountPercentage,
  sellingPrice,
  errors,
  touched,
  isSubmitAttempted,
  onOriginalPriceChange,
  onDiscountPercentageChange,
  onSellingPriceChange,
  onBlur,
  readonly = false,
}: PriceDiscountFieldsProps) {
  // Helper function to calculate selling price based on price and discount
  // const calculateSellingPrice = (price: string, discount: string): string => {
  //   if (!price || isNaN(Number(price))) return ""
  //   const numPrice = Number.parseFloat(price)
  //   const numDiscount = Number.parseFloat(discount || "0")

  //   if (isNaN(numPrice) || isNaN(numDiscount)) return ""
  //   if (numPrice <= 0) return "0.00"

  //   // Ensure discount is between 0 and 100
  //   const validDiscount = Math.max(0, Math.min(100, numDiscount))

  //   // Calculate with precision
  //   const discountAmount = (numPrice * validDiscount) / 100
  //   const calculatedSellingPrice = numPrice - discountAmount

  //   // Return formatted to 2 decimal places
  //   return calculatedSellingPrice.toFixed(2)
  // }

  // Format price for display
  const formatPrice = (price: string): string => {
    return formatPriceDisplay(price)
  }

  // Helper functions for styling
  const getInputStatus = (fieldName: string) => {
    if (errors[fieldName]) return "error"
    if (touched[fieldName] && !errors[fieldName]) return "success"
    return "default"
  }

  const renderInputStatusIcon = (status: string) => {
    if (status === "error") return <AlertCircle className="h-4 w-4 text-destructive" />
    if (status === "success") return <AlertCircle className="h-4 w-4 text-green-500" />
    return null
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center">
          <Label htmlFor="original-price" className={errors.price ? "text-destructive" : ""}>
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
            id="original-price"
            name="price"
            type="number"
            min="0"
            step="0.01"
            value={originalPrice}
            onChange={(e) => onOriginalPriceChange(e.target.value)}
            onBlur={(e) => {
              // Format the value to 2 decimal places on blur
              if (e.target.value) {
                onOriginalPriceChange(formatPriceValue(e.target.value))
              }
              onBlur("price", e.target.value)
            }}
            className={`${
              errors.price ? "border-destructive pr-10" : touched.price && !errors.price ? "border-green-500 pr-10" : ""
            }`}
            disabled={readonly}
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
            <Label htmlFor="discount" className={errors.discountPercentage ? "text-destructive" : ""}>
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
              id="discountPercentage"
              name="discountPercentage"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={discountPercentage || "0"}
              onChange={(e) => onDiscountPercentageChange(e.target.value)}
              onBlur={(e) => onBlur("discountPercentage", e.target.value)}
              className={`pr-6 ${
                errors.discountPercentage
                  ? "border-destructive pr-10"
                  : touched.discountPercentage && !errors.discountPercentage
                    ? "border-green-500 pr-10"
                    : ""
              }`}
              disabled={readonly}
              aria-invalid={errors.discountPercentage ? "true" : "false"}
              aria-describedby={errors.discountPercentage ? "discountPercentage-error" : undefined}
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
            {(touched.discountPercentage || isSubmitAttempted) && (
              <div className="absolute inset-y-0 right-6 flex items-center pointer-events-none">
                {renderInputStatusIcon(getInputStatus("discountPercentage"))}
              </div>
            )}
          </div>
          {errors.discountPercentage && (
            <p id="discountPercentage-error" className="text-sm font-medium text-destructive flex items-center mt-1">
              <AlertCircle className="h-3.5 w-3.5 mr-1" />
              {errors.discountPercentage}
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
              value={sellingPrice}
              onChange={(e) => onSellingPriceChange(e.target.value)}
              onBlur={(e) => {
                // Format the value to 2 decimal places on blur
                if (e.target.value) {
                  onSellingPriceChange(formatPriceValue(e.target.value))
                }
                onBlur("sellingPrice", e.target.value)
              }}
              className={`${
                errors.sellingPrice
                  ? "border-destructive pr-10"
                  : touched.sellingPrice && !errors.sellingPrice
                    ? "border-green-500 pr-10"
                    : ""
              }`}
              disabled={readonly}
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
            <p id="sellingPrice-error" className="text-sm font-medium text-destructive flex items-center mt-1">
              <AlertCircle className="h-3.5 w-3.5 mr-1" />
              {errors.sellingPrice}
            </p>
          )}
        </div>
      </div>

      {/* Price summary with visual indicator */}
      {originalPrice && (
        <div className="mt-2 p-3 bg-muted/40 rounded-md">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Original Price:</span>
              <span
                className={`font-medium ${Number(discountPercentage) > 0 ? "line-through text-muted-foreground" : ""}`}
              >
                {formatPrice(originalPrice)}
              </span>
            </div>

            {Number(discountPercentage) > 0 && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Discount Applied:</span>
                  <Badge className="bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 font-medium">
                    {discountPercentage}% OFF
                  </Badge>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-border/50">
                  <span className="text-sm text-muted-foreground">Final Selling Price:</span>
                  <span className="font-medium text-green-600">{formatPrice(sellingPrice)}</span>
                </div>

                <div className="text-xs text-muted-foreground mt-1">
                  Customers will see the original price crossed out with the discounted price.
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
