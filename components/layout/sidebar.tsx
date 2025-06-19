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
  Menu,
  X,
  Lock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { TooltipProvider } from "@/components/ui/tooltip"
import { logout } from "@/lib/auth"
import { cn } from "@/lib/utils"

export default function Sidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
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

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
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
          "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo section */}
          <div className="flex items-center justify-center p-6 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <img src="/tp-logo-color.webp" alt="Teal Parrot Logo" className="h-8 w-auto object-contain" />
            </div>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 py-4">
            <TooltipProvider delayDuration={200}>
              <nav className="px-3 space-y-1">
                {menuItems.map((item) => {
                  const isActive =
                    pathname === item.href || (pathname.startsWith(`${item.href}/`) && item.href !== "/dashboard")

                  const Icon = item.icon

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                        isActive ? "bg-[#28acc1] text-white" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
                      )}
                    >
                      <Icon className="mr-3 h-5 w-5" />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </nav>
            </TooltipProvider>
          </ScrollArea>

          {/* Logout button */}
          <div className="p-4 border-t border-gray-200">
            <Button
              variant="outline"
              className="w-full flex items-center justify-center"
              onClick={() => logout("User logout")}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </aside>
    </>
  )
}
