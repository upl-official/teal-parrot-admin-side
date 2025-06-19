"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, ShoppingBag, Mail, Phone, Trash2, Edit } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { fetchApi } from "@/lib/api"
import { EnhancedPagination } from "@/components/ui/enhanced-pagination"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"

export default function ProfilesPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState(null)
  const router = useRouter()
  const { toast } = useToast()

  const [filteredUsers, setFilteredUsers] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    // Filter users based on search term
    if (searchTerm.trim() === "") {
      setFilteredUsers(users)
    } else {
      const filtered = users.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.phone.toString().includes(searchTerm),
      )
      setFilteredUsers(filtered)
    }
    setCurrentPage(1) // Reset to first page when search changes
  }, [users, searchTerm])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetchApi("/api/v1/admin/user/list")

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

  const handleDeleteUser = async () => {
    if (!userToDelete) return

    try {
      setDeleteLoading(true)
      await fetchApi("/api/v1/admin/user/remove", {
        method: "POST",
        body: JSON.stringify({
          userId: userToDelete._id,
        }),
      })

      toast({
        title: "Success",
        description: "User deleted successfully",
      })

      // Refresh the users list
      fetchUsers()
      setDeleteDialogOpen(false)
      setUserToDelete(null)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete user",
      })
    } finally {
      setDeleteLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString()
  }

  // Calculate pagination
  const totalItems = filteredUsers.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentUsers = filteredUsers.slice(startIndex, endIndex)

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1) // Reset to first page
  }

  return (
    <div>
      <Header title="User Profiles" />
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-semibold">All Users</h2>
            <p className="text-sm text-muted-foreground">
              {totalItems} {totalItems === 1 ? "user" : "users"} total
            </p>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg
              className="w-4 h-4 text-gray-500"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 20 20"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
              />
            </svg>
          </div>
          <input
            type="search"
            className="block w-full p-2 pl-10 text-sm border rounded-lg bg-background"
            placeholder="Search users by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Users Table */}
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="h-10 px-2 text-left font-medium">Name</th>
                <th className="h-10 px-2 text-left font-medium">Email</th>
                <th className="h-10 px-2 text-left font-medium hidden md:table-cell">Phone</th>
                <th className="h-10 px-2 text-left font-medium hidden md:table-cell">Joined</th>
                <th className="h-10 px-2 text-left font-medium">Status</th>
                <th className="h-10 px-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="h-24 text-center">
                    <div className="flex justify-center items-center h-full">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    </div>
                  </td>
                </tr>
              ) : currentUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="h-24 text-center">
                    {searchTerm ? "No users found matching your search." : "No users found."}
                  </td>
                </tr>
              ) : (
                currentUsers.map((user) => (
                  <tr key={user._id} className="border-b hover:bg-muted/50">
                    <td className="p-2">
                      <span className="font-medium">{user.name}</span>
                    </td>
                    <td className="p-2">
                      <div className="flex items-center">
                        <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>{user.email}</span>
                      </div>
                    </td>
                    <td className="p-2 hidden md:table-cell">
                      <div className="flex items-center">
                        <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>{user.phone ? user.phone.toString() : "N/A"}</span>
                      </div>
                    </td>
                    <td className="p-2 hidden md:table-cell">{formatDate(user.createdAt)}</td>
                    <td className="p-2">
                      {user.isActive ? (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">
                          Inactive
                        </Badge>
                      )}
                    </td>
                    <td className="p-2 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => router.push(`/dashboard/profiles/${user._id}`)}
                          className="h-8 w-8"
                          title="View Profile"
                        >
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">View Profile</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => router.push(`/dashboard/profiles/${user._id}/edit`)}
                          className="h-8 w-8"
                          title="Edit User"
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit User</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => router.push(`/dashboard/profiles/${user._id}/orders`)}
                          className="h-8 w-8"
                          title="View Orders"
                        >
                          <ShoppingBag className="h-4 w-4" />
                          <span className="sr-only">View Orders</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setUserToDelete(user)
                            setDeleteDialogOpen(true)
                          }}
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Delete User"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete User</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Enhanced Pagination */}
        <EnhancedPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
        />

        {/* Delete Confirmation Dialog */}
        <ConfirmationDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Delete User"
          description={`Are you sure you want to delete ${userToDelete?.name}? This action cannot be undone.`}
          onConfirm={handleDeleteUser}
          confirmText={deleteLoading ? "Deleting..." : "Delete"}
          variant="destructive"
        />
      </div>
    </div>
  )
}
