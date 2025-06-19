"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { isAuthenticated, initializeAuth, logout } from "@/lib/auth"

interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  checkAuth: () => void
  handleLogout: () => void
  refreshAuth: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuth, setIsAuth] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const checkAuth = useCallback(() => {
    try {
      const authenticated = isAuthenticated()
      setIsAuth(authenticated)
      console.log("AuthContext - Auth check result:", authenticated)
      return authenticated
    } catch (error) {
      console.error("AuthContext - Error checking authentication:", error)
      setIsAuth(false)
      return false
    }
  }, [])

  const refreshAuth = useCallback(() => {
    console.log("AuthContext - Refreshing authentication state")
    const authenticated = checkAuth()
    setIsLoading(false)
    return authenticated
  }, [checkAuth])

  const handleLogout = useCallback(() => {
    console.log("AuthContext - Handling logout")
    setIsLoading(true)
    setIsAuth(false)
    logout()
  }, [])

  useEffect(() => {
    console.log("AuthContext - Initializing")

    // Initialize auth system
    initializeAuth()

    // Initial auth check
    const authenticated = checkAuth()
    setIsLoading(false)

    // Set up periodic auth checks (less frequent to avoid performance issues)
    const interval = setInterval(() => {
      if (!document.hidden) {
        // Only check when tab is visible
        checkAuth()
      }
    }, 60000) // Check every minute instead of 30 seconds

    return () => {
      console.log("AuthContext - Cleaning up")
      clearInterval(interval)
    }
  }, [checkAuth])

  // Handle visibility change to check auth when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && !isLoading) {
        console.log("AuthContext - Tab became visible, checking auth")
        checkAuth()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [checkAuth, isLoading])

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: isAuth,
        isLoading,
        checkAuth,
        handleLogout,
        refreshAuth,
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
