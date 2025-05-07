"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, Package, ChevronLeft, ChevronRight } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { fetchApi } from "@/lib/api"

export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [itemsPerPage] = useState(10)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    fetchOrders(currentPage)
  }, [currentPage])

  const fetchOrders = async (page = 1) => {
    try {
      setLoading(true)

      // Try multiple possible order endpoints
      const orderEndpoints = ["/api/v1/admin/order/list", "/api/v1/users/order/list"]

      let ordersData = null
      let fetchSuccess = false

      for (const endpoint of orderEndpoints) {
        try {
          console.log(`Trying to fetch orders from: ${endpoint}`)
          const response = await fetchApi(`${endpoint}?page=${page}&limit=${itemsPerPage}`)
          // Handle nested data structure
          const data = response.data || response
          if (data && data.orders) {
            console.log(`Successfully fetched orders from ${endpoint}`)
            ordersData = data
            fetchSuccess = true
            break
          }
        } catch (error) {
          console.log(`Failed to fetch orders from ${endpoint}:`, error.message)
        }
      }

      if (fetchSuccess) {
        setOrders(ordersData.orders || [])

        // Calculate total pages
        const totalCount = ordersData.totalCount || ordersData.orders.length
        setTotalPages(Math.ceil(totalCount / itemsPerPage))
      } else {
        // If all endpoints fail, show a toast and use empty array
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch orders from any available endpoint",
        })
        setOrders([])
        setTotalPages(1)
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch orders",
      })
      setOrders([])
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (term) => {
    setSearchTerm(term)
    setCurrentPage(1) // Reset to first page on search

    // If search term is empty, fetch all orders
    if (!term.trim()) {
      fetchOrders(1)
      return
    }

    // Otherwise, fetch filtered orders
    fetchFilteredOrders(term)
  }

  const fetchFilteredOrders = async (term) => {
    try {
      setLoading(true)

      // Try multiple possible order endpoints with search parameter
      const orderEndpoints = ["/api/v1/admin/order/list", "/api/v1/users/order/list"]

      let ordersData = null
      let fetchSuccess = false

      for (const endpoint of orderEndpoints) {
        try {
          const response = await fetchApi(`${endpoint}?search=${term}&page=${currentPage}&limit=${itemsPerPage}`)
          const data = response.data || response
          if (data && data.orders) {
            ordersData = data
            fetchSuccess = true
            break
          }
        } catch (error) {
          console.log(`Failed to search orders from ${endpoint}:`, error.message)
        }
      }

      if (fetchSuccess) {
        setOrders(ordersData.orders || [])

        // Calculate total pages for filtered results
        const totalCount = ordersData.totalCount || ordersData.orders.length
        setTotalPages(Math.ceil(totalCount / itemsPerPage))
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to search orders",
        })
        setOrders([])
        setTotalPages(1)
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to search orders",
      })
      setOrders([])
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return
    setCurrentPage(page)
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString()
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

  return (
    <div>
      <Header title="Orders" />
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold">All Orders</h2>
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
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        {/* Orders Table */}
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="h-10 px-2 text-left font-medium">Order ID</th>
                <th className="h-10 px-2 text-left font-medium">Customer</th>
                <th className="h-10 px-2 text-left font-medium">Date</th>
                <th className="h-10 px-2 text-left font-medium hidden md:table-cell">Product</th>
                <th className="h-10 px-2 text-left font-medium hidden md:table-cell">Qty</th>
                <th className="h-10 px-2 text-left font-medium">Total</th>
                <th className="h-10 px-2 text-left font-medium">Status</th>
                <th className="h-10 px-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="h-24 text-center">
                    <div className="flex justify-center items-center h-full">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    </div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="h-24 text-center">
                    No orders found.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order._id} className="border-b hover:bg-muted/50">
                    <td className="p-2">
                      <span className="font-medium">#{order._id?.substring(0, 8) || "N/A"}</span>
                    </td>
                    <td className="p-2">{order.userId?.name || "Anonymous"}</td>
                    <td className="p-2">{formatDate(order.createdAt)}</td>
                    <td className="p-2 hidden md:table-cell">{order.productId?.name || "Unknown Product"}</td>
                    <td className="p-2 hidden md:table-cell">{order.quantity || 0}</td>
                    <td className="p-2">₹{order.totalAmount || "N/A"}</td>
                    <td className="p-2">{getStatusBadge(order.status)}</td>
                    <td className="p-2 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => router.push(`/dashboard/orders/${order._id || "detail"}`)}
                          className="h-8 w-8"
                          title="View Order Details"
                        >
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">View Details</span>
                        </Button>
                        {order.productId?._id && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push(`/dashboard/products/edit/${order.productId._id}`)}
                            className="h-8 w-8"
                            title="View Product"
                          >
                            <Package className="h-4 w-4" />
                            <span className="sr-only">View Product</span>
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-6">
            <nav className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Previous Page</span>
              </Button>

              {/* Page Numbers */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  // Show pages around current page
                  let pageNum
                  if (totalPages <= 5) {
                    // If 5 or fewer pages, show all
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    // If near start, show first 5
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    // If near end, show last 5
                    pageNum = totalPages - 4 + i
                  } else {
                    // Otherwise show current and 2 on each side
                    pageNum = currentPage - 2 + i
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="icon"
                      onClick={() => handlePageChange(pageNum)}
                      className="w-8 h-8"
                    >
                      {pageNum}
                    </Button>
                  )
                })}
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">Next Page</span>
              </Button>
            </nav>
          </div>
        )}
      </div>
    </div>
  )
}
