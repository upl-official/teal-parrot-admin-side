"use client"

import { useEffect, useState } from "react"
import { isAuthenticated } from "@/lib/auth"

export default function RedirectPage() {
  const [message, setMessage] = useState("Checking authentication status...")
  const [countdown, setCountdown] = useState(3)

  useEffect(() => {
    const checkAuthAndRedirect = () => {
      try {
        const authenticated = isAuthenticated()
        console.log("Redirect page - Auth check:", authenticated)

        if (authenticated) {
          setMessage("You are authenticated. Redirecting to dashboard...")

          // Start countdown
          const timer = setInterval(() => {
            setCountdown((prev) => {
              if (prev <= 1) {
                clearInterval(timer)
                window.location.href = "/dashboard"
                return 0
              }
              return prev - 1
            })
          }, 1000)

          return () => clearInterval(timer)
        } else {
          setMessage("You are not authenticated. Redirecting to login...")

          // Start countdown
          const timer = setInterval(() => {
            setCountdown((prev) => {
              if (prev <= 1) {
                clearInterval(timer)
                window.location.href = "/login"
                return 0
              }
              return prev - 1
            })
          }, 1000)

          return () => clearInterval(timer)
        }
      } catch (error) {
        console.error("Error in redirect page:", error)
        setMessage("An error occurred. Redirecting to login...")

        setTimeout(() => {
          window.location.href = "/login"
        }, 3000)
      }
    }

    checkAuthAndRedirect()
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-4">Redirecting...</h1>
        <p className="mb-4">{message}</p>
        <p className="text-sm text-gray-500">Redirecting in {countdown} seconds...</p>
        <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#28acc1] transition-all duration-1000 ease-linear"
            style={{ width: `${(countdown / 3) * 100}%` }}
          ></div>
        </div>
        <div className="mt-6">
          <button
            onClick={() => (window.location.href = "/dashboard")}
            className="px-4 py-2 bg-[#28acc1] text-white rounded hover:bg-[#1e8a9a] mr-2"
          >
            Go to Dashboard
          </button>
          <button
            onClick={() => (window.location.href = "/login")}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Go to Login
          </button>
        </div>
      </div>
    </div>
  )
}
