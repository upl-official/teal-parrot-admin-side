"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Trash } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { fetchApi } from "@/lib/api"
import { DataTable } from "@/components/ui/data-table"
// Add the import for ConfirmationDialog at the top of the file:
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"

export default function CouponsPage() {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  // Add the state variables for the confirmation dialog:
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [couponToDelete, setCouponToDelete] = useState(null)

  useEffect(() => {
    fetchCoupons()
  }, [])

  const fetchCoupons = async () => {
    try {
      setLoading(true)
      const response = await fetchApi("/api/v1/coupon/coupon-list/")
      // Updated to match the API response structure
      const couponsData = response.data || []
      setCoupons(couponsData)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch coupons",
      })
      setCoupons([])
    } finally {
      setLoading(false)
    }
  }

  const confirmDeleteCoupon = (couponId) => {
    setCouponToDelete(couponId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteCoupon = async () => {
    try {
      await fetchApi("/api/v1/admin/coupon/remove", {
        method: "DELETE",
        body: JSON.stringify({ couponId: couponToDelete }),
      })

      toast({
        title: "Success",
        description: "Coupon deleted successfully",
      })

      fetchCoupons()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete coupon",
      })
    } finally {
      setDeleteDialogOpen(false)
      setCouponToDelete(null)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString()
  }

  const isCouponActive = (coupon) => {
    const now = new Date()
    const validFrom = new Date(coupon.validFrom)
    const validUntil = new Date(coupon.validUntil)
    return now >= validFrom && now <= validUntil
  }

  const columns = [
    {
      key: "code",
      header: "Coupon Code",
      cell: (row) => <span className="font-medium uppercase">{row.code}</span>,
    },
    {
      key: "offerPercentage",
      header: "Discount",
      cell: (row) => <span>{row.offerPercentage}%</span>,
    },
    {
      key: "validFrom",
      header: "Valid From",
      cell: (row) => formatDate(row.validFrom),
      className: "hidden md:table-cell",
    },
    {
      key: "validUntil",
      header: "Valid Until",
      cell: (row) => formatDate(row.validUntil),
      className: "hidden md:table-cell",
    },
    {
      key: "status",
      header: "Status",
      cell: (row) =>
        isCouponActive(row) ? (
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
            onClick={() => router.push(`/dashboard/coupons/edit/${row._id}`)}
            className="h-8 w-8"
            title="Edit Coupon"
          >
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Edit</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => confirmDeleteCoupon(row._id)}
            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
            title="Delete Coupon"
          >
            <Trash className="h-4 w-4" />
            <span className="sr-only">Delete</span>
          </Button>
        </div>
      ),
      className: "text-right",
    },
  ]

  return (
    <div>
      <Header title="Coupons" />
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold">All Coupons</h2>
          <Button className="bg-[#28acc1] hover:bg-[#1e8a9a]" onClick={() => router.push("/dashboard/coupons/add")}>
            <Plus className="mr-2 h-4 w-4" />
            Add Coupon
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={coupons}
          searchKey="code"
          searchPlaceholder="Search coupons..."
          itemsPerPage={10}
          loading={loading}
        />

        {/* Add the confirmation dialog here */}
        <ConfirmationDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Delete Coupon"
          description="Are you sure you want to delete this coupon? This action cannot be undone."
          onConfirm={handleDeleteCoupon}
          confirmText="Delete"
          cancelText="Cancel"
          variant="destructive"
        />
      </div>
    </div>
  )
}
