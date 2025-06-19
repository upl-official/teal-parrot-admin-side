"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Save, User } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { fetchApi } from "@/lib/api"

export default function EditUserPage({ params }) {
  const userId = params.id
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    password: "",
  })
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    fetchUserDetails()
  }, [userId])

  const fetchUserDetails = async () => {
    try {
      setLoading(true)
      const response = await fetchApi(`/api/v1/admin/user/list?userId=${userId}`)

      if (response.success && response.data) {
        setUser(response.data)
        setFormData({
          name: response.data.name || "",
          phone: response.data.phone?.toString() || "",
          password: "",
        })
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch user details",
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch user details",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Name is required",
      })
      return
    }

    if (formData.phone && !/^\d{10}$/.test(formData.phone)) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Phone number must be 10 digits",
      })
      return
    }

    try {
      setSaving(true)

      const updateData = {
        userId: userId,
        name: formData.name.trim(),
        phone: formData.phone.trim(),
      }

      // Only include password if it's provided
      if (formData.password.trim()) {
        updateData.password = formData.password.trim()
      }

      await fetchApi("/api/v1/admin/user/update", {
        method: "POST",
        body: JSON.stringify(updateData),
      })

      toast({
        title: "Success",
        description: "User updated successfully",
      })

      router.push(`/dashboard/profiles/${userId}`)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update user",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div>
        <Header title="Edit User" />
        <div className="p-6 flex justify-center items-center h-[calc(100vh-4rem)]">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div>
        <Header title="Edit User" />
        <div className="p-6">
          <Button variant="outline" className="mb-6" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold mb-2">User Not Found</h2>
            <p className="text-muted-foreground">
              The user you're trying to edit doesn't exist or you don't have permission to edit it.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Header title="Edit User" />
      <div className="p-6">
        <Button variant="outline" className="mb-6" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to User Details
        </Button>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Edit User: {user.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter user name"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={user.email} disabled className="bg-muted" />
                  <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Enter 10-digit phone number"
                    maxLength={10}
                  />
                </div>

                <div>
                  <Label htmlFor="password">New Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Leave blank to keep current password"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Only enter a password if you want to change it</p>
                </div>
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={saving} className="bg-[#28acc1] hover:bg-[#1e8a9a]">
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
