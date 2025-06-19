"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { isAuthenticated, initializeAuth, logout } from "@/lib/auth"

interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  checkAuth: () => void
  handleLogout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuth, setIsAuth] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const checkAuth = () => {
    try {
      const authenticated = isAuthenticated()
      setIsAuth(authenticated)
      console.log("Auth check result:", authenticated)
    } catch (error) {
      console.error("Error checking authentication:", error)
      setIsAuth(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    setIsLoading(true)
    logout()
  }

  useEffect(() => {
    // Initialize auth system
    initializeAuth()

    // Check authentication status
    checkAuth()

    // Set up periodic auth checks
    const interval = setInterval(checkAuth, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: isAuth,
        isLoading,
        checkAuth,
        handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
