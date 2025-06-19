"use client"

import type React from "react"

import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Search, X, Package, ChevronDown, ChevronRight, Check } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { getProductImageUrl } from "@/lib/image-url-helper"

interface ProductVariant {
  _id: string
  name: string
  price?: number
  originalPrice?: number
  sellingPrice?: number
  image?: string
  images?: string[]
  category?: { name: string; _id?: string } | string
  size?: string
  grade?: { name: string; _id?: string } | string
  material?: { name: string; _id?: string } | string
  stock?: number
}

interface ProductGroup {
  key: string
  name: string
  category: string
  categoryId: string
  image?: string
  variants: ProductVariant[]
}

interface CouponProductSelectorProps {
  products: ProductVariant[]
  selectedProductIds: string[]
  onChange: (selectedIds: string[]) => void
  error?: string
}

export function CouponProductSelector({ products, selectedProductIds, onChange, error }: CouponProductSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})
  const [imageLoadErrors, setImageLoadErrors] = useState<Record<string, boolean>>({})

  // Helper functions - moved to top before useMemo
  const getCategoryName = (product: ProductVariant): string => {
    if (!product.category) return "Uncategorized"
    if (typeof product.category === "string") return product.category
    if (typeof product.category === "object" && product.category.name) return product.category.name
    return "Uncategorized"
  }

  const getCategoryId = (product: ProductVariant): string => {
    if (typeof product.category === "object" && product.category._id) return product.category._id
    return ""
  }

  const getVariantPrice = (variant: ProductVariant): number => {
    return variant.sellingPrice || variant.price || variant.originalPrice || 0
  }

  const getVariantDisplayInfo = (variant: ProductVariant) => {
    const info = []

    if (variant.size) {
      info.push(`Size: ${variant.size}`)
    }

    if (variant.grade) {
      const gradeName = typeof variant.grade === "object" ? variant.grade.name : variant.grade
      if (gradeName) info.push(`Grade: ${gradeName}`)
    }

    if (variant.material) {
      const materialName = typeof variant.material === "object" ? variant.material.name : variant.material
      if (materialName) info.push(`Material: ${materialName}`)
    }

    return info.length > 0 ? info.join(" • ") : "Standard Variant"
  }

  // Group products by name and category
  const productGroups = useMemo(() => {
    const groups: Record<string, ProductGroup> = {}

    if (Array.isArray(products)) {
      products.forEach((product) => {
        const categoryName = getCategoryName(product)
        const categoryId = getCategoryId(product)
        const key = `${product.name}|${categoryName}`

        if (!groups[key]) {
          groups[key] = {
            key,
            name: product.name,
            category: categoryName,
            categoryId,
            image: getProductImageUrl(product),
            variants: [],
          }
        }

        groups[key].variants.push(product)
      })

      // Sort variants within each group by size
      Object.values(groups).forEach((group) => {
        group.variants.sort((a, b) => {
          const sizeA = a.size || "No Size"
          const sizeB = b.size || "No Size"
          return sizeA.localeCompare(sizeB)
        })
      })

      return Object.values(groups).sort((a, b) => a.name.localeCompare(b.name))
    } else {
      console.warn("CouponProductSelector: products prop is not an array:", products)
      return []
    }
  }, [products])

  // Validate products prop
  const isValidProductData = Array.isArray(products)

  const filteredGroups = useMemo(() => {
    if (!isValidProductData) return []

    if (!searchTerm) return productGroups

    return productGroups.filter(
      (group) =>
        group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.variants.some((variant) => variant.size && variant.size.toLowerCase().includes(searchTerm.toLowerCase())),
    )
  }, [productGroups, searchTerm, isValidProductData])

  // Get selected groups for the selected tab
  const selectedGroups = useMemo(() => {
    return productGroups
      .filter((group) => group.variants.some((variant) => selectedProductIds.includes(variant._id)))
      .map((group) => ({
        ...group,
        variants: group.variants.filter((variant) => selectedProductIds.includes(variant._id)),
      }))
  }, [productGroups, selectedProductIds])

  // Check if all variants of a group are selected
  const isGroupFullySelected = (group: ProductGroup): boolean => {
    return group.variants.every((variant) => selectedProductIds.includes(variant._id))
  }

  // Check if some variants of a group are selected
  const isGroupPartiallySelected = (group: ProductGroup): boolean => {
    const selectedCount = group.variants.filter((variant) => selectedProductIds.includes(variant._id)).length
    return selectedCount > 0 && selectedCount < group.variants.length
  }

  // Toggle group selection (all variants)
  const toggleGroupSelection = (group: ProductGroup) => {
    const groupVariantIds = group.variants.map((variant) => variant._id)

    if (isGroupFullySelected(group)) {
      // Deselect all variants in the group
      onChange(selectedProductIds.filter((id) => !groupVariantIds.includes(id)))
    } else {
      // Select all variants in the group
      const newSelectedIds = [...selectedProductIds]
      groupVariantIds.forEach((id) => {
        if (!newSelectedIds.includes(id)) {
          newSelectedIds.push(id)
        }
      })
      onChange(newSelectedIds)
    }
  }

  // Toggle individual variant selection
  const toggleVariantSelection = (variantId: string) => {
    if (selectedProductIds.includes(variantId)) {
      onChange(selectedProductIds.filter((id) => id !== variantId))
    } else {
      onChange([...selectedProductIds, variantId])
    }
  }

  // Toggle group expansion
  const toggleGroupExpansion = (groupKey: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setExpandedGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }))
  }

  // Select all products
  const handleSelectAll = () => {
    onChange(products.map((product) => product._id))
  }

  // Clear all selections
  const handleClearAll = () => {
    onChange([])
  }

  // Handle image load error
  const handleImageError = (productId: string) => {
    setImageLoadErrors((prev) => ({
      ...prev,
      [productId]: true,
    }))
  }

  // Auto-expand groups with selected variants
  useEffect(() => {
    const newExpandedGroups: Record<string, boolean> = {}

    productGroups.forEach((group) => {
      if (group.variants.some((variant) => selectedProductIds.includes(variant._id))) {
        newExpandedGroups[group.key] = true
      }
    })

    setExpandedGroups((prev) => ({
      ...prev,
      ...newExpandedGroups,
    }))
  }, [productGroups, selectedProductIds])

  if (!isValidProductData) {
    return (
      <div className="text-center p-4 border rounded-lg">
        <p className="text-destructive">Error: Invalid product data</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className={error ? "text-destructive" : ""}>Product Selection</Label>
        <div className="flex items-center space-x-2">
          <Button type="button" variant="outline" size="sm" onClick={handleSelectAll} className="h-8 text-xs">
            Select All
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClearAll}
            className="h-8 text-xs"
            disabled={selectedProductIds.length === 0}
          >
            Clear All
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="all">All Products ({productGroups.length})</TabsTrigger>
          <TabsTrigger value="selected">
            Selected ({selectedGroups.length} products, {selectedProductIds.length} variants)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="border rounded-md mt-2">
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products by name, category, or size..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
              {searchTerm && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-7 w-7 p-0"
                  onClick={() => setSearchTerm("")}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Clear search</span>
                </Button>
              )}
            </div>
          </div>

          <ScrollArea className="h-[500px]">
            {filteredGroups.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                {searchTerm ? "No products found matching your search" : "No products available"}
              </div>
            ) : (
              <div className="divide-y">
                {filteredGroups.map((group) => {
                  const isExpanded = expandedGroups[group.key]
                  const isFullySelected = isGroupFullySelected(group)
                  const isPartiallySelected = isGroupPartiallySelected(group)

                  return (
                    <div key={group.key} className="border-b last:border-b-0">
                      <div
                        className={cn(
                          "flex items-center p-4 hover:bg-muted/50 cursor-pointer transition-colors",
                          isFullySelected ? "bg-muted/30" : "",
                          isPartiallySelected ? "bg-muted/20" : "",
                        )}
                        onClick={() => toggleGroupSelection(group)}
                      >
                        <div className="flex items-center flex-1 min-w-0">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 mr-3 flex-shrink-0"
                            onClick={(e) => toggleGroupExpansion(group.key, e)}
                          >
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </Button>

                          <div className="flex-shrink-0 mr-3 h-12 w-12 rounded-md overflow-hidden bg-muted flex items-center justify-center">
                            {!imageLoadErrors[group.variants[0]?._id] && group.image ? (
                              <Image
                                src={group.image || "/placeholder.svg"}
                                alt={group.name}
                                width={48}
                                height={48}
                                className="object-cover"
                                onError={() => handleImageError(group.variants[0]._id)}
                              />
                            ) : (
                              <Package className="h-6 w-6 text-muted-foreground" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="text-sm font-medium truncate">{group.name}</h3>
                              <Badge variant="outline" className="text-xs flex-shrink-0">
                                {group.category}
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                              <span>
                                {group.variants.length} size{group.variants.length !== 1 ? "s" : ""}
                              </span>
                              {isPartiallySelected && (
                                <span className="text-primary">
                                  • {group.variants.filter((v) => selectedProductIds.includes(v._id)).length} selected
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center ml-3">
                          <div
                            className={cn(
                              "h-5 w-5 rounded border-2 flex items-center justify-center transition-colors",
                              isFullySelected
                                ? "bg-primary border-primary text-primary-foreground"
                                : "border-input hover:border-primary",
                              isPartiallySelected ? "bg-primary/20 border-primary" : "",
                            )}
                          >
                            {isFullySelected && <Check className="h-3 w-3" />}
                            {isPartiallySelected && !isFullySelected && (
                              <div className="h-2 w-2 bg-primary rounded-sm" />
                            )}
                          </div>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="bg-muted/5 border-t">
                          <div className="pl-16 pr-4 py-2">
                            <div className="space-y-2">
                              {group.variants.map((variant) => {
                                const isSelected = selectedProductIds.includes(variant._id)
                                const price = getVariantPrice(variant)

                                return (
                                  <div
                                    key={variant._id}
                                    className={cn(
                                      "flex items-center p-3 rounded-md hover:bg-background/80 cursor-pointer transition-colors",
                                      isSelected
                                        ? "bg-primary/5 border border-primary/20"
                                        : "border border-transparent",
                                    )}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      toggleVariantSelection(variant._id)
                                    }}
                                  >
                                    <Checkbox
                                      checked={isSelected}
                                      onChange={() => toggleVariantSelection(variant._id)}
                                      className="mr-3"
                                    />

                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center space-x-2 mb-1">
                                        <span className="text-sm font-medium">{variant.size || "Standard Size"}</span>
                                        {price > 0 && (
                                          <Badge variant="secondary" className="text-xs">
                                            ₹{price.toLocaleString()}
                                          </Badge>
                                        )}
                                      </div>
                                      <p className="text-xs text-muted-foreground">{getVariantDisplayInfo(variant)}</p>
                                      {variant.stock !== undefined && (
                                        <p className="text-xs text-muted-foreground">Stock: {variant.stock}</p>
                                      )}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="selected" className="border rounded-md mt-2">
          <ScrollArea className="h-[500px]">
            {selectedGroups.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">No products selected</div>
            ) : (
              <div className="divide-y">
                {selectedGroups.map((group) => (
                  <div key={group.key} className="p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="flex-shrink-0 h-10 w-10 rounded-md overflow-hidden bg-muted flex items-center justify-center">
                        {group.image ? (
                          <Image
                            src={group.image || "/placeholder.svg"}
                            alt={group.name}
                            width={40}
                            height={40}
                            className="object-cover"
                          />
                        ) : (
                          <Package className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-sm font-medium truncate">{group.name}</h3>
                          <Badge variant="outline" className="text-xs">
                            {group.category}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {group.variants.length} variant{group.variants.length !== 1 ? "s" : ""} selected
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => toggleGroupSelection(group)}
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Remove all variants</span>
                      </Button>
                    </div>

                    <div className="ml-13 space-y-2">
                      {group.variants.map((variant) => {
                        const price = getVariantPrice(variant)

                        return (
                          <div
                            key={variant._id}
                            className="flex items-center justify-between p-2 rounded-md bg-muted/30"
                          >
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="text-xs">
                                {variant.size || "Standard"}
                              </Badge>
                              <span className="text-sm">{getVariantDisplayInfo(variant)}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              {price > 0 && (
                                <span className="text-xs text-muted-foreground">₹{price.toLocaleString()}</span>
                              )}
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                onClick={() => toggleVariantSelection(variant._id)}
                              >
                                <X className="h-3 w-3" />
                                <span className="sr-only">Remove variant</span>
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>

      <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t">
        <span>
          {selectedProductIds.length} variant{selectedProductIds.length !== 1 ? "s" : ""} selected from{" "}
          {selectedGroups.length} product{selectedGroups.length !== 1 ? "s" : ""}
        </span>
        {selectedProductIds.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs"
            onClick={() => setActiveTab("selected")}
          >
            View selected →
          </Button>
        )}
      </div>
    </div>
  )
}
