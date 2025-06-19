"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Eye, Calendar } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { fetchApi } from "@/lib/api"
import { EnhancedPagination } from "@/components/ui/enhanced-pagination"

export default function UserOrdersPage({ params }) {
  const userId = params.id
  const [user, setUser] = useState(null)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [userLoading, setUserLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState("")
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    fetchUserDetails()
    fetchUserOrders()
  }, [userId])

  const fetchUserDetails = async () => {
    try {
      setUserLoading(true)
      const response = await fetchApi(`/api/v1/admin/user/list?userId=${userId}`)

      if (response.success && response.data) {
        setUser(response.data)
      }
    } catch (error) {
      console.error("Failed to fetch user details:", error)
    } finally {
      setUserLoading(false)
    }
  }

  const fetchUserOrders = async () => {
    try {
      setLoading(true)
      const response = await fetchApi(`/api/v1/admin/user-order/list?user=${userId}`)

      if (response.success && response.data) {
        setOrders(response.data)
      } else {
        setOrders([])
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch user orders",
      })
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  // Filter orders based on search term
  const filteredOrders = orders.filter((order) => {
    if (!searchTerm.trim()) return true

    return (
      order.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.items.some((item) => item.product.name.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  })

  // Calculate pagination
  const totalItems = filteredOrders.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const currentOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage)

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

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1)
  }

  return (
    <div>
      <Header title="User Orders" />
      <div className="p-6">
        <Button variant="outline" className="mb-6" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to User Details
        </Button>

        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-semibold">
              Orders for {userLoading ? "Loading..." : user?.name || "Unknown User"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {totalItems} {totalItems === 1 ? "order" : "orders"} total
            </p>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg
              className="w-4 h-4 text-gray-500"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 20 20"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
              />
            </svg>
          </div>
          <input
            type="search"
            className="block w-full p-2 pl-10 text-sm border rounded-lg bg-background"
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
          />
        </div>

        {/* Orders Table */}
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="h-10 px-2 text-left font-medium">Order ID</th>
                <th className="h-10 px-2 text-left font-medium">Date</th>
                <th className="h-10 px-2 text-left font-medium hidden md:table-cell">Items</th>
                <th className="h-10 px-2 text-left font-medium">Total</th>
                <th className="h-10 px-2 text-left font-medium">Status</th>
                <th className="h-10 px-2 text-left font-medium hidden lg:table-cell">Payment</th>
                <th className="h-10 px-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="h-24 text-center">
                    <div className="flex justify-center items-center h-full">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    </div>
                  </td>
                </tr>
              ) : currentOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="h-24 text-center">
                    {searchTerm ? "No orders found matching your search." : "No orders found for this user."}
                  </td>
                </tr>
              ) : (
                currentOrders.map((order) => (
                  <tr key={order.orderId} className="border-b hover:bg-muted/50">
                    <td className="p-2">
                      <span className="font-medium">#{order.orderId.substring(0, 8)}</span>
                    </td>
                    <td className="p-2">
                      <div className="flex items-center">
                        <Calendar className="mr-1 h-3 w-3 text-muted-foreground" />
                        <span className="text-xs">{formatDate(order.placedAt)}</span>
                      </div>
                    </td>
                    <td className="p-2 hidden md:table-cell">
                      <div className="space-y-1">
                        {order.items.slice(0, 2).map((item, index) => (
                          <div key={index} className="text-xs">
                            {item.product.name} (×{item.quantity})
                          </div>
                        ))}
                        {order.items.length > 2 && (
                          <div className="text-xs text-muted-foreground">+{order.items.length - 2} more</div>
                        )}
                      </div>
                    </td>
                    <td className="p-2">
                      <span className="font-medium">₹{order.totalPrice.toLocaleString()}</span>
                    </td>
                    <td className="p-2">{getStatusBadge(order.status)}</td>
                    <td className="p-2 hidden lg:table-cell">{getPaymentStatusBadge(order.paymentStatus)}</td>
                    <td className="p-2 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => router.push(`/dashboard/orders/${order.orderId}`)}
                          className="h-8 w-8"
                          title="View Order Details"
                        >
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">View Details</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Enhanced Pagination */}
        <EnhancedPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      </div>
    </div>
  )
}
