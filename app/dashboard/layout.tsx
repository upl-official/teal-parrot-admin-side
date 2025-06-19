"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Sidebar from "@/components/layout/sidebar"
import Footer from "@/components/layout/footer"
import { Toaster } from "@/components/ui/toaster"
import { useAuth } from "@/contexts/auth-context"
import { SessionWarning } from "@/components/auth/session-warning"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !isLoading) {
      if (!isAuthenticated) {
        console.log("Dashboard layout - User not authenticated, redirecting to login")
        router.replace("/login")
      }
    }
  }, [mounted, isAuthenticated, isLoading, router])

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

  // Don't render dashboard if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#28acc1] border-t-transparent"></div>
          <p className="text-sm text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />

      {/* Main content area with proper spacing for sidebar */}
      <div className="lg:ml-64 transition-all duration-200 ease-in-out">
        <div className="flex flex-col min-h-screen">
          {/* Session warning at the top */}
          <SessionWarning />

          {/* Main content */}
          <main className="flex-1 p-4 lg:p-6">
            <div className="max-w-7xl mx-auto">{children}</div>
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
