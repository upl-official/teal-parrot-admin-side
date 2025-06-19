"use client"

import { useState, useEffect } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Clock } from "lucide-react"
import { isSessionNearExpiry, extendSession } from "@/lib/auth"

export function SessionWarning() {
  const [showWarning, setShowWarning] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)

  useEffect(() => {
    const checkSession = () => {
      if (isSessionNearExpiry()) {
        setShowWarning(true)
        // Calculate time left (approximate)
        setTimeLeft(5) // 5 minutes warning
      } else {
        setShowWarning(false)
      }
    }

    // Check immediately
    checkSession()

    // Check every minute
    const interval = setInterval(checkSession, 60000)

    return () => clearInterval(interval)
  }, [])

  const handleExtendSession = () => {
    if (extendSession()) {
      setShowWarning(false)
      setTimeLeft(0)
    }
  }

  if (!showWarning) return null

  return (
    <div className="sticky top-0 z-40 p-4">
      <Alert className="border-amber-200 bg-amber-50">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-amber-600" />
            <span className="text-amber-800">Your session will expire in {timeLeft} minutes</span>
          </div>
          <Button size="sm" onClick={handleExtendSession} className="bg-amber-600 hover:bg-amber-700 text-white">
            Extend Session
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  )
}
