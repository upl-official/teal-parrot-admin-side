"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Package, User, MapPin, Calendar, CreditCard, Truck } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { fetchApi } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function OrderDetailPage({ params }) {
  const orderId = params.id
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    fetchOrderDetails()
  }, [orderId])

  const fetchOrderDetails = async () => {
    try {
      setLoading(true)

      // Try multiple possible order endpoints
      const orderEndpoints = [
        `/api/v1/admin/order/detail?orderId=${orderId}`,
        `/api/v1/users/order/detail?orderId=${orderId}`,
      ]

      let orderData = null
      let fetchSuccess = false

      for (const endpoint of orderEndpoints) {
        try {
          console.log(`Trying to fetch order details from: ${endpoint}`)
          const response = await fetchApi(endpoint)
          // Handle nested data structure
          const data = response.data || response
          if (data && (data.order || data._id)) {
            console.log(`Successfully fetched order details from ${endpoint}`)
            orderData = data.order || data
            fetchSuccess = true
            break
          }
        } catch (error) {
          console.log(`Failed to fetch order details from ${endpoint}:`, error.message)
        }
      }

      if (fetchSuccess) {
        setOrder(orderData)
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch order details",
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch order details",
      })
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (newStatus) => {
    try {
      setUpdatingStatus(true)

      await fetchApi("/api/v1/admin/order/update-status", {
        method: "PUT",
        body: JSON.stringify({
          orderId,
          status: newStatus,
        }),
      })

      toast({
        title: "Success",
        description: "Order status updated successfully",
      })

      // Refresh order details
      fetchOrderDetails()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update order status",
      })
    } finally {
      setUpdatingStatus(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString() + " " + new Date(dateString).toLocaleTimeString()
  }

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>
      case "processing":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Processing</Badge>
      case "shipped":
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Shipped</Badge>
      case "delivered":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Delivered</Badge>
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Cancelled</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Processing</Badge>
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
              <CardTitle>Order #{order._id?.substring(0, 8) || "N/A"}</CardTitle>
              <div className="flex items-center gap-2">
                {getStatusBadge(order.status)}
                <Select
                  value={order.status?.toLowerCase() || "processing"}
                  onValueChange={updateOrderStatus}
                  disabled={updatingStatus}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Update Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Order Information</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Order Date: {formatDate(order.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Payment Method: {order.paymentMethod || "Cash on Delivery"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Shipping Method: {order.shippingMethod || "Standard Delivery"}</span>
                    </div>
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
                        <tr className="border-b">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded bg-gray-200 flex items-center justify-center">
                                <Package className="h-5 w-5 text-gray-500" />
                              </div>
                              <div>
                                <p className="font-medium">{order.productId?.name || "Unknown Product"}</p>
                                <p className="text-xs text-muted-foreground">
                                  {order.productId?.category?.name || "Uncategorized"}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">₹{order.productId?.price || "N/A"}</td>
                          <td className="p-4">{order.quantity || 1}</td>
                          <td className="p-4 text-right">₹{order.totalAmount || "N/A"}</td>
                        </tr>
                      </tbody>
                      <tfoot>
                        <tr className="border-t">
                          <td colSpan={3} className="p-4 text-right font-medium">
                            Subtotal
                          </td>
                          <td className="p-4 text-right">₹{order.totalAmount || "N/A"}</td>
                        </tr>
                        <tr>
                          <td colSpan={3} className="p-4 text-right font-medium">
                            Shipping
                          </td>
                          <td className="p-4 text-right">₹{order.shippingCost || "0"}</td>
                        </tr>
                        <tr>
                          <td colSpan={3} className="p-4 text-right font-medium">
                            Discount
                          </td>
                          <td className="p-4 text-right">-₹{order.discount || "0"}</td>
                        </tr>
                        <tr className="border-t">
                          <td colSpan={3} className="p-4 text-right font-medium">
                            Total
                          </td>
                          <td className="p-4 text-right font-bold">₹{order.totalAmount || "N/A"}</td>
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
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{order.userId?.name || "Anonymous"}</p>
                      <p className="text-sm text-muted-foreground">{order.userId?.email || "No email provided"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{order.userId?.phone || "No phone provided"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Shipping Address</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">{order.addressId?.address || "No address provided"}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.addressId?.city || ""}, {order.addressId?.state || ""}
                    </p>
                    <p className="text-sm text-muted-foreground">Pincode: {order.addressId?.pincode || "N/A"}</p>
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
                      <p className="text-sm text-muted-foreground">{formatDate(order.createdAt)}</p>
                    </div>
                  </div>
                  {order.status && order.status.toLowerCase() !== "pending" && (
                    <div className="flex items-start gap-3">
                      <div className="relative mt-0.5">
                        <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                        <div className="absolute left-1 top-2 h-full w-px bg-border"></div>
                      </div>
                      <div>
                        <p className="font-medium">Order Processing</p>
                        <p className="text-sm text-muted-foreground">{formatDate(order.updatedAt)}</p>
                      </div>
                    </div>
                  )}
                  {order.status && ["shipped", "delivered"].includes(order.status.toLowerCase()) && (
                    <div className="flex items-start gap-3">
                      <div className="relative mt-0.5">
                        <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                        <div className="absolute left-1 top-2 h-full w-px bg-border"></div>
                      </div>
                      <div>
                        <p className="font-medium">Order Shipped</p>
                        <p className="text-sm text-muted-foreground">{formatDate(order.updatedAt)}</p>
                      </div>
                    </div>
                  )}
                  {order.status && order.status.toLowerCase() === "delivered" && (
                    <div className="flex items-start gap-3">
                      <div className="relative mt-0.5">
                        <div className="h-2 w-2 rounded-full bg-green-500"></div>
                      </div>
                      <div>
                        <p className="font-medium">Order Delivered</p>
                        <p className="text-sm text-muted-foreground">{formatDate(order.updatedAt)}</p>
                      </div>
                    </div>
                  )}
                  {order.status && order.status.toLowerCase() === "cancelled" && (
                    <div className="flex items-start gap-3">
                      <div className="relative mt-0.5">
                        <div className="h-2 w-2 rounded-full bg-red-500"></div>
                      </div>
                      <div>
                        <p className="font-medium">Order Cancelled</p>
                        <p className="text-sm text-muted-foreground">{formatDate(order.updatedAt)}</p>
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

import { Phone } from "lucide-react"
