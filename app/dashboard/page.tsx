"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/layout/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Package, Tag, Layers, ShoppingCart, Users, Ticket, Calendar, Clock, CalendarDays } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { fetchApi } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"

type OrderFilterType = "today" | "yesterday" | "week" | "all"

interface Order {
  orderId: string
  totalPrice: number
  status: string
  paymentStatus: string
  placedAt: string
  items: Array<{
    product: {
      name: string
      price: number
    }
    quantity: number
    totalItemPrice: number
  }>
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    products: 0,
    categories: 0,
    materials: 0,
    grades: 0,
    orders: 0,
    customers: 0,
    coupons: 0,
  })
  const [allOrders, setAllOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [orderFilter, setOrderFilter] = useState<OrderFilterType>("today")
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const router = useRouter()
  const { isAuthenticated: authIsAuthenticated, isLoading: authIsLoading } = useAuth()

  // Function to safely fetch data with fallback
  const safelyFetchData = async (endpoint, fallback = []) => {
    try {
      console.log(`Fetching from endpoint: ${endpoint}`)
      const response = await fetchApi(endpoint)
      console.log(`Response from ${endpoint}:`, response)

      // Handle different response formats
      if (response.data) {
        return response.data
      } else if (Array.isArray(response)) {
        return response
      } else {
        return response
      }
    } catch (error) {
      console.log(`Error fetching ${endpoint}:`, error.message)
      return fallback
    }
  }

  // Filter orders based on selected timeframe
  const filterOrdersByTimeframe = (orders: Order[], filter: OrderFilterType) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const weekStart = new Date(today)
    weekStart.setDate(weekStart.getDate() - 7)

    // Only show successful orders (confirmed status and completed payment)
    const successfulOrders = orders.filter(
      (order) => order.status === "confirmed" && order.paymentStatus === "completed",
    )

    switch (filter) {
      case "today":
        return successfulOrders.filter((order) => {
          const orderDate = new Date(order.placedAt)
          return orderDate >= today
        })
      case "yesterday":
        const yesterdayEnd = new Date(yesterday)
        yesterdayEnd.setDate(yesterdayEnd.getDate() + 1)
        return successfulOrders.filter((order) => {
          const orderDate = new Date(order.placedAt)
          return orderDate >= yesterday && orderDate < yesterdayEnd
        })
      case "week":
        return successfulOrders.filter((order) => {
          const orderDate = new Date(order.placedAt)
          return orderDate >= weekStart
        })
      case "all":
        return successfulOrders
      default:
        return successfulOrders
    }
  }

  // Handle filter change
  const handleFilterChange = (filter: OrderFilterType) => {
    if (filter === "all") {
      router.push("/dashboard/orders")
      return
    }

    setOrderFilter(filter)
    const filtered = filterOrdersByTimeframe(allOrders, filter)
    setFilteredOrders(filtered)
  }

  // Get filter button label
  const getFilterLabel = (filter: OrderFilterType) => {
    switch (filter) {
      case "today":
        return "Today's Orders"
      case "yesterday":
        return "Yesterday's Orders"
      case "week":
        return "This Week's Orders"
      case "all":
        return "All Orders"
      default:
        return "Today's Orders"
    }
  }

  // Get filter icon
  const getFilterIcon = (filter: OrderFilterType) => {
    switch (filter) {
      case "today":
        return Calendar
      case "yesterday":
        return Clock
      case "week":
        return CalendarDays
      case "all":
        return ShoppingCart
      default:
        return Calendar
    }
  }

  useEffect(() => {
    // Don't fetch data if auth is still loading or user is not authenticated
    if (authIsLoading || !authIsAuthenticated) {
      return
    }

    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        console.log("Starting dashboard data fetch...")

        // Fetch all data in parallel for better performance
        const [
          productsResponse,
          categoriesResponse,
          materialsResponse,
          gradesResponse,
          couponsResponse,
          usersResponse,
          ordersResponse,
        ] = await Promise.all([
          safelyFetchData("/api/v1/product/list/", { products: [] }),
          safelyFetchData("/api/v1/category/cat-list/", []),
          safelyFetchData("/api/v1/material/mat-list/", []),
          safelyFetchData("/api/v1/grade/gra-list/", []),
          safelyFetchData("/api/v1/coupon/coupon-list/", []),
          safelyFetchData("/api/v1/admin/user/list", []),
          safelyFetchData("/api/v1/admin/user-order/list", { data: [] }),
        ])

        console.log("Categories response:", categoriesResponse)
        console.log("Materials response:", materialsResponse)
        console.log("Users response:", usersResponse)
        console.log("Coupons response:", couponsResponse)
        console.log("Orders response:", ordersResponse)

        // Extract products from the nested structure
        const productsData = productsResponse.products || []

        // For categories, materials, and grades, use the data array directly or from the response
        const categoriesData = Array.isArray(categoriesResponse) ? categoriesResponse : categoriesResponse.data || []
        const materialsData = Array.isArray(materialsResponse) ? materialsResponse : materialsResponse.data || []
        const gradesData = Array.isArray(gradesResponse) ? gradesResponse : gradesResponse.data || []
        const couponsData = Array.isArray(couponsResponse) ? couponsResponse : couponsResponse.data || []
        const usersData = Array.isArray(usersResponse) ? usersResponse : usersResponse.data || []

        // Get orders data - use the new API structure
        const ordersData = Array.isArray(ordersResponse) ? ordersResponse : ordersResponse.data || []

        // Count active coupons
        const now = new Date()
        const activeCoupons = couponsData.filter((coupon) => {
          const validFrom = new Date(coupon.validFrom)
          const validUntil = new Date(coupon.validUntil)
          return now >= validFrom && now <= validUntil
        })

        console.log("Processed data counts:")
        console.log("Products:", productsData.length)
        console.log("Categories:", categoriesData.length)
        console.log("Materials:", materialsData.length)
        console.log("Grades:", gradesData.length)
        console.log("Orders:", ordersData.length)
        console.log("Users:", usersData.length)
        console.log("Active Coupons:", activeCoupons.length)

        // Update stats with available data
        setStats({
          products: productsData.length || 0,
          categories: categoriesData.length || 0,
          materials: materialsData.length || 0,
          grades: gradesData.length || 0,
          orders: ordersData.length || 0,
          customers: usersData.length || 0,
          coupons: activeCoupons.length || 0,
        })

        // Set all orders and filter for initial display
        setAllOrders(ordersData)
        const initialFiltered = filterOrdersByTimeframe(ordersData, orderFilter)
        setFilteredOrders(initialFiltered)
      } catch (error) {
        console.error("Dashboard data fetch error:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Some dashboard data could not be loaded. Please try refreshing the page.",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [toast, authIsAuthenticated, authIsLoading, orderFilter])

  // Show loading state while auth is being checked
  if (authIsLoading) {
    return (
      <div>
        <Header title="Dashboard" />
        <div className="p-4 lg:p-6">
          <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="h-4 w-24 animate-pulse rounded bg-gray-200"></div>
                  <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 w-16 animate-pulse rounded bg-gray-200"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!authIsAuthenticated) {
    router.push("/login")
    return null
  }

  const statCards = [
    {
      title: "Total Products",
      value: stats.products,
      icon: Package,
      color: "bg-blue-100 text-blue-600",
      link: "/dashboard/products",
    },
    {
      title: "Categories",
      value: stats.categories,
      icon: Tag,
      color: "bg-green-100 text-green-600",
      link: "/dashboard/categories",
    },
    {
      title: "Materials",
      value: stats.materials,
      icon: Layers,
      color: "bg-purple-100 text-purple-600",
      link: "/dashboard/materials",
    },
    {
      title: "Orders",
      value: stats.orders,
      icon: ShoppingCart,
      color: "bg-amber-100 text-amber-600",
      link: "/dashboard/orders",
    },
    {
      title: "Customers",
      value: stats.customers,
      icon: Users,
      color: "bg-rose-100 text-rose-600",
      link: "/dashboard/profiles",
    },
    {
      title: "Active Coupons",
      value: stats.coupons,
      icon: Ticket,
      color: "bg-teal-100 text-teal-600",
      link: "/dashboard/coupons",
    },
  ]

  const filterOptions: OrderFilterType[] = ["today", "yesterday", "week", "all"]

  return (
    <div>
      <Header title="Dashboard" />
      <div className="p-4 lg:p-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
          {statCards.map((card, index) => (
            <Card
              key={index}
              className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
              onClick={() => router.push(card.link)}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <div className={`rounded-full p-2 ${card.color}`}>
                  <card.icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-8 w-16 animate-pulse rounded bg-gray-200"></div>
                ) : (
                  <div className="text-2xl font-bold">{card.value}</div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Orders Section */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Successful orders from customers</CardDescription>
              </div>

              {/* Filter Buttons */}
              <div className="flex flex-wrap gap-2">
                {filterOptions.map((filter) => {
                  const Icon = getFilterIcon(filter)
                  const isActive = orderFilter === filter

                  return (
                    <Button
                      key={filter}
                      variant={isActive ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleFilterChange(filter)}
                      className={cn(
                        "flex items-center gap-2 text-xs sm:text-sm",
                        isActive && "bg-[#28acc1] hover:bg-[#28acc1]/90",
                      )}
                    >
                      <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">{getFilterLabel(filter)}</span>
                      <span className="sm:hidden">
                        {filter === "today"
                          ? "Today"
                          : filter === "yesterday"
                            ? "Yesterday"
                            : filter === "week"
                              ? "Week"
                              : "All"}
                      </span>
                    </Button>
                  )
                })}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 animate-pulse rounded bg-gray-200"></div>
                ))}
              </div>
            ) : filteredOrders.length > 0 ? (
              <div className="space-y-4">
                {filteredOrders.slice(0, 10).map((order, index) => (
                  <div
                    key={index}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b pb-3 cursor-pointer hover:bg-muted/50 p-2 rounded-md gap-2"
                    onClick={() => router.push(`/dashboard/orders/${order.orderId}`)}
                  >
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                        <p className="font-medium text-sm">Order #{order.orderId?.substring(0, 8) || `${index + 1}`}</p>
                        <div className="flex gap-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {order.status}
                          </span>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {order.paymentStatus}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {order.placedAt
                          ? new Date(order.placedAt).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "N/A"}
                      </p>
                      {order.items && order.items.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {order.items.length} item{order.items.length > 1 ? "s" : ""} • {order.items[0]?.product?.name}
                          {order.items.length > 1 && ` +${order.items.length - 1} more`}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">₹{(order.totalPrice || 0).toLocaleString()}</p>
                    </div>
                  </div>
                ))}

                {filteredOrders.length > 10 && (
                  <div className="pt-4 text-center">
                    <Button variant="outline" onClick={() => router.push("/dashboard/orders")} className="text-sm">
                      View All {filteredOrders.length} Orders
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex h-24 items-center justify-center">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    No{" "}
                    {orderFilter === "today"
                      ? "today's"
                      : orderFilter === "yesterday"
                        ? "yesterday's"
                        : orderFilter === "week"
                          ? "this week's"
                          : ""}{" "}
                    successful orders to display
                  </p>
                  <Button variant="link" size="sm" onClick={() => handleFilterChange("all")} className="text-xs mt-1">
                    View all orders
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
