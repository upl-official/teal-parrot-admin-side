"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, User, Mail, Phone, Calendar, Edit, ShoppingBag, Trash2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { fetchApi } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"

export default function UserDetailPage({ params }) {
  const userId = params.id
  const [user, setUser] = useState(null)
  const [userOrders, setUserOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    fetchUserDetails()
    fetchUserOrders()
  }, [userId])

  const fetchUserDetails = async () => {
    try {
      setLoading(true)
      const response = await fetchApi(`/api/v1/admin/user/list?userId=${userId}`)

      if (response.success && response.data) {
        setUser(response.data)
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch user details",
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch user details",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchUserOrders = async () => {
    try {
      setOrdersLoading(true)
      const response = await fetchApi(`/api/v1/admin/user-order/list?user=${userId}`)

      if (response.success && response.data) {
        setUserOrders(response.data)
      } else {
        setUserOrders([])
      }
    } catch (error) {
      console.error("Failed to fetch user orders:", error)
      setUserOrders([])
    } finally {
      setOrdersLoading(false)
    }
  }

  const handleDeleteUser = async () => {
    try {
      setDeleteLoading(true)
      await fetchApi("/api/v1/admin/user/remove", {
        method: "POST",
        body: JSON.stringify({
          userId: userId,
        }),
      })

      toast({
        title: "Success",
        description: "User deleted successfully",
      })

      router.push("/dashboard/profiles")
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete user",
      })
    } finally {
      setDeleteLoading(false)
      setDeleteDialogOpen(false)
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

  if (loading) {
    return (
      <div>
        <Header title="User Details" />
        <div className="p-6 flex justify-center items-center h-[calc(100vh-4rem)]">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div>
        <Header title="User Details" />
        <div className="p-6">
          <Button variant="outline" className="mb-6" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Users
          </Button>
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold mb-2">User Not Found</h2>
            <p className="text-muted-foreground">
              The user you're looking for doesn't exist or you don't have permission to view it.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Header title="User Details" />
      <div className="p-6">
        <Button variant="outline" className="mb-6" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Users
        </Button>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {user.name}
              </CardTitle>
              <div className="flex items-center gap-2">
                {user.isActive ? (
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
                ) : (
                  <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">
                    Inactive
                  </Badge>
                )}
                <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/profiles/${userId}/edit`)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteDialogOpen(true)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">User Information</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Email</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Phone</p>
                        <p className="text-sm text-muted-foreground">{user.phone || "N/A"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Joined</p>
                        <p className="text-sm text-muted-foreground">{formatDate(user.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Last Updated</p>
                        <p className="text-sm text-muted-foreground">{formatDate(user.updatedAt)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium">Recent Orders</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/dashboard/profiles/${userId}/orders`)}
                    >
                      <ShoppingBag className="mr-2 h-4 w-4" />
                      View All Orders
                    </Button>
                  </div>

                  {ordersLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                    </div>
                  ) : userOrders.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">No orders found for this user.</p>
                  ) : (
                    <div className="rounded-md border">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="h-10 px-4 text-left font-medium">Order ID</th>
                            <th className="h-10 px-4 text-left font-medium">Date</th>
                            <th className="h-10 px-4 text-left font-medium">Total</th>
                            <th className="h-10 px-4 text-left font-medium">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {userOrders.slice(0, 5).map((order) => (
                            <tr key={order.orderId} className="border-b hover:bg-muted/50">
                              <td className="p-4">
                                <span className="font-medium">#{order.orderId.substring(0, 8)}</span>
                              </td>
                              <td className="p-4">{formatDate(order.placedAt)}</td>
                              <td className="p-4">₹{order.totalPrice.toLocaleString()}</td>
                              <td className="p-4">{getStatusBadge(order.status)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Orders:</span>
                    <span className="font-medium">{userOrders.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Spent:</span>
                    <span className="font-medium">
                      ₹{userOrders.reduce((sum, order) => sum + order.totalPrice, 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Account Status:</span>
                    <span className="font-medium">
                      {user.isActive ? (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">
                          Inactive
                        </Badge>
                      )}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => router.push(`/dashboard/profiles/${userId}/edit`)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit User Details
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => router.push(`/dashboard/profiles/${userId}/orders`)}
                  >
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    View All Orders
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <ConfirmationDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Delete User"
          description={`Are you sure you want to delete ${user.name}? This action cannot be undone and will remove all associated data.`}
          onConfirm={handleDeleteUser}
          confirmText={deleteLoading ? "Deleting..." : "Delete"}
          variant="destructive"
        />
      </div>
    </div>
  )
}
