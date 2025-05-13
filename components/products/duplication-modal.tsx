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
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"
import { Plus, Trash, ArrowRight, Info } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Import the new components and utilities
import { DiscountInput } from "@/components/ui/discount-input"
import { DecimalInput } from "@/components/ui/decimal-input"
import { calculateSellingPrice } from "@/lib/price-utils"

interface DuplicationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: any
  onDuplicate: (options: DuplicationOptions) => Promise<void>
  onCancel: () => void
}

export interface DuplicationOptions {
  createSizeVariations: boolean
  sizeVariations?: SizeVariation[]
  applySameDiscount: boolean
  applySamePrice: boolean
  applySameStock: boolean
  customDiscountPercentage?: number
  customSellingPrice?: number
  customPrice?: number
  customStock?: number
}

interface SizeVariation {
  size: string
  discountPercentage: number
  sellingPrice: number
  price: number
  stock: number
}

export function DuplicationModal({ open, onOpenChange, product, onDuplicate, onCancel }: DuplicationModalProps) {
  const [step, setStep] = useState(1)
  const [createSizeVariations, setCreateSizeVariations] = useState(false)
  const [sizeVariations, setSizeVariations] = useState<SizeVariation[]>([])
  const [applySameDiscount, setApplySameDiscount] = useState(true)
  const [applySamePrice, setApplySamePrice] = useState(true)
  const [applySameStock, setApplySameStock] = useState(true)
  const [customDiscountPercentage, setCustomDiscountPercentage] = useState(0)
  const [customSellingPrice, setCustomSellingPrice] = useState(0)
  const [customPrice, setCustomPrice] = useState(0)
  const [customStock, setCustomStock] = useState(0)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // Calculate the original product's discount percentage
  const originalPrice = product?.originalPrice || product?.price || 0
  const currentPrice = product?.price || 0
  const originalStock = product?.stock || 0
  const originalDiscountPercentage =
    originalPrice > currentPrice ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : 0

  useEffect(() => {
    if (open) {
      // Reset state when modal opens
      setStep(1)
      setCreateSizeVariations(false)
      setSizeVariations([])
      setApplySameDiscount(true)
      setApplySamePrice(true)
      setApplySameStock(true)
      setCustomDiscountPercentage(originalDiscountPercentage)
      setCustomSellingPrice(currentPrice)
      setCustomPrice(originalPrice)
      setCustomStock(originalStock)
    }
  }, [open, originalDiscountPercentage, currentPrice, originalPrice, originalStock])

  const handleClose = () => {
    onOpenChange(false)
    onCancel()
  }

  const handleSizeVariationChoice = (choice: boolean) => {
    setCreateSizeVariations(choice)
    if (choice) {
      // If creating size variations, add an initial empty size
      setSizeVariations([
        {
          size: "",
          discountPercentage: applySameDiscount ? originalDiscountPercentage : 0,
          sellingPrice: calculateSellingPrice(originalPrice, applySameDiscount ? originalDiscountPercentage : 0),
          price: applySamePrice ? originalPrice : 0,
          stock: applySameStock ? originalStock : 0,
        },
      ])
      setStep(2)
    } else {
      // If not creating size variations, go to the combined confirmation step
      setStep(3)
    }
  }

  const addSizeVariation = () => {
    setSizeVariations([
      ...sizeVariations,
      {
        size: "",
        discountPercentage: applySameDiscount ? originalDiscountPercentage : 0,
        sellingPrice: calculateSellingPrice(originalPrice, applySameDiscount ? originalDiscountPercentage : 0),
        price: applySamePrice ? originalPrice : 0,
        stock: applySameStock ? originalStock : 0,
      },
    ])
  }

  const removeSizeVariation = (index: number) => {
    setSizeVariations(sizeVariations.filter((_, i) => i !== index))
  }

  // Update the updateSizeVariation function to handle more precise calculations
  const updateSizeVariation = (index: number, field: keyof SizeVariation, value: string | number) => {
    const updatedVariations = [...sizeVariations]
    const numValue = typeof value === "string" ? Number.parseFloat(value) || 0 : value

    if (field === "size") {
      updatedVariations[index].size = value as string
    } else if (field === "discountPercentage") {
      updatedVariations[index].discountPercentage = numValue

      // Update selling price based on discount and current price
      if (!applySameDiscount) {
        const variationPrice = applySamePrice ? originalPrice : updatedVariations[index].price
        const calculatedSellingPrice = calculateSellingPrice(variationPrice, numValue)
        updatedVariations[index].sellingPrice = calculatedSellingPrice
      }
    } else if (field === "sellingPrice") {
      updatedVariations[index].sellingPrice = numValue

      // Update discount percentage based on selling price and current price
      if (!applySameDiscount) {
        const variationPrice = applySamePrice ? originalPrice : updatedVariations[index].price
        const calculatedDiscount = calculateDiscountPercentage(variationPrice, numValue)
        updatedVariations[index].discountPercentage = calculatedDiscount
      }
    } else if (field === "price") {
      updatedVariations[index].price = numValue

      // If price changes and we're not applying same discount, recalculate selling price
      if (!applySameDiscount) {
        const calculatedSellingPrice = calculateSellingPrice(numValue, updatedVariations[index].discountPercentage)
        updatedVariations[index].sellingPrice = calculatedSellingPrice
      }
    } else if (field === "stock") {
      updatedVariations[index].stock = numValue
    }

    setSizeVariations(updatedVariations)
  }

  const handleApplySameDiscountChange = (checked: boolean) => {
    setApplySameDiscount(checked)

    if (checked) {
      // Apply original discount to all variations
      const updatedVariations = sizeVariations.map((variation) => {
        const variationPrice = applySamePrice ? originalPrice : variation.price
        return {
          ...variation,
          discountPercentage: originalDiscountPercentage,
          sellingPrice: calculateSellingPrice(variationPrice, originalDiscountPercentage),
        }
      })
      setSizeVariations(updatedVariations)
    }
  }

  const handleApplySamePriceChange = (checked: boolean) => {
    setApplySamePrice(checked)

    if (checked) {
      // Apply original price to all variations
      const updatedVariations = sizeVariations.map((variation) => {
        const newVariation = {
          ...variation,
          price: originalPrice,
        }

        // If we're also applying the same discount, update the selling price
        if (applySameDiscount) {
          newVariation.sellingPrice = calculateSellingPrice(originalPrice, originalDiscountPercentage)
        } else {
          newVariation.sellingPrice = calculateSellingPrice(originalPrice, variation.discountPercentage)
        }

        return newVariation
      })
      setSizeVariations(updatedVariations)
    }
  }

  const handleApplySameStockChange = (checked: boolean) => {
    setApplySameStock(checked)

    if (checked) {
      // Apply original stock to all variations
      const updatedVariations = sizeVariations.map((variation) => ({
        ...variation,
        stock: originalStock,
      }))
      setSizeVariations(updatedVariations)
    }
  }

  // Combined handler for standard duplication choices
  const handleStandardDuplicationChoice = (useSameValues: boolean) => {
    if (useSameValues) {
      // If using same values for everything, use original values
      setApplySameDiscount(true)
      setApplySamePrice(true)
      setApplySameStock(true)
      setCustomDiscountPercentage(originalDiscountPercentage)
      setCustomSellingPrice(currentPrice)
      setCustomPrice(originalPrice)
      setCustomStock(originalStock)
      handleSubmit()
    } else {
      // If not using same values, go to custom values step
      setStep(4)
    }
  }

  // Replace the calculateSellingPrice function
  const calculateSellingPrice = (price: number, discountPercentage: number) => {
    if (discountPercentage <= 0) return price
    return Math.round(price - (price * discountPercentage) / 100)
  }

  // Replace the calculateDiscountPercentage function
  const calculateDiscountPercentage = (originalPrice: number, sellingPrice: number) => {
    if (sellingPrice >= originalPrice) return 0
    const discountAmount = originalPrice - sellingPrice
    return (discountAmount / originalPrice) * 100
  }

  // Update the updateCustomDiscountPercentage function
  const updateCustomDiscountPercentage = (value: string) => {
    const discount = Number.parseFloat(value) || 0
    setCustomDiscountPercentage(discount)
    const calculatedSellingPrice = calculateSellingPrice(customPrice, discount)
    setCustomSellingPrice(calculatedSellingPrice)
  }

  // Update the updateCustomSellingPrice function
  const updateCustomSellingPrice = (value: string) => {
    const price = Number.parseFloat(value) || 0
    setCustomSellingPrice(price)
    const calculatedDiscount = calculateDiscountPercentage(customPrice, price)
    setCustomDiscountPercentage(calculatedDiscount)
  }

  const updateCustomPrice = (value: string) => {
    const price = Number(value) || 0
    setCustomPrice(price)
    // Recalculate selling price based on the new price and current discount
    setCustomSellingPrice(calculateSellingPrice(price, customDiscountPercentage))
  }

  const validateSizeVariations = () => {
    // Check if any size field is empty
    const emptySizes = sizeVariations.some((variation) => !variation.size.trim())
    if (emptySizes) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "All size fields must be filled in.",
      })
      return false
    }

    // Check for duplicate sizes
    const sizes = sizeVariations.map((v) => v.size.trim().toLowerCase())
    const uniqueSizes = new Set(sizes)
    if (sizes.length !== uniqueSizes.size) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Each size variation must have a unique size.",
      })
      return false
    }

    // Validate price and stock values
    const invalidValues = sizeVariations.some((v) => v.price <= 0 || v.stock < 0)
    if (invalidValues) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Price must be greater than zero and stock must be a non-negative number.",
      })
      return false
    }

    return true
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)

      // Validate size variations if creating them
      if (createSizeVariations && !validateSizeVariations()) {
        setLoading(false)
        return
      }

      const options: DuplicationOptions = {
        createSizeVariations,
        applySameDiscount,
        applySamePrice,
        applySameStock,
        customDiscountPercentage,
        customSellingPrice,
        customPrice,
        customStock,
      }

      if (createSizeVariations) {
        options.sizeVariations = sizeVariations
      }

      await onDuplicate(options)
      onOpenChange(false)
    } catch (error) {
      console.error("Error in duplication process:", error)
      toast({
        variant: "destructive",
        title: "Duplication Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
      })
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] w-[95vw] p-0 gap-0 overflow-hidden">
        <div className="flex flex-col h-full max-h-[90vh]">
          <DialogHeader className="p-4 pb-2 border-b">
            <DialogTitle>
              {step === 1 && "Duplicate Product"}
              {step === 2 && "Create Size Variations"}
              {step === 3 && "Standard Duplication"}
              {step === 4 && "Set Custom Values"}
            </DialogTitle>
            <DialogDescription>
              {step === 1 && "Would you like to create size variations of this product?"}
              {step === 2 && "Add multiple sizes for this product. Each size can have its own pricing and stock."}
              {step === 3 && "Would you like to use the same values as the original product?"}
              {step === 4 && "Specify custom values for the duplicated product."}
            </DialogDescription>
          </DialogHeader>

          {/* Main content area with native scrolling */}
          <div
            className="flex-grow overflow-y-auto p-4 pt-2"
            style={{
              overflowY: "auto",
              WebkitOverflowScrolling: "touch",
              maxHeight: "calc(90vh - 130px)", // Adjust based on header and footer height
            }}
          >
            {step === 1 && (
              <div className="py-2">
                <p className="mb-3 text-sm">
                  <strong className="text-base">{product?.name}</strong> can be duplicated as:
                </p>
                <div className="grid grid-cols-1 gap-3">
                  <Card
                    className="p-3 border-2 hover:border-primary cursor-pointer"
                    onClick={() => handleSizeVariationChoice(true)}
                  >
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5 h-4 w-4 flex-shrink-0 flex items-center justify-center rounded-full border-2 border-primary">
                        {createSizeVariations && <div className="h-2 w-2 rounded-full bg-primary"></div>}
                      </div>
                      <div>
                        <h3 className="font-medium text-sm">Size Variations</h3>
                        <p className="text-xs text-muted-foreground">
                          Create multiple variations with different sizes, each with its own pricing and stock.
                        </p>
                      </div>
                    </div>
                  </Card>
                  <Card
                    className="p-3 border-2 hover:border-primary cursor-pointer"
                    onClick={() => handleSizeVariationChoice(false)}
                  >
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5 h-4 w-4 flex-shrink-0 flex items-center justify-center rounded-full border-2 border-primary">
                        {!createSizeVariations && <div className="h-2 w-2 rounded-full bg-primary"></div>}
                      </div>
                      <div>
                        <h3 className="font-medium text-sm">Standard Duplicate</h3>
                        <p className="text-xs text-muted-foreground">
                          Create a single copy of this product with the same attributes.
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="py-2 space-y-3">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="applySameDiscount"
                      checked={applySameDiscount}
                      onCheckedChange={handleApplySameDiscountChange}
                    />
                    <Label htmlFor="applySameDiscount" className="text-xs font-medium">
                      Apply same discount ({originalDiscountPercentage}%) to all variations
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="applySamePrice"
                      checked={applySamePrice}
                      onCheckedChange={handleApplySamePriceChange}
                    />
                    <Label htmlFor="applySamePrice" className="text-xs font-medium">
                      Apply same price ({formatPrice(originalPrice)}) to all variations
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="applySameStock"
                      checked={applySameStock}
                      onCheckedChange={handleApplySameStockChange}
                    />
                    <Label htmlFor="applySameStock" className="text-xs font-medium">
                      Apply same stock ({originalStock}) to all variations
                    </Label>
                  </div>
                </div>

                {/* Original product price info */}
                <Card className="p-2 bg-muted/50">
                  <div className="text-xs">
                    <div className="flex justify-between mb-1">
                      <span className="text-muted-foreground">Original Product:</span>
                      <span className="font-medium">{product?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Price (MRP):</span>
                      <span>{formatPrice(originalPrice)}</span>
                    </div>
                    {originalDiscountPercentage > 0 && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Discount:</span>
                          <Badge variant="outline" className="bg-orange-500/10 text-orange-600 text-[10px] h-5">
                            {originalDiscountPercentage}% OFF
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Selling Price:</span>
                          <span className="font-medium">{formatPrice(currentPrice)}</span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Stock:</span>
                      <span>{originalStock} units</span>
                    </div>
                  </div>
                </Card>

                <div className="space-y-3">
                  {sizeVariations.map((variation, index) => (
                    <div key={index} className="space-y-2 p-2 border rounded-md">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor={`size-${index}`} className="text-xs mb-1 inline-block">
                            Size *
                          </Label>
                          <Input
                            id={`size-${index}`}
                            value={variation.size}
                            onChange={(e) => updateSizeVariation(index, "size", e.target.value)}
                            placeholder="e.g. S, M, L"
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`stock-${index}`} className="text-xs mb-1 inline-block">
                            Stock
                          </Label>
                          <Input
                            id={`stock-${index}`}
                            type="number"
                            min="0"
                            value={variation.stock}
                            onChange={(e) => updateSizeVariation(index, "stock", e.target.value)}
                            disabled={applySameStock}
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <div className="flex items-center mb-1">
                            <Label htmlFor={`price-${index}`} className="text-xs">
                              Price (MRP)
                            </Label>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="h-3 w-3 ml-1 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent side="top" className="text-xs max-w-[200px]">
                                  Original price before any discounts
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <Input
                            id={`price-${index}`}
                            type="number"
                            min="1"
                            value={variation.price}
                            onChange={(e) => updateSizeVariation(index, "price", e.target.value)}
                            disabled={applySamePrice}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <div className="flex items-center mb-1">
                            <Label htmlFor={`discount-${index}`} className="text-xs">
                              Discount %
                            </Label>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="h-3 w-3 ml-1 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent side="top" className="text-xs max-w-[200px]">
                                  Percentage discount off the price
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <DiscountInput
                            id={`discount-${index}`}
                            min={0}
                            max={99.999999}
                            value={variation.discountPercentage.toString()}
                            onChange={(value) => updateSizeVariation(index, "discountPercentage", value)}
                            disabled={applySameDiscount}
                            className="h-8 text-sm pr-6"
                          />
                        </div>
                        <div>
                          <div className="flex items-center mb-1">
                            <Label htmlFor={`selling-${index}`} className="text-xs">
                              Selling Price
                            </Label>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="h-3 w-3 ml-1 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent side="top" className="text-xs max-w-[200px]">
                                  Final price after discount
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <DecimalInput
                            id={`selling-${index}`}
                            min={1}
                            value={variation.sellingPrice.toString()}
                            onChange={(value) => updateSizeVariation(index, "sellingPrice", value)}
                            disabled={applySameDiscount}
                            className="h-8 text-sm"
                            decimalPlaces={2}
                          />
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="text-xs text-muted-foreground flex items-center">
                          <span className="line-through">{formatPrice(variation.price)}</span>
                          <ArrowRight className="h-3 w-3 mx-1" />
                          <span className="font-medium text-green-600">{formatPrice(variation.sellingPrice)}</span>
                          <span className="ml-1 text-green-600">({variation.discountPercentage}% off)</span>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSizeVariation(index)}
                          disabled={sizeVariations.length <= 1}
                          className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={addSizeVariation}
                  className="w-full"
                  disabled={sizeVariations.length >= 10}
                >
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  <span className="text-xs">Add Another Size</span>
                </Button>
              </div>
            )}

            {step === 3 && (
              <div className="py-2">
                <Card className="p-2 bg-muted/50 mb-3">
                  <div className="text-xs">
                    <div className="flex justify-between mb-1">
                      <span className="text-muted-foreground">Original Product:</span>
                      <span className="font-medium">{product?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Price (MRP):</span>
                      <span>{formatPrice(originalPrice)}</span>
                    </div>
                    {originalDiscountPercentage > 0 && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Discount:</span>
                          <Badge variant="outline" className="bg-orange-500/10 text-orange-600 text-[10px] h-5">
                            {originalDiscountPercentage}% OFF
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Selling Price:</span>
                          <span className="font-medium">{formatPrice(currentPrice)}</span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Stock:</span>
                      <span>{originalStock} units</span>
                    </div>
                  </div>
                </Card>

                <div className="grid grid-cols-1 gap-3">
                  <Button
                    size="sm"
                    onClick={() => handleStandardDuplicationChoice(true)}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <span className="text-xs">Yes, use same price, discount, and stock</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStandardDuplicationChoice(false)}
                    disabled={loading}
                  >
                    <span className="text-xs">No, I want to set custom values</span>
                  </Button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="py-2 space-y-3">
                <Card className="p-2 bg-muted/50">
                  <div className="flex flex-col space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-muted-foreground">Original Price (MRP):</span>
                      <span className="text-xs font-semibold">{formatPrice(originalPrice)}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-muted-foreground">Original Stock:</span>
                      <span className="text-xs font-semibold">{originalStock} units</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-muted-foreground flex items-center">
                        New Price (MRP):
                      </span>
                      <span className="text-xs font-semibold">{formatPrice(customPrice)}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-muted-foreground flex items-center">Discount:</span>
                      <Badge variant="outline" className="bg-orange-500/10 text-orange-600 text-[10px] h-5">
                        {customDiscountPercentage}% OFF
                      </Badge>
                    </div>

                    <div className="flex justify-between items-center pt-1.5 border-t">
                      <span className="text-xs font-medium text-muted-foreground flex items-center">
                        Selling Price:
                      </span>
                      <span className="text-xs font-bold text-green-600">{formatPrice(customSellingPrice)}</span>
                    </div>

                    <div className="flex items-center justify-center mt-1 text-xs text-muted-foreground">
                      <span className="line-through">{formatPrice(customPrice)}</span>
                      <ArrowRight className="h-3 w-3 mx-1" />
                      <span className="font-medium text-green-600">{formatPrice(customSellingPrice)}</span>
                    </div>
                  </div>
                </Card>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="customPrice" className="text-xs font-medium">
                      Price (MRP)
                    </Label>
                    <Input
                      id="customPrice"
                      type="number"
                      min="1"
                      step="1"
                      value={customPrice}
                      onChange={(e) => updateCustomPrice(e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="discountPercentage" className="text-xs font-medium">
                      Discount Percentage
                    </Label>
                    <div className="relative">
                      <DiscountInput
                        id="discountPercentage"
                        min={0}
                        max={99.999999}
                        value={customDiscountPercentage.toString()}
                        onChange={(value) => updateCustomDiscountPercentage(value)}
                        className="pr-6 h-8 text-sm"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="sellingPrice" className="text-xs font-medium">
                      Selling Price
                    </Label>
                    <DecimalInput
                      id="sellingPrice"
                      min={1}
                      value={customSellingPrice.toString()}
                      onChange={(value) => updateCustomSellingPrice(value)}
                      className="h-8 text-sm"
                      decimalPlaces={2}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="customStock" className="text-xs font-medium">
                      Stock
                    </Label>
                    <Input
                      id="customStock"
                      type="number"
                      min="0"
                      step="1"
                      value={customStock}
                      onChange={(e) => setCustomStock(Number(e.target.value) || 0)}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="p-4 pt-2 border-t mt-auto">
            {step === 1 && (
              <Button variant="outline" size="sm" onClick={handleClose} className="text-xs">
                Cancel
              </Button>
            )}

            {step === 2 && (
              <>
                <Button variant="outline" size="sm" onClick={() => setStep(1)} className="text-xs">
                  Back
                </Button>
                <Button size="sm" onClick={handleSubmit} disabled={loading} className="text-xs">
                  {loading ? "Processing..." : "Create Size Variations"}
                </Button>
              </>
            )}

            {step === 3 && (
              <Button variant="outline" size="sm" onClick={() => setStep(1)} className="text-xs">
                Back
              </Button>
            )}

            {step === 4 && (
              <>
                <Button variant="outline" size="sm" onClick={() => setStep(3)} className="text-xs">
                  Back
                </Button>
                <Button size="sm" onClick={handleSubmit} disabled={loading} className="text-xs">
                  {loading ? "Processing..." : "Create with Custom Values"}
                </Button>
              </>
            )}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
