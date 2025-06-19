"use client"

import { useState, useEffect } from "react"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getAdminInfo } from "@/lib/auth"

interface HeaderProps {
  title: string
  onMenuClick?: () => void
}

export default function Header({ title, onMenuClick }: HeaderProps) {
  const [adminName, setAdminName] = useState("Admin")
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const adminInfo = getAdminInfo()
    if (adminInfo && adminInfo.name) {
      setAdminName(adminInfo.name)
    }

    // Check if mobile
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }

    checkIfMobile()
    window.addEventListener("resize", checkIfMobile)

    return () => window.removeEventListener("resize", checkIfMobile)
  }, [])

  return (
    <header className="sticky top-0 z-30 flex h-14 sm:h-16 w-full items-center justify-between border-b bg-background px-4 md:px-6 shadow-sm">
      <div className="flex items-center gap-2 md:gap-4 flex-1">
        {/* Mobile menu button - only show on mobile */}
        {isMobile && onMenuClick && (
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        )}

        {/* Desktop view */}
        <div className="hidden lg:flex items-center">
          <div className="mr-3 flex items-center justify-center">
            <img src="/tp-emblem-color.webp" alt="Teal Parrot Logo" className="h-8 sm:h-10 w-auto object-contain" />
          </div>
          <h1 className="text-lg sm:text-xl font-semibold truncate">{title}</h1>
        </div>

        {/* Mobile view */}
        {isMobile && (
          <div className="flex items-center flex-1 min-w-0">
            <img
              src="/tp-emblem-color.webp"
              alt="Teal Parrot Emblem"
              className="h-6 sm:h-8 w-auto object-contain mr-2 flex-shrink-0"
            />
            <h1 className="text-sm sm:text-lg font-semibold truncate">{title}</h1>
          </div>
        )}
      </div>

      {/* Admin info */}
      <div className="flex items-center flex-shrink-0">
        <span className="font-medium text-xs sm:text-sm truncate max-w-32 sm:max-w-none">Welcome, {adminName}</span>
      </div>
    </header>
  )
}
