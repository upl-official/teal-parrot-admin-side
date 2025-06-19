"use client"

import { useState, useEffect, createContext, useContext } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Package,
  Tag,
  Layers,
  Star,
  ShoppingCart,
  Users,
  Ticket,
  LogOut,
  Menu,
  X,
  Lock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { logout } from "@/lib/auth"
import { cn } from "@/lib/utils"

// Create context for sidebar state
const SidebarContext = createContext<{
  isCollapsed: boolean
  setIsCollapsed: (collapsed: boolean) => void
  isMobile: boolean
}>({
  isCollapsed: true,
  setIsCollapsed: () => {},
  isMobile: false,
})

export const useSidebar = () => useContext(SidebarContext)

interface SidebarProps {
  onStateChange?: (isCollapsed: boolean, isMobile: boolean) => void
}

export default function Sidebar({ onStateChange }: SidebarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(true) // Default to collapsed
  const [isMobile, setIsMobile] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: Package, label: "Products", href: "/dashboard/products" },
    { icon: Tag, label: "Categories", href: "/dashboard/categories" },
    { icon: Layers, label: "Materials", href: "/dashboard/materials" },
    { icon: Star, label: "Grades", href: "/dashboard/grades" },
    { icon: ShoppingCart, label: "Orders", href: "/dashboard/orders" },
    { icon: Users, label: "Profiles", href: "/dashboard/profiles" },
    { icon: Ticket, label: "Coupons", href: "/dashboard/coupons" },
    { icon: Lock, label: "Account Security", href: "/dashboard/settings" },
  ]

  // Check if mobile and handle initial state
  useEffect(() => {
    const checkIfMobile = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)

      // On mobile, always expand when menu is open, collapse when closed
      if (mobile && !isMobileMenuOpen) {
        setIsCollapsed(true)
      }
    }

    checkIfMobile()
    setMounted(true)
    window.addEventListener("resize", checkIfMobile)
    return () => window.removeEventListener("resize", checkIfMobile)
  }, [isMobileMenuOpen])

  // Notify parent component of state changes
  useEffect(() => {
    if (mounted && onStateChange) {
      onStateChange(isCollapsed, isMobile)
    }
  }, [isCollapsed, isMobile, mounted, onStateChange])

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMobileMenuOpen(false)
      }
    }

    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [])

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const toggleCollapse = () => {
    if (!isMobile) {
      setIsCollapsed(!isCollapsed)
    }
  }

  const sidebarWidth = isCollapsed && !isMobile ? "w-16" : "w-64"

  return (
    <SidebarContext.Provider value={{ isCollapsed, setIsCollapsed, isMobile }}>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-[60]">
        <Button variant="outline" size="icon" onClick={toggleMobileMenu} className="bg-white shadow-md">
          {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 bg-white border-r border-gray-200 transform transition-all duration-300 ease-in-out lg:translate-x-0",
          sidebarWidth,
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo section */}
          <div
            className={cn(
              "flex items-center border-b border-gray-200 transition-all duration-300",
              isCollapsed && !isMobile ? "justify-center p-4" : "justify-between p-4",
            )}
          >
            <div
              className={cn(
                "flex items-center space-x-2 transition-all duration-300",
                isCollapsed && !isMobile && "space-x-0",
              )}
            >
              {(!isCollapsed || isMobile) && <img
                src="/tp-logo-color.webp"
                alt="Teal Parrot Logo"
                className={cn(
                  "object-contain transition-all duration-300",
                  isCollapsed && !isMobile ? "h-6 w-6" : "h-8 w-auto",
                )}
              />}
            </div>

            {/* Collapse button - only show on desktop */}
            {!isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleCollapse}
                className="h-6 w-6 text-gray-500 hover:text-gray-700 transition-colors"
              >
                {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </Button>
            )}
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 py-4">
            <TooltipProvider delayDuration={200}>
              <nav className={cn("space-y-1", isCollapsed && !isMobile ? "px-2" : "px-3")}>
                {menuItems.map((item) => {
                  const isActive =
                    pathname === item.href || (pathname.startsWith(`${item.href}/`) && item.href !== "/dashboard")

                  const Icon = item.icon

                  const linkContent = (
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center rounded-md text-sm font-medium transition-all duration-200",
                        isCollapsed && !isMobile ? "justify-center p-3" : "px-3 py-2",
                        isActive
                          ? "bg-[#28acc1] text-white shadow-sm"
                          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
                      )}
                    >
                      <Icon
                        className={cn("h-5 w-5 transition-all duration-200", (!isCollapsed || isMobile) && "mr-3")}
                      />
                      {(!isCollapsed || isMobile) && (
                        <span className="transition-opacity duration-200">{item.label}</span>
                      )}
                    </Link>
                  )

                  // Wrap with tooltip when collapsed on desktop
                  if (isCollapsed && !isMobile) {
                    return (
                      <Tooltip key={item.href}>
                        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                        <TooltipContent side="right" className="ml-2">
                          <p>{item.label}</p>
                        </TooltipContent>
                      </Tooltip>
                    )
                  }

                  return <div key={item.href}>{linkContent}</div>
                })}
              </nav>
            </TooltipProvider>
          </ScrollArea>

          {/* Logout button */}
          <div
            className={cn(
              "border-t border-gray-200 transition-all duration-300",
              isCollapsed && !isMobile ? "p-2" : "p-4",
            )}
          >
            {isCollapsed && !isMobile ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="w-full hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors"
                      onClick={() => logout("User logout")}
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="ml-2">
                    <p>Logout</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <Button
                variant="outline"
                className="w-full flex items-center justify-center hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors"
                onClick={() => logout("User logout")}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            )}
          </div>
        </div>
      </aside>
    </SidebarContext.Provider>
  )
}
