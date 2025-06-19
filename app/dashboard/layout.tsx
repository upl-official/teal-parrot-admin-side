"use client"

import type React from "react"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Sidebar from "@/components/layout/sidebar"
import Footer from "@/components/layout/footer"
import { Toaster } from "@/components/ui/toaster"
import { useAuth } from "@/contexts/auth-context"
import { SessionWarning } from "@/components/auth/session-warning"
import { cn } from "@/lib/utils"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [redirecting, setRedirecting] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true) // Default to collapsed
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Handle sidebar state changes
  const handleSidebarStateChange = useCallback((isCollapsed: boolean, mobile: boolean) => {
    setSidebarCollapsed(isCollapsed)
    setIsMobile(mobile)
  }, [])

  useEffect(() => {
    if (mounted && !isLoading && !redirecting) {
      console.log("Dashboard layout - Auth state:", { isAuthenticated, isLoading })

      if (!isAuthenticated) {
        console.log("Dashboard layout - User not authenticated, redirecting to login")
        setRedirecting(true)
        router.replace("/login")
      }
    }
  }, [mounted, isAuthenticated, isLoading, redirecting, router])

  // Show loading spinner while checking authentication or not mounted
  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#28acc1] border-t-transparent"></div>
          <p className="text-sm text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // Show redirecting state
  if (redirecting || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#28acc1] border-t-transparent"></div>
          <p className="text-sm text-gray-600">
            {redirecting ? "Redirecting to login..." : "Checking authentication..."}
          </p>
        </div>
      </div>
    )
  }

  // Calculate margin based on sidebar state
  const getMainContentMargin = () => {
    if (isMobile) {
      return "lg:ml-0" // No margin on mobile
    }
    return sidebarCollapsed ? "lg:ml-16" : "lg:ml-64" // Dynamic margin based on sidebar state
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar onStateChange={handleSidebarStateChange} />

      {/* Main content area with dynamic spacing for sidebar */}
      <div className={cn("transition-all duration-300 ease-in-out min-h-screen", getMainContentMargin())}>
        <div className="flex flex-col min-h-screen">
          {/* Session warning at the top */}
          <SessionWarning />

          {/* Main content with dynamic padding */}
          <main
            className={cn(
              "flex-1 transition-all duration-300 ease-in-out",
              // Add extra padding when sidebar is collapsed to utilize space better
              sidebarCollapsed && !isMobile && "lg:px-0 xl:px-0",
            )}
          >
            <div
              className={cn(
                "mx-auto transition-all duration-300 ease-in-out",
                // Dynamic max-width based on sidebar state
                sidebarCollapsed && !isMobile ? "max-w-full" : "max-w-full",
              )}
            >
              {children}
            </div>
          </main>

          {/* Footer */}
          <Footer />
        </div>
      </div>

      {/* Toast notifications */}
      <Toaster />
    </div>
  )
}
