"use client"

import { useState, useEffect } from "react"
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
  ChevronLeft,
  ChevronRight,
  Lock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { logout } from "@/lib/auth"
import { cn } from "@/lib/utils"

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  // Handle responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsMobile(true)
        setMobileOpen(false)
      } else {
        setIsMobile(false)
      }
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Update the menuItems array to remove the Discounts item and ensure Settings is properly linked
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

  const toggleSidebar = () => {
    setCollapsed(!collapsed)
  }

  const toggleMobileSidebar = () => {
    setMobileOpen(!mobileOpen)
  }

  const sidebarWidth = collapsed ? "w-16" : "w-64"

  return (
    <>
      {isMobile && (
        <Button
          variant="outline"
          size="icon"
          className="absolute top-4 left-4 z-50 lg:hidden"
          onClick={toggleMobileSidebar}
        >
          {mobileOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </Button>
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 bg-white dark:bg-gray-950 border-r transform transition-all duration-200 ease-in-out",
          sidebarWidth,
          isMobile ? (mobileOpen ? "translate-x-0" : "-translate-x-full") : "translate-x-0",
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center self-center justify-between p-4 border-b">
            {!collapsed && (
              <div className="flex justify-center">
                <div className="relative w-36 h-10 flex items-center">
                  <img src="/tp-logo-color.webp" alt="Teal Parrot Logo" className="h-18 w-auto object-contain" />
                </div>
              </div>
            )}

            {!isMobile && (
              <Button variant="ghost" size="icon" onClick={toggleSidebar} className={collapsed ? "ml-auto" : ""}>
                {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              </Button>
            )}
          </div>

          <ScrollArea className="flex-1 py-4">
            <TooltipProvider delayDuration={200}>
              <nav className={cn("px-2 space-y-1", collapsed ? "items-center" : "")}>
                {menuItems.map((item) => {
                  const isActive =
                    pathname === item.href || (pathname.startsWith(`${item.href}/`) && item.href !== "/dashboard")

                  const Icon = item.icon

                  const menuItem = (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center rounded-md text-sm font-medium transition-colors",
                        collapsed ? "justify-center px-2 py-3" : "px-3 py-2",
                        isActive
                          ? "bg-[#28acc1] text-white"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800",
                      )}
                    >
                      <Icon className={cn("h-5 w-5", collapsed ? "mr-0" : "mr-3")} />
                      {!collapsed && <span>{item.label}</span>}
                    </Link>
                  )

                  return collapsed ? (
                    <Tooltip key={item.href}>
                      <TooltipTrigger asChild>{menuItem}</TooltipTrigger>
                      <TooltipContent side="right">{item.label}</TooltipContent>
                    </Tooltip>
                  ) : (
                    menuItem
                  )
                })}
              </nav>
            </TooltipProvider>
          </ScrollArea>

          <div className="p-4 border-t">
            <TooltipProvider delayDuration={200}>
              {collapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="w-full flex items-center justify-center"
                      onClick={logout}
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Logout</TooltipContent>
                </Tooltip>
              ) : (
                <Button variant="outline" className="w-full flex items-center justify-center" onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              )}
            </TooltipProvider>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isMobile && mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={toggleMobileSidebar} />
      )}
    </>
  )
}
