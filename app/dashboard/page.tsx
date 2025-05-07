"use client"

import { useEffect, useState } from "react"
import Header from "@/components/layout/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, Tag, Layers, ShoppingCart, Users, Ticket, TrendingUp } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { fetchApi } from "@/lib/api"
import { useRouter } from "next/navigation"

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
  const [recentOrders, setRecentOrders] = useState([])
  const [popularProducts, setPopularProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const router = useRouter()

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

  useEffect(() => {
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
          safelyFetchData("/api/v1/admin/order/list", { orders: [] }),
        ])

        console.log("Categories response:", categoriesResponse)
        console.log("Materials response:", materialsResponse)
        console.log("Users response:", usersResponse)
        console.log("Coupons response:", couponsResponse)

        // Extract products from the nested structure
        const productsData = productsResponse.products || []

        // For categories, materials, and grades, use the data array directly or from the response
        const categoriesData = Array.isArray(categoriesResponse) ? categoriesResponse : categoriesResponse.data || []

        const materialsData = Array.isArray(materialsResponse) ? materialsResponse : materialsResponse.data || []

        const gradesData = Array.isArray(gradesResponse) ? gradesResponse : gradesResponse.data || []

        const couponsData = Array.isArray(couponsResponse) ? couponsResponse : couponsResponse.data || []

        const usersData = Array.isArray(usersResponse) ? usersResponse : usersResponse.data || []

        // Get orders data
        const ordersData = ordersResponse.orders || []

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

        // Set recent orders
        setRecentOrders(ordersData.slice(0, 5) || [])

        // Set popular products (for demo, just using first few products)
        setPopularProducts(productsData.slice(0, 5) || [])
      } catch (error) {
        console.error("Dashboard data fetch error:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Some dashboard data could not be loaded",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [toast])

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

  return (
    <div>
      <Header title="Dashboard" />
      <div className="p-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Latest orders from customers</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-12 animate-pulse rounded bg-gray-200"></div>
                  ))}
                </div>
              ) : recentOrders.length > 0 ? (
                <div className="space-y-4">
                  {recentOrders.map((order, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between border-b pb-2 cursor-pointer hover:bg-muted/50 p-2 rounded-md"
                      onClick={() => router.push(`/dashboard/orders/${order._id}`)}
                    >
                      <div>
                        <p className="font-medium">Order #{order._id?.substring(0, 8) || `${index + 1}`}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "N/A"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">₹{order.totalAmount || "N/A"}</p>
                        <p className="text-sm text-muted-foreground">{order.status || "Processing"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-24 items-center justify-center">
                  <p className="text-sm text-muted-foreground">No recent orders to display</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Popular Products</CardTitle>
              <CardDescription>Most viewed products</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-12 animate-pulse rounded bg-gray-200"></div>
                  ))}
                </div>
              ) : popularProducts.length > 0 ? (
                <div className="space-y-4">
                  {popularProducts.map((product, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between border-b pb-2 cursor-pointer hover:bg-muted/50 p-2 rounded-md"
                      onClick={() => router.push(`/dashboard/products/edit/${product._id}`)}
                    >
                      <div className="flex items-center">
                        <div className="mr-2 h-8 w-8 rounded bg-gray-200 flex items-center justify-center">
                          <Package className="h-4 w-4 text-gray-500" />
                        </div>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">{product.category?.name || "Uncategorized"}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <p className="font-medium">₹{product.price}</p>
                        <TrendingUp className="ml-2 h-4 w-4 text-green-500" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-24 items-center justify-center">
                  <p className="text-sm text-muted-foreground">No popular products to display</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
