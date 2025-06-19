"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertCircle, Eye, EyeOff } from "lucide-react"
import { login, isAuthenticated } from "@/lib/auth"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Check if user is already authenticated on mount
  useEffect(() => {
    if (mounted) {
      const checkAuth = () => {
        try {
          if (isAuthenticated()) {
            console.log("User is already authenticated, redirecting to dashboard")
            router.replace("/dashboard")
          }
        } catch (error) {
          console.error("Error checking authentication:", error)
        }
      }

      checkAuth()
    }
  }, [mounted, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // Basic validation
    if (!email.trim()) {
      setError("Email is required")
      setLoading(false)
      return
    }

    if (!password) {
      setError("Password is required")
      setLoading(false)
      return
    }

    try {
      console.log("Attempting login with:", { email, rememberMe })
      const result = await login(email, password, rememberMe)
      console.log("Login result:", result)

      if (result.success) {
        console.log("Login successful, redirecting to dashboard")

        // Small delay to ensure state is updated
        setTimeout(() => {
          router.replace("/dashboard")
        }, 100)
      } else {
        // Handle specific error messages
        if (
          result.error?.toLowerCase().includes("invalid") ||
          result.error?.toLowerCase().includes("incorrect") ||
          result.error?.toLowerCase().includes("wrong") ||
          result.error?.toLowerCase().includes("not found") ||
          result.error?.toLowerCase().includes("unauthorized") ||
          result.error?.toLowerCase().includes("failed")
        ) {
          setError("Invalid credentials. Please check your email and password.")
        } else {
          setError(result.error || "Login failed. Please try again.")
        }
        setLoading(false)
      }
    } catch (err) {
      console.error("Login error:", err)
      setError("An unexpected error occurred. Please try again.")
      setLoading(false)
    }
  }

  // Don't render if not mounted (prevents hydration issues)
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#28acc1] border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <div className="w-32 h-32 relative mb-4">
            <img src="/tp-logo-color.webp" alt="TealParrot Logo" className="object-contain w-full h-full" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Admin Login</CardTitle>
          <CardDescription className="text-center">Enter your credentials to access the admin panel</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleLogin}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  disabled={loading}
                  placeholder="Enter your email"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    disabled={loading}
                    placeholder="Enter your password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                  </Button>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="remember" checked={rememberMe} onCheckedChange={setRememberMe} disabled={loading} />
                <Label htmlFor="remember" className="text-sm">
                  Remember me for 24 hours
                </Label>
              </div>
              <Button type="submit" className="w-full bg-[#28acc1] hover:bg-[#1e8a9a]" disabled={loading}>
                {loading ? (
                  <div className="flex items-center">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></div>
                    Logging in...
                  </div>
                ) : (
                  "Login"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">TealParrot Admin Panel © {new Date().getFullYear()}</p>
        </CardFooter>
      </Card>
    </div>
  )
}
