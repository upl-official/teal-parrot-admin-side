"use client"

import type React from "react"

import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Search, X, Package, ChevronRight, ChevronDown, Check } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { getProductImageUrl } from "@/lib/image-url-helper"

interface Product {
  _id: string
  name: string
  price?: number
  image?: string
  images?: string[]
  category?: { name: string; _id?: string } | string
  size?: string
  stock?: number
}

interface ProductGroup {
  key: string
  name: string
  category: string
  categoryId: string
  products: Product[]
}

interface HierarchicalProductSelectorProps {
  products: Product[]
  selectedProductIds: string[]
  onChange: (selectedIds: string[]) => void
  error?: string
}

export function HierarchicalProductSelector({
  products,
  selectedProductIds,
  onChange,
  error,
}: HierarchicalProductSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})
  const [imageLoadErrors, setImageLoadErrors] = useState<Record<string, boolean>>({})

  // Log products for debugging
  useEffect(() => {
    console.log("Products received:", products)
    if (products.length > 0) {
      console.log("Sample product:", products[0])
      console.log("Sample product image:", products[0].image)
      console.log("Sample product images array:", products[0].images)
    }
  }, [products])

  // Group products by name and category
  const productGroups = useMemo(() => {
    const groups: Record<string, ProductGroup> = {}

    products.forEach((product) => {
      const categoryName =
        typeof product.category === "object" ? product.category.name : product.category || "Uncategorized"
      const categoryId = typeof product.category === "object" ? product.category._id || "" : ""
      const key = `${product.name}|${categoryName}`

      if (!groups[key]) {
        groups[key] = {
          key,
          name: product.name,
          category: categoryName,
          categoryId,
          products: [],
        }
      }

      groups[key].products.push(product)
    })

    // Sort groups by name
    return Object.values(groups).sort((a, b) => a.name.localeCompare(b.name))
  }, [products])

  // Filter groups based on search term
  const filteredGroups = useMemo(() => {
    if (!searchTerm) return productGroups

    return productGroups.filter(
      (group) =>
        group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.products.some((product) => product.size && product.size.toLowerCase().includes(searchTerm.toLowerCase())),
    )
  }, [productGroups, searchTerm])

  // Get selected groups
  const selectedGroups = useMemo(() => {
    return productGroups.filter((group) => group.products.some((product) => selectedProductIds.includes(product._id)))
  }, [productGroups, selectedProductIds])

  // Check if a group is fully selected
  const isGroupFullySelected = (group: ProductGroup) => {
    return group.products.every((product) => selectedProductIds.includes(product._id))
  }

  // Check if a group is partially selected
  const isGroupPartiallySelected = (group: ProductGroup) => {
    const selectedCount = group.products.filter((product) => selectedProductIds.includes(product._id)).length
    return selectedCount > 0 && selectedCount < group.products.length
  }

  // Toggle group selection
  const toggleGroupSelection = (group: ProductGroup) => {
    const groupProductIds = group.products.map((product) => product._id)

    if (isGroupFullySelected(group)) {
      // Deselect all products in the group
      onChange(selectedProductIds.filter((id) => !groupProductIds.includes(id)))
    } else {
      // Select all products in the group
      const newSelectedIds = [...selectedProductIds]

      groupProductIds.forEach((id) => {
        if (!newSelectedIds.includes(id)) {
          newSelectedIds.push(id)
        }
      })

      onChange(newSelectedIds)
    }
  }

  // Toggle individual product selection
  const toggleProductSelection = (productId: string) => {
    if (selectedProductIds.includes(productId)) {
      onChange(selectedProductIds.filter((id) => id !== productId))
    } else {
      onChange([...selectedProductIds, productId])
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

  // Initialize expanded groups when products change
  useEffect(() => {
    // Expand groups that have selected products
    const newExpandedGroups: Record<string, boolean> = {}

    productGroups.forEach((group) => {
      if (group.products.some((product) => selectedProductIds.includes(product._id))) {
        newExpandedGroups[group.key] = true
      }
    })

    setExpandedGroups((prev) => ({
      ...prev,
      ...newExpandedGroups,
    }))
  }, [productGroups, selectedProductIds])

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
          <TabsTrigger value="all">All Products ({products.length})</TabsTrigger>
          <TabsTrigger value="selected">Selected ({selectedProductIds.length})</TabsTrigger>
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

          <ScrollArea className="h-[400px]">
            {filteredGroups.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                {searchTerm ? "No products found" : "No products available"}
              </div>
            ) : (
              <ul className="divide-y">
                {filteredGroups.map((group) => (
                  <li key={group.key} className="border-b last:border-b-0">
                    <div
                      className={cn(
                        "flex items-center p-3 hover:bg-muted/50 cursor-pointer",
                        isGroupFullySelected(group) ? "bg-muted/30" : "",
                        isGroupPartiallySelected(group) ? "bg-muted/20" : "",
                      )}
                      onClick={() => toggleGroupSelection(group)}
                    >
                      <div className="flex items-center flex-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 mr-2"
                          onClick={(e) => toggleGroupExpansion(group.key, e)}
                        >
                          {expandedGroups[group.key] ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>

                        <div className="flex-shrink-0 mr-3 h-10 w-10 rounded-md overflow-hidden bg-muted flex items-center justify-center">
                          {!imageLoadErrors[group.products[0]?._id] &&
                          (group.products[0]?.images?.length > 0 || group.products[0]?.image) ? (
                            <div className="relative h-10 w-10">
                              <Image
                                src={getProductImageUrl(group.products[0]) || "/placeholder.svg"}
                                alt={group.name}
                                width={40}
                                height={40}
                                className="object-cover"
                                onError={() => handleImageError(group.products[0]._id)}
                              />
                            </div>
                          ) : (
                            <Package className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center">
                            <p className="text-sm font-medium truncate">{group.name}</p>
                            <Badge variant="outline" className="ml-2 text-xs">
                              {group.category}
                            </Badge>
                            <Badge variant="secondary" className="ml-2 text-xs">
                              {group.products.length} {group.products.length === 1 ? "size" : "sizes"}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center">
                        <div
                          className={cn(
                            "h-5 w-5 rounded border flex items-center justify-center mr-2",
                            isGroupFullySelected(group)
                              ? "bg-primary border-primary text-primary-foreground"
                              : "border-primary",
                            isGroupPartiallySelected(group) ? "bg-primary/30 border-primary" : "",
                          )}
                        >
                          {isGroupFullySelected(group) && <Check className="h-3.5 w-3.5" />}
                          {isGroupPartiallySelected(group) && <div className="h-2.5 w-2.5 bg-primary rounded-sm" />}
                        </div>
                      </div>
                    </div>

                    {expandedGroups[group.key] && (
                      <ul className="pl-10 pr-3 pb-2 bg-muted/5 divide-y divide-muted/20">
                        {group.products.map((product) => (
                          <li
                            key={product._id}
                            className={cn(
                              "flex items-center py-2 px-3 hover:bg-muted/30 cursor-pointer rounded-md my-1",
                              selectedProductIds.includes(product._id) ? "bg-muted/20" : "",
                            )}
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleProductSelection(product._id)
                            }}
                          >
                            <div className="flex-1 flex items-center">
                              <Badge variant="outline" className="mr-2">
                                {product.size || "No size"}
                              </Badge>
                              {product.stock !== undefined && (
                                <span className="text-xs text-muted-foreground">Stock: {product.stock}</span>
                              )}
                              {product.price !== undefined && (
                                <span className="ml-2 text-xs text-muted-foreground">
                                  Price: ₹{product.price.toLocaleString()}
                                </span>
                              )}
                            </div>

                            <div
                              className={cn(
                                "h-4 w-4 rounded border flex items-center justify-center",
                                selectedProductIds.includes(product._id)
                                  ? "bg-primary border-primary text-primary-foreground"
                                  : "border-primary",
                              )}
                            >
                              {selectedProductIds.includes(product._id) && <Check className="h-3 w-3" />}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="selected" className="border rounded-md mt-2">
          <ScrollArea className="h-[400px]">
            {selectedProductIds.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">No products selected</div>
            ) : (
              <ul className="divide-y">
                {selectedGroups.map((group) => (
                  <li key={group.key} className="border-b last:border-b-0">
                    <div
                      className="flex items-center p-3 hover:bg-muted/50 cursor-pointer bg-muted/20"
                      onClick={() => toggleGroupSelection(group)}
                    >
                      <div className="flex items-center flex-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 mr-2"
                          onClick={(e) => toggleGroupExpansion(group.key, e)}
                        >
                          {expandedGroups[group.key] ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>

                        <div className="flex-shrink-0 mr-3 h-10 w-10 rounded-md overflow-hidden bg-muted flex items-center justify-center">
                          {!imageLoadErrors[group.products[0]?._id] &&
                          (group.products[0]?.images?.length > 0 || group.products[0]?.image) ? (
                            <div className="relative h-10 w-10">
                              <Image
                                src={getProductImageUrl(group.products[0]) || "/placeholder.svg"}
                                alt={group.name}
                                width={40}
                                height={40}
                                className="object-cover"
                                onError={() => handleImageError(group.products[0]._id)}
                              />
                            </div>
                          ) : (
                            <Package className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center">
                            <p className="text-sm font-medium truncate">{group.name}</p>
                            <Badge variant="outline" className="ml-2 text-xs">
                              {group.category}
                            </Badge>
                            <Badge variant="secondary" className="ml-2 text-xs">
                              {group.products.filter((p) => selectedProductIds.includes(p._id)).length} selected
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="ml-2 h-8 w-8 text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleGroupSelection(group)
                        }}
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Remove all</span>
                      </Button>
                    </div>

                    {expandedGroups[group.key] && (
                      <ul className="pl-10 pr-3 pb-2 bg-muted/5 divide-y divide-muted/20">
                        {group.products
                          .filter((product) => selectedProductIds.includes(product._id))
                          .map((product) => (
                            <li
                              key={product._id}
                              className="flex items-center py-2 px-3 hover:bg-muted/30 cursor-pointer rounded-md my-1 bg-muted/20"
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleProductSelection(product._id)
                              }}
                            >
                              <div className="flex-1 flex items-center">
                                <Badge variant="outline" className="mr-2">
                                  {product.size || "No size"}
                                </Badge>
                                {product.stock !== undefined && (
                                  <span className="text-xs text-muted-foreground">Stock: {product.stock}</span>
                                )}
                                {product.price !== undefined && (
                                  <span className="ml-2 text-xs text-muted-foreground">
                                    Price: ₹{product.price.toLocaleString()}
                                  </span>
                                )}
                              </div>

                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="ml-2 h-6 w-6 p-0 text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleProductSelection(product._id)
                                }}
                              >
                                <X className="h-3 w-3" />
                                <span className="sr-only">Remove</span>
                              </Button>
                            </li>
                          ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {selectedProductIds.length} of {products.length} products selected
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
