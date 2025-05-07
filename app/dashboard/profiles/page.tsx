"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, ShoppingBag, Mail, Phone } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { fetchApi } from "@/lib/api"
import { DataTable } from "@/components/ui/data-table"

export default function ProfilesPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      // Update to the correct API endpoint
      const response = await fetchApi("/api/v1/admin/user/list")

      // Update to match the correct response structure
      if (response.success && response.data) {
        setUsers(response.data)
      } else {
        setUsers([])
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch user profiles",
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch user profiles",
      })
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString()
  }

  const columns = [
    {
      key: "name",
      header: "Name",
      cell: (row) => <span className="font-medium">{row.name}</span>,
    },
    {
      key: "email",
      header: "Email",
      cell: (row) => (
        <div className="flex items-center">
          <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
          <span>{row.email}</span>
        </div>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      cell: (row) => (
        <div className="flex items-center">
          <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
          <span>{row.phone ? row.phone.toString() : "N/A"}</span>
        </div>
      ),
      className: "hidden md:table-cell",
    },
    {
      key: "createdAt",
      header: "Joined",
      cell: (row) => formatDate(row.createdAt),
      className: "hidden md:table-cell",
    },
    {
      key: "status",
      header: "Status",
      cell: (row) =>
        row.isActive ? (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
        ) : (
          <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">
            Inactive
          </Badge>
        ),
    },
    {
      key: "actions",
      header: "",
      cell: (row) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/dashboard/profiles/${row._id}`)}
            className="h-8 w-8"
            title="View Profile"
          >
            <Eye className="h-4 w-4" />
            <span className="sr-only">View Profile</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/dashboard/orders?userId=${row._id}`)}
            className="h-8 w-8"
            title="View Orders"
          >
            <ShoppingBag className="h-4 w-4" />
            <span className="sr-only">View Orders</span>
          </Button>
        </div>
      ),
      className: "text-right",
    },
  ]

  return (
    <div>
      <Header title="User Profiles" />
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold">All Users</h2>
        </div>

        <DataTable
          columns={columns}
          data={users}
          searchKey="name"
          searchPlaceholder="Search users..."
          itemsPerPage={10}
          loading={loading}
        />
      </div>
    </div>
  )
}
