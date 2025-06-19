"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Trash, X, Eye } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { fetchApi } from "@/lib/api"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { EnhancedPagination } from "@/components/ui/enhanced-pagination"

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
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [couponToView, setCouponToView] = useState(null)
  const [viewLoading, setViewLoading] = useState(false)

  const [filteredCoupons, setFilteredCoupons] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    fetchCoupons()
  }, [])

  useEffect(() => {
    // Filter coupons based on search term
    if (searchTerm.trim() === "") {
      setFilteredCoupons(coupons)
    } else {
      const filtered = coupons.filter((coupon) => coupon.code.toLowerCase().includes(searchTerm.toLowerCase()))
      setFilteredCoupons(filtered)
    }
    setCurrentPage(1) // Reset to first page when search changes
  }, [coupons, searchTerm])

  // Calculate pagination
  const totalItems = filteredCoupons.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentCoupons = filteredCoupons.slice(startIndex, endIndex)

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1) // Reset to first page
  }

  const fetchCoupons = async () => {
    try {
      setLoading(true)
      const response = await fetchApi("/api/v1/coupon/coupon-list/")

      console.log("Coupons API response:", response)

      // Handle the nested response structure
      let couponsData = []

      if (response && response.success && response.data && response.data.success && Array.isArray(response.data.data)) {
        couponsData = response.data.data
      } else {
        console.warn("Unexpected API response structure:", response)
        couponsData = []
      }

      console.log("Processed coupons data:", couponsData)
      setCoupons(couponsData)
    } catch (error) {
      console.error("Error fetching coupons:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch coupons",
      })
      setCoupons([]) // Ensure it's always an array
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

  const handleViewCoupon = async (couponId) => {
    try {
      setViewLoading(true)
      setViewDialogOpen(true)

      const response = await fetchApi(`/api/v1/coupon/coupon-list/?couponId=${couponId}`)

      if (response && response.success && response.data && response.data.success) {
        setCouponToView(response.data.data)
      } else {
        throw new Error("Invalid response structure")
      }
    } catch (error) {
      console.error("Error fetching coupon details:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch coupon details",
      })
      setViewDialogOpen(false)
    } finally {
      setViewLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString()
  }

  const isCouponActive = (coupon) => {
    // Use the isActive field from the API response
    return coupon.isActive
  }

  const getApplicableProducts = (coupon) => {
    if (coupon.type === "normal") {
      return "All products"
    } else if (coupon.type === "product" && coupon.products) {
      return `${coupon.products.length} specific products`
    } else if (typeof coupon.applicableProducts === "string") {
      return coupon.applicableProducts
    } else if (typeof coupon.applicableProducts === "number") {
      return `${coupon.applicableProducts} products`
    }
    return "Unknown"
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
      key: "type",
      header: "Type",
      cell: (row) => (
        <Badge variant="outline" className="capitalize">
          {row.type}
        </Badge>
      ),
      className: "hidden sm:table-cell",
    },
    {
      key: "applicableProducts",
      header: "Applicable To",
      cell: (row) => <span className="text-sm text-muted-foreground">{getApplicableProducts(row)}</span>,
      className: "hidden md:table-cell",
    },
    {
      key: "minimumOrderAmount",
      header: "Min. Order",
      cell: (row) => (
        <span className="text-sm">{row.minimumOrderAmount > 0 ? `₹${row.minimumOrderAmount}` : "No minimum"}</span>
      ),
      className: "hidden lg:table-cell",
    },
    {
      key: "validFrom",
      header: "Valid From",
      cell: (row) => formatDate(row.validFrom),
      className: "hidden xl:table-cell",
    },
    {
      key: "validUntil",
      header: "Valid Until",
      cell: (row) => formatDate(row.validUntil),
      className: "hidden xl:table-cell",
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
            onClick={() => handleViewCoupon(row._id)}
            className="h-8 w-8"
            title="View Coupon Details"
          >
            <Eye className="h-4 w-4" />
            <span className="sr-only">View</span>
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

  // Ensure coupons is always an array before passing to DataTable
  const safeCoupons = Array.isArray(coupons) ? coupons : []

  return (
    <div>
      <Header title="Coupons" />
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-semibold">All Coupons</h2>
            <p className="text-sm text-muted-foreground">
              {totalItems} {totalItems === 1 ? "coupon" : "coupons"} total
            </p>
          </div>
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
            placeholder="Search coupons..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Replace DataTable with standard table */}
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="h-10 px-2 text-left font-medium w-12">
                  <Checkbox
                    checked={selectedCoupons.length > 0 && selectedCoupons.length === currentCoupons.length}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedCoupons(currentCoupons.map((coupon) => coupon._id))
                      } else {
                        setSelectedCoupons([])
                      }
                    }}
                    aria-label="Select all coupons"
                  />
                </th>
                <th className="h-10 px-2 text-left font-medium">Coupon Code</th>
                <th className="h-10 px-2 text-left font-medium">Discount</th>
                <th className="h-10 px-2 text-left font-medium hidden sm:table-cell">Type</th>
                <th className="h-10 px-2 text-left font-medium hidden md:table-cell">Applicable To</th>
                <th className="h-10 px-2 text-left font-medium hidden lg:table-cell">Min. Order</th>
                <th className="h-10 px-2 text-left font-medium hidden xl:table-cell">Valid From</th>
                <th className="h-10 px-2 text-left font-medium hidden xl:table-cell">Valid Until</th>
                <th className="h-10 px-2 text-left font-medium">Status</th>
                <th className="h-10 px-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="h-24 text-center">
                    <div className="flex justify-center items-center h-full">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    </div>
                  </td>
                </tr>
              ) : currentCoupons.length === 0 ? (
                <tr>
                  <td colSpan={10} className="h-24 text-center">
                    {searchTerm ? "No coupons found matching your search." : "No coupons found."}
                  </td>
                </tr>
              ) : (
                currentCoupons.map((coupon) => (
                  <tr key={coupon._id} className="border-b hover:bg-muted/50">
                    <td className="p-2 w-12">
                      <Checkbox
                        checked={selectedCoupons.includes(coupon._id)}
                        onCheckedChange={(checked) => handleSelectCoupon(coupon._id, checked)}
                        aria-label={`Select coupon ${coupon.code}`}
                      />
                    </td>
                    <td className="p-2">
                      <span className="font-medium uppercase">{coupon.code}</span>
                    </td>
                    <td className="p-2">
                      <span>{coupon.offerPercentage}%</span>
                    </td>
                    <td className="p-2 hidden sm:table-cell">
                      <Badge variant="outline" className="capitalize">
                        {coupon.type}
                      </Badge>
                    </td>
                    <td className="p-2 hidden md:table-cell">
                      <span className="text-sm text-muted-foreground">{getApplicableProducts(coupon)}</span>
                    </td>
                    <td className="p-2 hidden lg:table-cell">
                      <span className="text-sm">
                        {coupon.minimumOrderAmount > 0 ? `₹${coupon.minimumOrderAmount}` : "No minimum"}
                      </span>
                    </td>
                    <td className="p-2 hidden xl:table-cell">{formatDate(coupon.validFrom)}</td>
                    <td className="p-2 hidden xl:table-cell">{formatDate(coupon.validUntil)}</td>
                    <td className="p-2">
                      {isCouponActive(coupon) ? (
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
                          onClick={() => router.push(`/dashboard/coupons/edit/${coupon._id}`)}
                          className="h-8 w-8"
                          title="Edit Coupon"
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewCoupon(coupon._id)}
                          className="h-8 w-8"
                          title="View Coupon Details"
                        >
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">View</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => confirmDeleteCoupon(coupon._id)}
                          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                          title="Delete Coupon"
                        >
                          <Trash className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
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
        {/* Coupon View Dialog */}
        <ConfirmationDialog
          open={viewDialogOpen}
          onOpenChange={setViewDialogOpen}
          title="Coupon Details"
          description=""
          showActions={false}
        >
          {viewLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              <span className="ml-3">Loading coupon details...</span>
            </div>
          ) : couponToView ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Coupon Code</label>
                  <p className="font-medium uppercase">{couponToView.code}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Discount</label>
                  <p className="font-medium">{couponToView.offerPercentage}%</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Type</label>
                  <Badge variant="outline" className="capitalize">
                    {couponToView.type}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  {couponToView.isActive ? (
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-100 text-red-800">
                      Inactive
                    </Badge>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Valid From</label>
                  <p>{formatDate(couponToView.validFrom)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Valid Until</label>
                  <p>{formatDate(couponToView.validUntil)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Minimum Order Amount</label>
                  <p>{couponToView.minimumOrderAmount > 0 ? `₹${couponToView.minimumOrderAmount}` : "No minimum"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Applicable Products</label>
                  <p>
                    {couponToView.type === "normal"
                      ? "All products"
                      : `${couponToView.applicableProducts} specific products`}
                  </p>
                </div>
              </div>

              {couponToView.type === "product" && couponToView.products && couponToView.products.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Selected Products</label>
                  <div className="mt-2 max-h-40 overflow-y-auto border rounded-md">
                    {couponToView.products.map((product, index) => (
                      <div key={product._id} className="flex justify-between items-center p-2 border-b last:border-b-0">
                        <span className="font-medium">{product.name}</span>
                        <span className="text-sm text-muted-foreground">₹{product.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </ConfirmationDialog>
      </div>
    </div>
  )
}
