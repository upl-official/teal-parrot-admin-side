"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Trash, Eye } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { fetchApi } from "@/lib/api"
import { DataTable } from "@/components/ui/data-table"

export default function DiscountsPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    fetchDiscountedProducts()
  }, [])

  const fetchDiscountedProducts = async () => {
    try {
      setLoading(true)
      const response = await fetchApi("/api/v1/pro/product-discount")
      // Handle nested data structure
      const productsData = response.data?.products || response.products || []
      setProducts(productsData)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch discounted products",
      })
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveDiscount = async (productId) => {
    if (!confirm("Are you sure you want to remove this discount?")) return

    try {
      await fetchApi("/api/v1/admin/product/remove-discount", {
        method: "POST",
        body: JSON.stringify({ productId }),
      })

      toast({
        title: "Success",
        description: "Discount removed successfully",
      })

      fetchDiscountedProducts()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove discount",
      })
    }
  }

  const calculateDiscountPercentage = (originalPrice, discountedPrice) => {
    if (!originalPrice || !discountedPrice) return 0
    const discount = ((originalPrice - discountedPrice) / originalPrice) * 100
    return Math.round(discount)
  }

  const columns = [
    {
      key: "name",
      header: "Product",
      cell: (row) => <span className="font-medium">{row.name}</span>,
    },
    {
      key: "category",
      header: "Category",
      cell: (row) => row.category?.name || "Uncategorized",
      className: "hidden md:table-cell",
    },
    {
      key: "originalPrice",
      header: "Original Price",
      cell: (row) => `₹${row.price}`,
    },
    {
      key: "discountedPrice",
      header: "Discounted Price",
      cell: (row) => `₹${row.discountPrice}`,
    },
    {
      key: "discount",
      header: "Discount",
      cell: (row) => (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          {calculateDiscountPercentage(row.price, row.discountPrice)}% OFF
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      cell: (row) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/dashboard/products/edit/${row._id}`)}
            className="h-8 w-8"
            title="View Product"
          >
            <Eye className="h-4 w-4" />
            <span className="sr-only">View Product</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/dashboard/products/edit/${row._id}`)}
            className="h-8 w-8"
            title="Edit Discount"
          >
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Edit Discount</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleRemoveDiscount(row._id)}
            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
            title="Remove Discount"
          >
            <Trash className="h-4 w-4" />
            <span className="sr-only">Remove Discount</span>
          </Button>
        </div>
      ),
      className: "text-right",
    },
  ]

  return (
    <div>
      <Header title="Discounts" />
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold">Discounted Products</h2>
          <Button className="bg-[#28acc1] hover:bg-[#1e8a9a]" onClick={() => router.push("/dashboard/products")}>
            <Plus className="mr-2 h-4 w-4" />
            Add New Discount
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={products}
          searchKey="name"
          searchPlaceholder="Search discounted products..."
          itemsPerPage={10}
          loading={loading}
        />
      </div>
    </div>
  )
}
