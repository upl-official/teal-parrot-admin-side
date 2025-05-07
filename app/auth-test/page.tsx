"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { isAuthenticated, getAdminInfo } from "@/lib/auth"

export default function AuthTestPage() {
  const [authStatus, setAuthStatus] = useState<string>("Checking...")
  const [adminInfo, setAdminInfo] = useState<any>(null)
  const [token, setToken] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Check authentication status
    const auth = isAuthenticated()
    setAuthStatus(auth ? "Authenticated" : "Not authenticated")

    // Get admin info
    const info = getAdminInfo()
    setAdminInfo(info)

    // Get token
    if (typeof window !== "undefined") {
      try {
        const storedToken = localStorage.getItem("adminToken")
        setToken(storedToken)
      } catch (error) {
        console.error("Error accessing localStorage:", error)
      }
    }
  }, [])

  const handleGoToDashboard = () => {
    router.push("/dashboard")
  }

  const handleGoToLogin = () => {
    router.push("/login")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Authentication Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="font-semibold">Authentication Status:</p>
            <p className={authStatus === "Authenticated" ? "text-green-600" : "text-red-600"}>{authStatus}</p>
          </div>

          {token && (
            <div>
              <p className="font-semibold">Token:</p>
              <p className="text-xs break-all bg-gray-100 p-2 rounded">{token}</p>
            </div>
          )}

          {adminInfo && (
            <div>
              <p className="font-semibold">Admin Info:</p>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">{JSON.stringify(adminInfo, null, 2)}</pre>
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <Button onClick={handleGoToDashboard} className="flex-1">
              Go to Dashboard
            </Button>
            <Button onClick={handleGoToLogin} variant="outline" className="flex-1">
              Go to Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
