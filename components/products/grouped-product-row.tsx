"use client"

import { useState, useRef, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ChevronDown, ChevronRight, Copy, Eye, Package, Pencil, Percent, Trash } from "lucide-react"
import { useRouter } from "next/navigation"

export function GroupedProductRow({
  products,
  onEdit,
  onDelete,
  onDuplicate,
  onManageDiscount,
  formatPrice,
  calculateDiscountPercentage,
  duplicating,
  selectedProductId,
  selectedProducts = [],
  onSelectProduct = () => {},
  onSelectGroup = () => {},
  placeholderImage = "diverse-products-still-life.png",
}) {
  const [expanded, setExpanded] = useState(false)
  const router = useRouter()
  const checkboxRef = useRef(null)

  // Get the first product as the representative for the group
  const mainProduct = products[0]

  // Check if all products in this group are selected
  const allSelected = products.every((product) => selectedProducts.includes(product._id))

  // Check if some (but not all) products in this group are selected
  const someSelected = products.some((product) => selectedProducts.includes(product._id)) && !allSelected

  // Use useEffect to set the indeterminate property via DOM API
  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = someSelected
    }
  }, [someSelected])

  // Sort products by size for consistent display
  const sortedProducts = [...products].sort((a, b) => {
    // If sizes are strings, try to compare them directly
    if (typeof a.size === "string" && typeof b.size === "string") {
      // Common size abbreviations in order
      const sizeOrder = { XS: 1, S: 2, M: 3, L: 4, XL: 5, XXL: 6, XXXL: 7 }

      // If both sizes are in our predefined order, use that
      if (sizeOrder[a.size] && sizeOrder[b.size]) {
        return sizeOrder[a.size] - sizeOrder[b.size]
      }

      // Otherwise just compare alphabetically
      return a.size.localeCompare(b.size)
    }

    // If sizes are numbers, compare numerically
    if (!isNaN(Number(a.size)) && !isNaN(Number(b.size))) {
      return Number(a.size) - Number(b.size)
    }

    // Fallback to string comparison
    return String(a.size).localeCompare(String(b.size))
  })

  return (
    <>
      {/* Main row for the product group */}
      <tr className={`border-b hover:bg-muted/50 ${allSelected ? "bg-muted/30" : ""}`}>
        {/* Group selection checkbox */}
        <td className="p-2 text-center">
          <Checkbox
            ref={checkboxRef}
            checked={allSelected}
            onCheckedChange={() => onSelectGroup(products)}
            aria-label={`Select all ${products.length} size variations of ${mainProduct.name}`}
          />
        </td>
        <td className="p-2">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </td>
        <td className="p-2">
          <div className="h-10 w-10 rounded bg-gray-200 flex items-center justify-center">
            <Package className="h-5 w-5 text-gray-500" />
          </div>
        </td>
        <td className="p-2">
          <span className="font-medium">{mainProduct.name}</span>
          <div className="text-xs text-muted-foreground mt-1">
            {products.length} size{products.length > 1 ? "s" : ""} available
          </div>
        </td>
        <td className="p-2 hidden md:table-cell">
          <span>{mainProduct.category || "Uncategorized"}</span>
        </td>
        <td className="p-2 hidden md:table-cell">
          <span>{mainProduct.material || "Not specified"}</span>
        </td>
        <td className="p-2">
          <div className="flex flex-col">
            <div className="flex items-center">
              <span className="text-xs text-gray-500 mr-1">Price:</span>
              <span>{formatPrice(mainProduct.price)}</span>
            </div>
            {products.length > 1 && (
              <div className="text-xs text-muted-foreground mt-1">
                {products.some((p) => p.price !== mainProduct.price)
                  ? "Prices vary by size"
                  : "Same price for all sizes"}
              </div>
            )}
          </div>
        </td>
        <td className="p-2 hidden md:table-cell">
          <div className="flex flex-col">
            <span>{products.reduce((total, p) => total + (p.stock || 0), 0)}</span>
            {products.length > 1 && <div className="text-xs text-muted-foreground mt-1">Total across all sizes</div>}
          </div>
        </td>
        <td className="p-2">
          {mainProduct.stock > 0 ? (
            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">In Stock</Badge>
          ) : (
            <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">
              Out of Stock
            </Badge>
          )}
        </td>
        <td className="p-2 text-right">
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(`/dashboard/products/view/${mainProduct._id}`)}
              className="h-8 w-8"
              title="View Details"
            >
              <Eye className="h-4 w-4" />
              <span className="sr-only">View Details</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDuplicate(mainProduct)}
              className="h-8 w-8"
              title="Duplicate Product"
              disabled={duplicating}
            >
              {duplicating && selectedProductId === mainProduct._id ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              ) : (
                <Copy className="h-4 w-4" />
              )}
              <span className="sr-only">Duplicate Product</span>
            </Button>
          </div>
        </td>
      </tr>

      {/* Expanded rows for size variations */}
      {expanded &&
        sortedProducts.map((product, index) => (
          <tr
            key={product._id}
            className={`border-b bg-muted/20 ${selectedProducts.includes(product._id) ? "bg-muted/30" : ""}`}
          >
            {/* Individual product selection checkbox */}
            <td className="p-2 text-center">
              <Checkbox
                checked={selectedProducts.includes(product._id)}
                onCheckedChange={() => onSelectProduct(product._id)}
                aria-label={`Select ${product.name} (${product.size || "No size"})`}
              />
            </td>
            <td className="p-2"></td>
            <td className="p-2">
              <div className="h-10 w-10 rounded bg-gray-200 flex items-center justify-center">
                <Package className="h-5 w-5 text-gray-500" />
              </div>
            </td>
            <td className="p-2">
              <div className="flex items-center">
                <div className="ml-4 flex items-center">
                  <Badge variant="outline" className="mr-2">
                    {product.size || "No size"}
                  </Badge>
                  {index === 0 && <span className="text-xs text-muted-foreground">(Default)</span>}
                </div>
              </div>
            </td>
            <td className="p-2 hidden md:table-cell"></td>
            <td className="p-2 hidden md:table-cell"></td>
            <td className="p-2">
              <div className="flex flex-col">
                {product.originalPrice ? (
                  <>
                    <div className="flex items-center">
                      <span className="text-xs text-gray-500 mr-1">MRP:</span>
                      <span className="line-through text-gray-500">{formatPrice(product.originalPrice)}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-xs text-gray-500 mr-1">Selling:</span>
                      <span className="font-medium">{formatPrice(product.price)}</span>
                      <span className="ml-2 text-green-600 text-xs">
                        ({calculateDiscountPercentage(product.originalPrice, product.price)}% off)
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center">
                    <span className="text-xs text-gray-500 mr-1">Price:</span>
                    <span>{formatPrice(product.price)}</span>
                  </div>
                )}
              </div>
            </td>
            <td className="p-2 hidden md:table-cell">
              <span>{product.stock}</span>
            </td>
            <td className="p-2">
              {product.stock > 0 ? (
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">In Stock</Badge>
              ) : (
                <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">
                  Out of Stock
                </Badge>
              )}
            </td>
            <td className="p-2 text-right">
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.push(`/dashboard/products/view/${product._id}`)}
                  className="h-8 w-8"
                  title="View Details"
                >
                  <Eye className="h-4 w-4" />
                  <span className="sr-only">View Details</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onManageDiscount(product)}
                  className="h-8 w-8"
                  title="Manage Discount"
                >
                  <Percent className="h-4 w-4" />
                  <span className="sr-only">Manage Discount</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(product._id)}
                  className="h-8 w-8"
                  title="Edit Product"
                >
                  <Pencil className="h-4 w-4" />
                  <span className="sr-only">Edit Product</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(product._id)}
                  className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                  title="Delete Product"
                >
                  <Trash className="h-4 w-4" />
                  <span className="sr-only">Delete Product</span>
                </Button>
              </div>
            </td>
          </tr>
        ))}
    </>
  )
}
