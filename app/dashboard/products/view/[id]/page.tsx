"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Edit, Trash, Percent, Package } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { fetchApi } from "@/lib/api"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { DiscountManagementModal } from "@/components/products/discount-management-modal"

export default function ProductDetailsPage({ params }) {
  const productId = params.id
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [discountModalOpen, setDiscountModalOpen] = useState(false)

  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    fetchProductDetails()
  }, [productId])

  const fetchProductDetails = async () => {
    try {
      setLoading(true)
      const response = await fetchApi(`/api/v1/product/list?productId=${productId}`)

      if (!response.success || !response.data || !response.data.product) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Product not found",
        })
        router.push("/dashboard/products")
        return
      }

      setProduct(response.data.product)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load product details",
      })
      router.push("/dashboard/products")
    } finally {
      setLoading(false)
    }
  }

  const confirmDeleteProduct = () => {
    setDeleteDialogOpen(true)
  }

  const handleDeleteProduct = async () => {
    try {
      await fetchApi("/api/v1/admin/product/remove", {
        method: "POST",
        body: JSON.stringify({ productId }),
      })

      toast({
        title: "Success",
        description: "Product deleted successfully",
      })

      router.push("/dashboard/products")
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete product",
      })
    } finally {
      setDeleteDialogOpen(false)
    }
  }

  const openDiscountModal = () => {
    setDiscountModalOpen(true)
  }

  if (loading) {
    return (
      <div>
        <Header title="Product Details" />
        <div className="p-6 flex justify-center items-center h-[calc(100vh-4rem)]">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div>
        <Header title="Product Details" />
        <div className="p-6">
          <Button variant="outline" className="mb-6" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Button>
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold mb-2">Product Not Found</h2>
            <p className="text-muted-foreground">
              The product you're looking for doesn't exist or you don't have permission to view it.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Format description for display
  const formatDescription = (text) => {
    if (!text) return ""

    // Replace <br> with line breaks
    let formatted = text.replace(/<br>/g, "\n")

    // Replace *text* with bold
    formatted = formatted.replace(/\*(.*?)\*/g, "<strong>$1</strong>")

    // Replace _text_ with italic
    formatted = formatted.replace(/_(.*?)_/g, "<em>$1</em>")

    // Replace ~text~ with strikethrough
    formatted = formatted.replace(/~(.*?)~/g, "<del>$1</del>")

    // Replace <h>text</h> with heading
    formatted = formatted.replace(/<h>(.*?)<\/h>/g, '<h3 class="text-lg font-semibold mb-2">$1</h3>')

    // Replace => with bullet points
    formatted = formatted.replace(/=>(.*?)(?:\n|$)/g, "<li>$1</li>")

    // Wrap lists in ul tags if they exist
    if (formatted.includes("<li>")) {
      formatted = formatted.replace(/(<li>.*?<\/li>)+/g, '<ul class="list-disc pl-5 mb-4">$&</ul>')
    }

    return formatted
  }

  // Calculate discount percentage
  const calculateDiscountPercentage = () => {
    if (!product.discountPrice || product.discountPrice >= product.price) return 0
    return Math.round(((product.price - product.discountPrice) / product.price) * 100)
  }

  return (
    <div>
      <Header title="Product Details" />
      <div className="p-6">
        <Button variant="outline" className="mb-6" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Products
        </Button>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{product.name}</CardTitle>
                <div className="flex items-center gap-2">
                  {product.stock > 0 ? (
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">In Stock</Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">
                      Out of Stock
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Product Images</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {product.images && product.images.length > 0 ? (
                        product.images.map((image, index) => (
                          <div key={index} className="aspect-square border rounded-md overflow-hidden">
                            <img
                              src={image || "/placeholder.svg"}
                              alt={`${product.name} - Image ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))
                      ) : (
                        <div className="aspect-square border rounded-md flex items-center justify-center bg-gray-100">
                          <Package className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-4">Product Information</h3>
                    <dl className="space-y-2">
                      <div className="flex justify-between">
                        <dt className="font-medium text-muted-foreground">Price:</dt>
                        <dd className="text-right">
                          {product.discountPrice ? (
                            <div>
                              <span className="line-through text-gray-500 mr-2">₹{product.price}</span>
                              <span className="font-bold">₹{product.discountPrice}</span>
                              <span className="ml-2 text-green-600 text-sm">
                                ({calculateDiscountPercentage()}% off)
                              </span>
                            </div>
                          ) : (
                            <span className="font-bold">₹{product.price}</span>
                          )}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="font-medium text-muted-foreground">Stock:</dt>
                        <dd className="text-right">{product.stock}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="font-medium text-muted-foreground">Category:</dt>
                        <dd className="text-right">{product.category || "Uncategorized"}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="font-medium text-muted-foreground">Material:</dt>
                        <dd className="text-right">{product.material || "Not specified"}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="font-medium text-muted-foreground">Grade:</dt>
                        <dd className="text-right">{product.grade || "Not specified"}</dd>
                      </div>
                      {product.gem && (
                        <div className="flex justify-between">
                          <dt className="font-medium text-muted-foreground">Gem Type:</dt>
                          <dd className="text-right">{product.gem}</dd>
                        </div>
                      )}
                      {product.coating && (
                        <div className="flex justify-between">
                          <dt className="font-medium text-muted-foreground">Coating:</dt>
                          <dd className="text-right">{product.coating}</dd>
                        </div>
                      )}
                      {product.size && (
                        <div className="flex justify-between">
                          <dt className="font-medium text-muted-foreground">Size:</dt>
                          <dd className="text-right">{product.size}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </div>

                {product.description && (
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-4">Description</h3>
                    <div
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: formatDescription(product.description) }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full" onClick={() => router.push(`/dashboard/products/edit/${productId}`)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Product
                </Button>

                <Button variant="outline" className="w-full" onClick={openDiscountModal}>
                  <Percent className="mr-2 h-4 w-4" />
                  {product.discountPrice ? "Manage Discount" : "Add Discount"}
                </Button>

                <Button variant="destructive" className="w-full" onClick={confirmDeleteProduct}>
                  <Trash className="mr-2 h-4 w-4" />
                  Delete Product
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Product Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="font-medium text-muted-foreground">Created:</dt>
                    <dd className="text-right">
                      {product.createdAt ? new Date(product.createdAt).toLocaleDateString() : "N/A"}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium text-muted-foreground">Last Updated:</dt>
                    <dd className="text-right">
                      {product.updatedAt ? new Date(product.updatedAt).toLocaleDateString() : "N/A"}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium text-muted-foreground">Views:</dt>
                    <dd className="text-right">N/A</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium text-muted-foreground">Orders:</dt>
                    <dd className="text-right">N/A</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <ConfirmationDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Delete Product"
          description="Are you sure you want to delete this product? This action cannot be undone."
          onConfirm={handleDeleteProduct}
          confirmText="Delete"
          cancelText="Cancel"
          variant="destructive"
        />

        {/* Discount Management Modal */}
        {product && (
          <DiscountManagementModal
            open={discountModalOpen}
            onOpenChange={setDiscountModalOpen}
            product={product}
            onSuccess={fetchProductDetails}
          />
        )}
      </div>
    </div>
  )
}
