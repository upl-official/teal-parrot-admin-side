"use client"

import { useEffect, useState } from "react"
import Sidebar from "@/components/layout/sidebar"
import Footer from "@/components/layout/footer"
import { Toaster } from "@/components/ui/toaster"
import { isAuthenticated } from "@/lib/auth"

export default function DashboardLayout({ children }) {
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = () => {
      const isAuth = isAuthenticated()
      console.log("Dashboard layout - Auth check:", isAuth)

      if (!isAuth) {
        console.log("Not authenticated, redirecting to login")
        window.location.href = "/login"
        return
      }

      setAuthenticated(true)
      setLoading(false)
    }

    checkAuth()
  }, [])

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  if (!authenticated) {
    return null
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1">
        <Sidebar />
        <div className="flex flex-col flex-1 lg:ml-16 transition-all duration-200 ease-in-out">
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-0">{children}</div>
          </main>
          <Footer />
          <Toaster />
        </div>
      </div>
    </div>
  )
}
