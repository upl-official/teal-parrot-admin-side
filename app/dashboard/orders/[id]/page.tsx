"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Package, MapPin, Calendar, CreditCard } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { fetchApi } from "@/lib/api"
import { Badge } from "@/components/ui/badge"

export default function OrderDetailPage({ params }) {
  const orderId = params.id
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    fetchOrderDetails()
  }, [orderId])

  const fetchOrderDetails = async () => {
    try {
      setLoading(true)
      // Fetch all orders and find the specific one
      const response = await fetchApi("/api/v1/admin/user-order/list")

      if (response.success && response.data) {
        const foundOrder = response.data.find((order) => order.orderId === orderId)
        if (foundOrder) {
          setOrder(foundOrder)
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Order not found",
          })
        }
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch order details",
        })
      }
    } catch (error) {
      console.error("Error fetching order details:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch order details",
      })
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    try {
      return new Date(dateString).toLocaleDateString() + " " + new Date(dateString).toLocaleTimeString()
    } catch (error) {
      return "Invalid Date"
    }
  }

  const formatPrice = (price) => {
    if (price === null || price === undefined || isNaN(price)) {
      return "N/A"
    }
    return `₹${Number(price).toLocaleString()}`
  }

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>
      case "confirmed":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Confirmed</Badge>
      case "processing":
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Processing</Badge>
      case "shipped":
        return <Badge className="bg-indigo-100 text-indigo-800 hover:bg-indigo-100">Shipped</Badge>
      case "delivered":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Delivered</Badge>
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Cancelled</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Unknown</Badge>
    }
  }

  const getPaymentStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            Pending
          </Badge>
        )
      case "completed":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Completed
          </Badge>
        )
      case "failed":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Failed
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            Unknown
          </Badge>
        )
    }
  }

  if (loading) {
    return (
      <div>
        <Header title="Order Details" />
        <div className="p-6 flex justify-center items-center h-[calc(100vh-4rem)]">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div>
        <Header title="Order Details" />
        <div className="p-6">
          <Button variant="outline" className="mb-6" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Button>
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold mb-2">Order Not Found</h2>
            <p className="text-muted-foreground">
              The order you're looking for doesn't exist or you don't have permission to view it.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Header title="Order Details" />
      <div className="p-6">
        <Button variant="outline" className="mb-6" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Orders
        </Button>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Order #{order.orderId?.substring(0, 8) || "Unknown"}</CardTitle>
              <div className="flex items-center gap-2">
                {getStatusBadge(order.status)}
                {getPaymentStatusBadge(order.paymentStatus)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Order Information</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Order Date: {formatDate(order.placedAt)}</span>
                    </div>
                    {order.paymentDetails?.paymentMethod && (
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Payment Method: {order.paymentDetails.paymentMethod}</span>
                      </div>
                    )}
                    {order.paymentDetails?.transactionId && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Transaction ID: {order.paymentDetails.transactionId}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Product Details</h3>
                  <div className="rounded-md border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="h-10 px-4 text-left font-medium">Product</th>
                          <th className="h-10 px-4 text-left font-medium">Price</th>
                          <th className="h-10 px-4 text-left font-medium">Quantity</th>
                          <th className="h-10 px-4 text-right font-medium">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.items && order.items.length > 0 ? (
                          order.items.map((item, index) => (
                            <tr key={index} className="border-b">
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="h-12 w-12 rounded bg-gray-200 flex items-center justify-center overflow-hidden">
                                    {item.product?.image ? (
                                      <img
                                        src={item.product.image || "/placeholder.svg"}
                                        alt={item.product?.name || "Product"}
                                        className="h-full w-full object-cover"
                                        onError={(e) => {
                                          e.target.style.display = "none"
                                          e.target.nextSibling.style.display = "flex"
                                        }}
                                      />
                                    ) : null}
                                    <Package className="h-6 w-6 text-gray-500" />
                                  </div>
                                  <div>
                                    <p className="font-medium">{item.product?.name || "Unknown Product"}</p>
                                    <div className="text-xs text-muted-foreground space-y-1">
                                      {item.product?.category && <p>Category: {item.product.category}</p>}
                                      {item.product?.material && <p>Material: {item.product.material}</p>}
                                      {item.product?.grade && <p>Grade: {item.product.grade}</p>}
                                      {item.product?.size && <p>Size: {item.product.size}</p>}
                                      {item.product?.gem && <p>Gem: {item.product.gem}</p>}
                                      {item.product?.coating && <p>Coating: {item.product.coating}</p>}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4">{formatPrice(item.product?.price)}</td>
                              <td className="p-4">{item.quantity || 0}</td>
                              <td className="p-4 text-right">{formatPrice(item.totalItemPrice)}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="p-4 text-center text-muted-foreground">
                              No items found
                            </td>
                          </tr>
                        )}
                      </tbody>
                      <tfoot>
                        <tr className="border-t">
                          <td colSpan={3} className="p-4 text-right font-medium">
                            Subtotal
                          </td>
                          <td className="p-4 text-right">{formatPrice(order.orderSummary?.subtotal)}</td>
                        </tr>
                        <tr className="border-t">
                          <td colSpan={3} className="p-4 text-right font-medium">
                            Total
                          </td>
                          <td className="p-4 text-right font-bold">{formatPrice(order.totalPrice)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Shipping Address</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">{order.shippingAddress?.address || "No address provided"}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.shippingAddress?.city || "N/A"}, {order.shippingAddress?.state || "N/A"}
                    </p>
                    <p className="text-sm text-muted-foreground">Pincode: {order.shippingAddress?.pincode || "N/A"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Items:</span>
                    <span>{order.orderSummary?.totalItems || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatPrice(order.orderSummary?.subtotal)}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Total:</span>
                    <span>{formatPrice(order.totalPrice)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Order Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="relative mt-0.5">
                      <div className="h-2 w-2 rounded-full bg-green-500"></div>
                      <div className="absolute left-1 top-2 h-full w-px bg-border"></div>
                    </div>
                    <div>
                      <p className="font-medium">Order Placed</p>
                      <p className="text-sm text-muted-foreground">{formatDate(order.placedAt)}</p>
                    </div>
                  </div>
                  {order.status && order.status !== "pending" && (
                    <div className="flex items-start gap-3">
                      <div className="relative mt-0.5">
                        <div
                          className={`h-2 w-2 rounded-full ${
                            order.status === "cancelled" ? "bg-red-500" : "bg-blue-500"
                          }`}
                        ></div>
                      </div>
                      <div>
                        <p className="font-medium">
                          {order.status === "cancelled" ? "Order Cancelled" : "Order Confirmed"}
                        </p>
                        <p className="text-sm text-muted-foreground">Status updated</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
