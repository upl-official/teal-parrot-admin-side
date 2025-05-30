"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Eye, EyeOff } from "lucide-react"
import { login, isAuthenticated } from "@/lib/auth"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [redirecting, setRedirecting] = useState(false)
  const router = useRouter()

  // Check if user is already authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (isAuthenticated()) {
        console.log("User is already authenticated, redirecting to dashboard")
        window.location.href = "/dashboard"
      }
    }

    checkAuth()
  }, [])

  const handleLogin = async (e) => {
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
      console.log("Attempting login with:", { email })
      const result = await login(email, password)
      console.log("Login result:", result)

      if (result.success) {
        console.log("Login successful, redirecting to dashboard")
        setRedirecting(true)

        // Force a hard navigation to the dashboard
        window.location.href = "/dashboard"

        // As a fallback, also try the router after a delay
        setTimeout(() => {
          if (document.location.pathname !== "/dashboard") {
            console.log("Fallback: Using router.push for redirection")
            router.push("/dashboard")
          }
        }, 500)
      } else {
        // Check for specific error messages related to invalid credentials
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
      }
    } catch (err) {
      console.error("Login error:", err)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      if (!redirecting) {
        setLoading(false)
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <div className="w-40 h-40 relative mb-4">
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
          {redirecting && (
            <Alert className="mb-4 bg-green-50 border-green-200">
              <AlertDescription className="text-green-700">
                Login successful! Redirecting to dashboard...
              </AlertDescription>
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
                  disabled={loading || redirecting}
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
                    disabled={loading || redirecting}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading || redirecting}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                  </Button>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full bg-[#28acc1] hover:bg-[#1e8a9a]"
                disabled={loading || redirecting}
              >
                {loading ? "Logging in..." : redirecting ? "Redirecting..." : "Login"}
              </Button>
              {redirecting && (
                <div className="text-center mt-2">
                  <p className="text-sm text-gray-500">
                    If you are not redirected automatically,
                    <button
                      type="button"
                      onClick={() => (window.location.href = "/dashboard")}
                      className="text-[#28acc1] hover:underline ml-1"
                    >
                      click here
                    </button>
                  </p>
                </div>
              )}
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
