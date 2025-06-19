"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Search, X, Package } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Image from "next/image"
import { Plus } from "lucide-react"

interface Product {
  _id: string
  name: string
  price?: number
  image?: string
  images?: string[]
  category?: { name: string } | string
}

interface ProductSelectorProps {
  products: Product[]
  selectedProductIds: string[]
  onChange: (selectedIds: string[]) => void
  error?: string
}

export function EnhancedProductSelector({ products, selectedProductIds, onChange, error }: ProductSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("all")

  // Add this check at the beginning of the component
  if (!Array.isArray(products)) {
    console.warn("EnhancedProductSelector: products prop is not an array:", products)
    return (
      <div className="text-center p-4 border rounded-lg">
        <p className="text-destructive">Error: Invalid product data</p>
      </div>
    )
  }

  // Get selected products
  const selectedProducts = products.filter((product) => selectedProductIds.includes(product._id))

  // Get unselected products
  const unselectedProducts = products.filter((product) => !selectedProductIds.includes(product._id))

  // Filter products based on search term
  const filteredProducts = unselectedProducts.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Select all products
  const handleSelectAll = () => {
    onChange(products.map((product) => product._id))
  }

  // Clear all selections
  const handleClearAll = () => {
    onChange([])
  }

  // Toggle selection for a single product
  const toggleProduct = (productId: string) => {
    if (selectedProductIds.includes(productId)) {
      onChange(selectedProductIds.filter((id) => id !== productId))
    } else {
      onChange([...selectedProductIds, productId])
    }
  }

  // Get product image or placeholder
  const getProductImage = (product: Product) => {
    if (product.image) {
      return product.image
    }
    // Handle different image field names
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      return product.images[0]
    }
    return `/placeholder.svg?height=40&width=40&query=product`
  }

  // Get category name
  const getCategoryName = (product: Product) => {
    if (!product.category) return "Uncategorized"
    if (typeof product.category === "string") return product.category
    if (typeof product.category === "object" && product.category.name) return product.category.name
    return "Uncategorized"
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
          <TabsTrigger value="all">All Products ({products.length})</TabsTrigger>
          <TabsTrigger value="selected">Selected ({selectedProductIds.length})</TabsTrigger>
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

          <ScrollArea className="h-60">
            {filteredProducts.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                {searchTerm ? "No products found" : "No products available"}
              </div>
            ) : (
              <ul className="divide-y">
                {filteredProducts.map((product) => (
                  <li
                    key={product._id}
                    className="flex items-center p-3 hover:bg-muted/50 cursor-pointer"
                    onClick={() => toggleProduct(product._id)}
                  >
                    <div className="flex-shrink-0 mr-3 h-10 w-10 rounded-md overflow-hidden bg-muted flex items-center justify-center">
                      {product.image ? (
                        <Image
                          src={getProductImage(product) || "/placeholder.svg"}
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
                      <p className="text-sm font-medium truncate">{product.name}</p>
                      <div className="flex items-center mt-1">
                        <Badge variant="outline" className="text-xs">
                          {getCategoryName(product)}
                        </Badge>
                        {product.price && (
                          <span className="ml-2 text-xs text-muted-foreground">${product.price.toFixed(2)}</span>
                        )}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="ml-2 h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleProduct(product._id)
                      }}
                    >
                      <Plus className="h-4 w-4" />
                      <span className="sr-only">Add product</span>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="selected" className="border rounded-md mt-2">
          <ScrollArea className="h-60">
            {selectedProducts.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">No products selected</div>
            ) : (
              <ul className="divide-y">
                {selectedProducts.map((product) => (
                  <li key={product._id} className="flex items-center p-3 hover:bg-muted/50">
                    <div className="flex-shrink-0 mr-3 h-10 w-10 rounded-md overflow-hidden bg-muted flex items-center justify-center">
                      {product.image ? (
                        <Image
                          src={getProductImage(product) || "/placeholder.svg"}
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
                      <p className="text-sm font-medium truncate">{product.name}</p>
                      <div className="flex items-center mt-1">
                        <Badge variant="outline" className="text-xs">
                          {getCategoryName(product)}
                        </Badge>
                        {product.price && (
                          <span className="ml-2 text-xs text-muted-foreground">${product.price.toFixed(2)}</span>
                        )}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="ml-2 h-8 w-8 text-destructive"
                      onClick={() => toggleProduct(product._id)}
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Remove product</span>
                    </Button>
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
