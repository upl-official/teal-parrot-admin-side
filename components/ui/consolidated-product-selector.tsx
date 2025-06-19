"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Search, X, Package, ChevronDown, ChevronRight } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import Image from "next/image"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface ProductVariant {
  _id: string
  name: string
  price?: number
  image?: string
  images?: string[]
  category?: { name: string } | string
  size?: string
  grade?: { name: string } | string
  material?: { name: string } | string
}

interface ConsolidatedProduct {
  name: string
  category: string
  variants: ProductVariant[]
  image?: string
}

interface ConsolidatedProductSelectorProps {
  products: ProductVariant[]
  selectedProductIds: string[]
  onChange: (selectedIds: string[]) => void
  error?: string
}

export function ConsolidatedProductSelector({
  products,
  selectedProductIds,
  onChange,
  error,
}: ConsolidatedProductSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set())

  // Add validation check
  if (!Array.isArray(products)) {
    console.warn("ConsolidatedProductSelector: products prop is not an array:", products)
    return (
      <div className="text-center p-4 border rounded-lg">
        <p className="text-destructive">Error: Invalid product data</p>
      </div>
    )
  }

  // Consolidate products by name and category
  const consolidateProducts = (productList: ProductVariant[]): ConsolidatedProduct[] => {
    const consolidated = new Map<string, ConsolidatedProduct>()

    productList.forEach((product) => {
      const categoryName = getCategoryName(product)
      const key = `${product.name}-${categoryName}`

      if (!consolidated.has(key)) {
        consolidated.set(key, {
          name: product.name,
          category: categoryName,
          variants: [],
          image: getProductImage(product),
        })
      }

      consolidated.get(key)!.variants.push(product)
    })

    // Sort variants within each product by size/grade/material
    consolidated.forEach((product) => {
      product.variants.sort((a, b) => {
        const aSize = getVariantLabel(a)
        const bSize = getVariantLabel(b)
        return aSize.localeCompare(bSize)
      })
    })

    return Array.from(consolidated.values()).sort((a, b) => a.name.localeCompare(b.name))
  }

  // Get variant label (size, grade, material, etc.)
  const getVariantLabel = (variant: ProductVariant): string => {
    const parts = []

    if (variant.size) {
      parts.push(`Size: ${variant.size}`)
    }

    if (variant.grade) {
      const gradeName = typeof variant.grade === "object" ? variant.grade.name : variant.grade
      if (gradeName) parts.push(`Grade: ${gradeName}`)
    }

    if (variant.material) {
      const materialName = typeof variant.material === "object" ? variant.material.name : variant.material
      if (materialName) parts.push(`Material: ${materialName}`)
    }

    return parts.length > 0 ? parts.join(", ") : "Standard"
  }

  // Get product image
  const getProductImage = (product: ProductVariant): string => {
    if (product.image) return product.image
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      return product.images[0]
    }
    return `/placeholder.svg?height=40&width=40&query=product`
  }

  // Get category name
  const getCategoryName = (product: ProductVariant): string => {
    if (!product.category) return "Uncategorized"
    if (typeof product.category === "string") return product.category
    if (typeof product.category === "object" && product.category.name) return product.category.name
    return "Uncategorized"
  }

  // Get consolidated products
  const consolidatedProducts = consolidateProducts(products)

  // Filter consolidated products based on search
  const filteredConsolidatedProducts = consolidatedProducts.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Get selected products for display
  const getSelectedProducts = (): ConsolidatedProduct[] => {
    return consolidatedProducts
      .filter((product) => product.variants.some((variant) => selectedProductIds.includes(variant._id)))
      .map((product) => ({
        ...product,
        variants: product.variants.filter((variant) => selectedProductIds.includes(variant._id)),
      }))
  }

  // Toggle product expansion
  const toggleProductExpansion = (productKey: string) => {
    const newExpanded = new Set(expandedProducts)
    if (newExpanded.has(productKey)) {
      newExpanded.delete(productKey)
    } else {
      newExpanded.add(productKey)
    }
    setExpandedProducts(newExpanded)
  }

  // Select all variants of a product
  const selectAllVariants = (variants: ProductVariant[]) => {
    const variantIds = variants.map((v) => v._id)
    const newSelected = [...selectedProductIds, ...variantIds.filter((id) => !selectedProductIds.includes(id))]
    onChange(newSelected)
  }

  // Deselect all variants of a product
  const deselectAllVariants = (variants: ProductVariant[]) => {
    const variantIds = variants.map((v) => v._id)
    const newSelected = selectedProductIds.filter((id) => !variantIds.includes(id))
    onChange(newSelected)
  }

  // Toggle single variant
  const toggleVariant = (variantId: string) => {
    if (selectedProductIds.includes(variantId)) {
      onChange(selectedProductIds.filter((id) => id !== variantId))
    } else {
      onChange([...selectedProductIds, variantId])
    }
  }

  // Check if all variants of a product are selected
  const areAllVariantsSelected = (variants: ProductVariant[]): boolean => {
    return variants.every((variant) => selectedProductIds.includes(variant._id))
  }

  // Check if some variants of a product are selected
  const areSomeVariantsSelected = (variants: ProductVariant[]): boolean => {
    return variants.some((variant) => selectedProductIds.includes(variant._id))
  }

  // Select all products
  const handleSelectAll = () => {
    onChange(products.map((product) => product._id))
  }

  // Clear all selections
  const handleClearAll = () => {
    onChange([])
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className={error ? "text-destructive" : ""}>Products</Label>
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
          <TabsTrigger value="all">All Products ({consolidatedProducts.length})</TabsTrigger>
          <TabsTrigger value="selected">Selected ({getSelectedProducts().length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="border rounded-md mt-2">
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
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

          <ScrollArea className="h-80">
            {filteredConsolidatedProducts.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                {searchTerm ? "No products found" : "No products available"}
              </div>
            ) : (
              <div className="divide-y">
                {filteredConsolidatedProducts.map((product) => {
                  const productKey = `${product.name}-${product.category}`
                  const isExpanded = expandedProducts.has(productKey)
                  const allSelected = areAllVariantsSelected(product.variants)
                  const someSelected = areSomeVariantsSelected(product.variants)

                  return (
                    <Collapsible
                      key={productKey}
                      open={isExpanded}
                      onOpenChange={() => toggleProductExpansion(productKey)}
                    >
                      <div className="p-3">
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            checked={allSelected}
                            ref={(el) => {
                              if (el) el.indeterminate = someSelected && !allSelected
                            }}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                selectAllVariants(product.variants)
                              } else {
                                deselectAllVariants(product.variants)
                              }
                            }}
                          />

                          <div className="flex-shrink-0 h-10 w-10 rounded-md overflow-hidden bg-muted flex items-center justify-center">
                            {product.image ? (
                              <Image
                                src={product.image || "/placeholder.svg"}
                                alt={product.name}
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
                              <p className="text-sm font-medium truncate">{product.name}</p>
                              <Badge variant="outline" className="text-xs">
                                {product.category}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {product.variants.length} variant{product.variants.length !== 1 ? "s" : ""}
                            </p>
                          </div>

                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                              <span className="sr-only">Toggle variants</span>
                            </Button>
                          </CollapsibleTrigger>
                        </div>

                        <CollapsibleContent className="mt-3">
                          <div className="ml-8 space-y-2">
                            {product.variants.map((variant) => (
                              <div
                                key={variant._id}
                                className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50"
                              >
                                <Checkbox
                                  checked={selectedProductIds.includes(variant._id)}
                                  onCheckedChange={() => toggleVariant(variant._id)}
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm">{getVariantLabel(variant)}</p>
                                  {variant.price && (
                                    <p className="text-xs text-muted-foreground">₹{variant.price.toFixed(2)}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  )
                })}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="selected" className="border rounded-md mt-2">
          <ScrollArea className="h-80">
            {getSelectedProducts().length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">No products selected</div>
            ) : (
              <div className="divide-y">
                {getSelectedProducts().map((product) => {
                  const productKey = `${product.name}-${product.category}`

                  return (
                    <div key={productKey} className="p-3">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="flex-shrink-0 h-10 w-10 rounded-md overflow-hidden bg-muted flex items-center justify-center">
                          {product.image ? (
                            <Image
                              src={product.image || "/placeholder.svg"}
                              alt={product.name}
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
                            <p className="text-sm font-medium truncate">{product.name}</p>
                            <Badge variant="outline" className="text-xs">
                              {product.category}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {product.variants.length} variant{product.variants.length !== 1 ? "s" : ""} selected
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 text-destructive"
                          onClick={() => deselectAllVariants(product.variants)}
                        >
                          <X className="h-4 w-4" />
                          <span className="sr-only">Remove all variants</span>
                        </Button>
                      </div>
                      <div className="ml-8 space-y-1">
                        {product.variants.map((variant) => (
                          <div key={variant._id} className="flex items-center justify-between text-sm">
                            <span>{getVariantLabel(variant)}</span>
                            <div className="flex items-center space-x-2">
                              {variant.price && (
                                <span className="text-xs text-muted-foreground">₹{variant.price.toFixed(2)}</span>
                              )}
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-destructive"
                                onClick={() => toggleVariant(variant._id)}
                              >
                                <X className="h-3 w-3" />
                                <span className="sr-only">Remove variant</span>
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {selectedProductIds.length} variant{selectedProductIds.length !== 1 ? "s" : ""} selected from{" "}
          {consolidatedProducts.length} product{consolidatedProducts.length !== 1 ? "s" : ""}
        </span>
        {selectedProductIds.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs"
            onClick={() => setActiveTab("selected")}
          >
            View selected
          </Button>
        )}
      </div>
    </div>
  )
}
