"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Trash, X } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { fetchApi } from "@/lib/api"
import { DataTable } from "@/components/ui/data-table"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"

export default function CouponsPage() {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCoupons, setSelectedCoupons] = useState([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [couponToDelete, setCouponToDelete] = useState(null)
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false)
  const [bulkDeleteProgress, setBulkDeleteProgress] = useState(0)
  const [bulkDeleteStatus, setBulkDeleteStatus] = useState({ total: 0, success: 0, failed: 0 })
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  const [bulkDeleteErrors, setBulkDeleteErrors] = useState([])

  const router = useRouter()
  const { toast } = useToast()

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

  const handleSelectAllCoupons = (checked) => {
    if (checked) {
      setSelectedCoupons(coupons.map((coupon) => coupon._id))
    } else {
      setSelectedCoupons([])
    }
  }

  const handleSelectCoupon = (couponId, checked) => {
    if (checked) {
      setSelectedCoupons((prev) => [...prev, couponId])
    } else {
      setSelectedCoupons((prev) => prev.filter((id) => id !== couponId))
    }
  }

  const confirmBulkDeleteCoupons = () => {
    setBulkDeleteStatus({
      total: selectedCoupons.length,
      success: 0,
      failed: 0,
    })
    setBulkDeleteProgress(0)
    setBulkDeleteErrors([])
    setBulkDeleteDialogOpen(true)
  }

  const handleBulkDeleteCoupons = async () => {
    if (selectedCoupons.length === 0) return

    setIsBulkDeleting(true)
    setBulkDeleteErrors([])
    let successCount = 0
    let failedCount = 0

    for (let i = 0; i < selectedCoupons.length; i++) {
      const couponId = selectedCoupons[i]
      try {
        await fetchApi("/api/v1/admin/coupon/remove", {
          method: "DELETE",
          body: JSON.stringify({ couponId }),
        })
        successCount++
      } catch (error) {
        failedCount++
        const coupon = coupons.find((c) => c._id === couponId)
        setBulkDeleteErrors((prev) => [
          ...prev,
          { id: couponId, code: coupon?.code || couponId, error: error.message || "Unknown error" },
        ])
      }

      // Update progress
      const progress = Math.round(((i + 1) / selectedCoupons.length) * 100)
      setBulkDeleteProgress(progress)
      setBulkDeleteStatus({
        total: selectedCoupons.length,
        success: successCount,
        failed: failedCount,
      })
    }

    // Only close dialog and refresh if there were no errors or user confirms
    if (failedCount === 0) {
      setTimeout(() => {
        setBulkDeleteDialogOpen(false)
        setSelectedCoupons([])
        fetchCoupons()
        setIsBulkDeleting(false)

        toast({
          title: "Success",
          description: `Successfully deleted ${successCount} coupons`,
        })
      }, 1000) // Short delay to show 100% completion
    } else {
      setIsBulkDeleting(false)
      toast({
        variant: "destructive",
        title: "Partial Success",
        description: `Deleted ${successCount} coupons, but ${failedCount} failed`,
      })
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
      key: "select",
      header: (
        <Checkbox
          checked={selectedCoupons.length > 0 && selectedCoupons.length === coupons.length}
          onCheckedChange={handleSelectAllCoupons}
          aria-label="Select all coupons"
        />
      ),
      cell: (row) => (
        <Checkbox
          checked={selectedCoupons.includes(row._id)}
          onCheckedChange={(checked) => handleSelectCoupon(row._id, checked)}
          aria-label={`Select coupon ${row.code}`}
        />
      ),
      className: "w-12",
    },
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
          <div className="flex gap-2">
            {selectedCoupons.length > 0 && (
              <Button variant="destructive" onClick={confirmBulkDeleteCoupons} className="flex items-center">
                <Trash className="mr-2 h-4 w-4" />
                Delete Selected ({selectedCoupons.length})
              </Button>
            )}
            <Button className="bg-[#28acc1] hover:bg-[#1e8a9a]" onClick={() => router.push("/dashboard/coupons/add")}>
              <Plus className="mr-2 h-4 w-4" />
              Add Coupon
            </Button>
          </div>
        </div>

        {selectedCoupons.length > 0 && (
          <div className="bg-muted/50 p-2 rounded-md mb-4 flex justify-between items-center">
            <span className="text-sm font-medium">
              {selectedCoupons.length} {selectedCoupons.length === 1 ? "coupon" : "coupons"} selected
            </span>
            <Button variant="ghost" size="sm" onClick={() => setSelectedCoupons([])} className="h-8 px-2">
              <X className="h-4 w-4 mr-1" />
              Clear selection
            </Button>
          </div>
        )}

        <DataTable
          columns={columns}
          data={coupons}
          searchKey="code"
          searchPlaceholder="Search coupons..."
          itemsPerPage={10}
          loading={loading}
        />

        {/* Single Coupon Delete Confirmation Dialog */}
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

        {/* Bulk Delete Confirmation Dialog */}
        <ConfirmationDialog
          open={bulkDeleteDialogOpen}
          onOpenChange={(open) => {
            if (!isBulkDeleting) setBulkDeleteDialogOpen(open)
          }}
          title="Delete Multiple Coupons"
          description={`Are you sure you want to delete ${selectedCoupons.length} selected coupons? This action cannot be undone.`}
          onConfirm={handleBulkDeleteCoupons}
          confirmText={isBulkDeleting ? "Deleting..." : "Delete All"}
          cancelText="Cancel"
          variant="destructive"
        >
          {isBulkDeleting && (
            <div className="my-4 space-y-2">
              <Progress value={bulkDeleteProgress} className="h-2" />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Progress: {bulkDeleteProgress}%</span>
                <span>
                  {bulkDeleteStatus.success} successful, {bulkDeleteStatus.failed} failed
                </span>
              </div>
            </div>
          )}

          {bulkDeleteErrors.length > 0 && (
            <div className="mt-4 max-h-40 overflow-y-auto">
              <h4 className="text-sm font-medium mb-2 text-destructive">Failed to delete:</h4>
              <ul className="text-sm space-y-1">
                {bulkDeleteErrors.map((error, index) => (
                  <li key={index} className="text-muted-foreground">
                    <span className="font-medium">{error.code}</span>: {error.error}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </ConfirmationDialog>
      </div>
    </div>
  )
}
