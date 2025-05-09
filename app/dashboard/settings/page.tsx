"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/layout/header"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { Eye, EyeOff } from "lucide-react"

export default function SettingsPage() {
  const { toast } = useToast()
  const router = useRouter()

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  // Password visibility state
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Loading state
  const [isPasswordLoading, setIsPasswordLoading] = useState(false)

  // Password validation state
  const [passwordErrors, setPasswordErrors] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  // Handle password change
  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }))

    // Clear errors when typing
    if (passwordErrors[name]) {
      setPasswordErrors((prev) => ({
        ...prev,
        [name]: "",
      }))
    }

    // Check if confirm password matches when typing
    if (name === "confirmPassword" || (name === "newPassword" && passwordData.confirmPassword)) {
      if (name === "newPassword" && value !== passwordData.confirmPassword) {
        setPasswordErrors((prev) => ({
          ...prev,
          confirmPassword: "Passwords do not match",
        }))
      } else if (name === "confirmPassword" && value !== passwordData.newPassword) {
        setPasswordErrors((prev) => ({
          ...prev,
          confirmPassword: "Passwords do not match",
        }))
      } else {
        setPasswordErrors((prev) => ({
          ...prev,
          confirmPassword: "",
        }))
      }
    }
  }

  // Toggle password visibility
  const togglePasswordVisibility = (field) => {
    switch (field) {
      case "currentPassword":
        setShowCurrentPassword(!showCurrentPassword)
        break
      case "newPassword":
        setShowNewPassword(!showNewPassword)
        break
      case "confirmPassword":
        setShowConfirmPassword(!showConfirmPassword)
        break
      default:
        break
    }
  }

  // Validate password change
  const validatePasswordChange = () => {
    let isValid = true
    const errors = {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    }

    if (!passwordData.currentPassword) {
      errors.currentPassword = "Current password is required"
      isValid = false
    }

    if (!passwordData.newPassword) {
      errors.newPassword = "New password is required"
      isValid = false
    } else if (passwordData.newPassword.length < 8) {
      errors.newPassword = "Password must be at least 8 characters"
      isValid = false
    }

    if (!passwordData.confirmPassword) {
      errors.confirmPassword = "Please confirm your new password"
      isValid = false
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match"
      isValid = false
    }

    setPasswordErrors(errors)
    return isValid
  }

  // Change password
  const changePassword = async () => {
    if (!validatePasswordChange()) {
      return
    }

    setIsPasswordLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      // In a real app, you would call your API here
      // await fetchApi("/api/v1/admin/settings/change-password", {
      //   method: "POST",
      //   body: JSON.stringify({
      //     currentPassword: passwordData.currentPassword,
      //     newPassword: passwordData.newPassword,
      //   }),
      // })

      // Reset password fields
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })

      toast({
        title: "Success",
        description: "Password changed successfully",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to change password. Please check your current password and try again.",
      })
    } finally {
      setIsPasswordLoading(false)
    }
  }

  return (
    <div>
      <Header title="Account Security" />
      <div className="p-6">
        {/* Password Change */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Update your account password to maintain security.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    name="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    className={passwordErrors.currentPassword ? "border-red-500" : ""}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("currentPassword")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                  >
                    {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {passwordErrors.currentPassword && (
                  <p className="text-sm text-red-500">{passwordErrors.currentPassword}</p>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    className={passwordErrors.newPassword ? "border-red-500" : ""}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("newPassword")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    aria-label={showNewPassword ? "Hide password" : "Show password"}
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {passwordErrors.newPassword && <p className="text-sm text-red-500">{passwordErrors.newPassword}</p>}
                <p className="text-xs text-muted-foreground">Password must be at least 8 characters long</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    className={passwordErrors.confirmPassword ? "border-red-500" : ""}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("confirmPassword")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {passwordErrors.confirmPassword && (
                  <p className="text-sm text-red-500">{passwordErrors.confirmPassword}</p>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button onClick={changePassword} disabled={isPasswordLoading} className="bg-[#28acc1] hover:bg-[#1e8a9a]">
              {isPasswordLoading ? "Changing..." : "Change Password"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
