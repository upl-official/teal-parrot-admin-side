"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, MapPin, Calendar } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { fetchApi } from "@/lib/api"
import { EnhancedPagination } from "@/components/ui/enhanced-pagination"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// ――― null-safe lower-case helper ―――
const toLower = (v: unknown) => (typeof v === "string" ? v.toLowerCase() : "")

export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [paymentFilter, setPaymentFilter] = useState("all")
  const [sortDirection, setSortDirection] = useState("desc") // Default to descending (newest first)
  const router = useRouter()
  const { toast } = useToast()

  // Filter orders
  const filteredOrders = orders
    .filter((order) => {
      const search = toLower(searchTerm)

      /* ---------- search match ---------- */
      const idMatch = toLower(order?.orderId ?? "").includes(search)

      const itemMatch = order?.items?.some((it) => toLower(it?.product?.name ?? "").includes(search)) ?? false

      /* ---------- status / payment match ---------- */
      const matchesStatus = statusFilter === "all" || toLower(order?.status).trim() === statusFilter

      const matchesPayment = paymentFilter === "all" || toLower(order?.paymentStatus).trim() === paymentFilter

      return (idMatch || itemMatch) && matchesStatus && matchesPayment
    })
    /* ---------- sort by date ---------- */
    .sort((a, b) => {
      const dateA = new Date(a?.placedAt ?? 0).getTime()
      const dateB = new Date(b?.placedAt ?? 0).getTime()
      return sortDirection === "asc" ? dateA - dateB : dateB - dateA
    })

  const totalItems = filteredOrders.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const currentOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage)

  useEffect(() => {
    fetchOrders()
  }, [])

  useEffect(() => {
    setCurrentPage(1) // Reset to first page when filters change
  }, [searchTerm, statusFilter, paymentFilter, sortDirection])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const response = await fetchApi("/api/v1/admin/user-order/list")

      if (response.success && response.data) {
        setOrders(response.data)
      } else {
        setOrders([])
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch orders",
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch orders",
      })
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString() + " " + new Date(dateString).toLocaleTimeString()
  }

  const getStatusBadge = (status: string | undefined) => {
    switch (toLower(status)) {
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case "confirmed":
        return <Badge className="bg-blue-100 text-blue-800">Confirmed</Badge>
      case "processing":
        return <Badge className="bg-purple-100 text-purple-800">Processing</Badge>
      case "shipped":
        return <Badge className="bg-indigo-100 text-indigo-800">Shipped</Badge>
      case "delivered":
        return <Badge className="bg-green-100 text-green-800">Delivered</Badge>
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>
    }
  }

  const getPaymentStatusBadge = (status: string | undefined) => {
    switch (toLower(status)) {
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
      <Header title="Orders" />
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-semibold">All Orders</h2>
            <p className="text-sm text-muted-foreground">
              {totalItems} {totalItems === 1 ? "order" : "orders"} total
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 gap-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search Input */}
            <div className="relative">
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
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            {/* Payment Filter */}
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="pending">Payment Pending</SelectItem>
                <SelectItem value="completed">Payment Completed</SelectItem>
                <SelectItem value="failed">Payment Failed</SelectItem>
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("")
                setStatusFilter("all")
                setPaymentFilter("all")
              }}
            >
              Clear Filters
            </Button>
          </div>

          {/* Sort Controls */}
          <div className="flex justify-end items-center">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground mr-2">Sort by date:</span>
              <Button
                size="sm"
                variant={sortDirection === "desc" ? "default" : "outline"}
                onClick={() => setSortDirection("desc")}
                className="h-9"
              >
                Newest First
              </Button>
              <Button
                size="sm"
                variant={sortDirection === "asc" ? "default" : "outline"}
                onClick={() => setSortDirection("asc")}
                className="h-9"
              >
                Oldest First
              </Button>
            </div>
          </div>
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
                <th className="h-10 px-2 text-left font-medium hidden lg:table-cell">Address</th>
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
              ) : currentOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="h-24 text-center">
                    {searchTerm || statusFilter !== "all" || paymentFilter !== "all"
                      ? "No orders found matching your filters."
                      : "No orders found."}
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
                        {(order.items ?? []).slice(0, 2).map((item, index) => (
                          <div key={index} className="text-xs">
                            {item.product.name} (×{item.quantity})
                          </div>
                        ))}
                        {(order.items?.length ?? 0) > 2 && (
                          <div className="text-xs text-muted-foreground">+{order.items.length - 2} more</div>
                        )}
                      </div>
                    </td>
                    <td className="p-2">
                      <span className="font-medium">
                        ₹{typeof order.totalPrice === "number" ? order.totalPrice.toLocaleString() : "N/A"}
                      </span>
                    </td>
                    <td className="p-2">{getStatusBadge(order.status)}</td>
                    <td className="p-2 hidden lg:table-cell">{getPaymentStatusBadge(order.paymentStatus)}</td>
                    <td className="p-2 hidden lg:table-cell">
                      <div className="flex items-center text-xs">
                        <MapPin className="mr-1 h-3 w-3 text-muted-foreground" />
                        <span>
                          {order.shippingAddress.city}, {order.shippingAddress.state}
                        </span>
                      </div>
                    </td>
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
