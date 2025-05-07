"use client"

import { useState, useEffect } from "react"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getAdminInfo } from "@/lib/auth"

export default function Header({ title }) {
  const [adminName, setAdminName] = useState("Admin")
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const adminInfo = getAdminInfo()
    if (adminInfo && adminInfo.name) {
      setAdminName(adminInfo.name)
    }

    // Check if mobile
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkIfMobile()
    window.addEventListener("resize", checkIfMobile)

    return () => window.removeEventListener("resize", checkIfMobile)
  }, [])

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b bg-background px-4 md:px-6 shadow-sm">
      <div className="flex items-center gap-2 md:gap-4">
        {isMobile && (
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => {}}>
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        )}

        <div className="hidden md:flex items-center">
          <div className="mr-3 flex items-center justify-center">
            <img
              src="/tp-emblem-color.webp"
              alt="Teal Parrot Logo"
              className="h-10 w-auto object-contain"
            />
          </div>
          <h1 className="text-xl font-semibold">{title}</h1>
        </div>

        {isMobile && (
          <div className="flex items-center">
            {/* Use an img tag for mobile view as well */}
            <img
              src="/tp-emblem-color.webp"
              alt="Teal Parrot Emblem"
              className="h-8 w-auto object-contain mr-2"
            />
            <h1 className="text-lg font-semibold">{title}</h1>
          </div>
        )}
      </div>

      <div className="flex items-center">
        <span className="font-medium text-sm">Welcome, {adminName}</span>
      </div>
    </header>
  )
}
