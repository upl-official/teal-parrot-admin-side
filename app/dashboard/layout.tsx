"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Sidebar from "@/components/layout/sidebar"
import Footer from "@/components/layout/footer"
import { Toaster } from "@/components/ui/toaster"
import { isAuthenticated } from "@/lib/auth"

export default function DashboardLayout({ children }) {
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated()) {
      router.push("/login")
    } else {
      setLoading(false)
    }
  }, [router])

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
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
