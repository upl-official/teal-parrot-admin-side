"use client"

import { DialogTrigger } from "@/components/ui/dialog"
import { useState, useEffect } from "react"
import Header from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Plus, Pencil, Trash, AlertCircle, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { fetchApi } from "@/lib/api"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { EnhancedPagination } from "@/components/ui/enhanced-pagination"

export default function GradesPage() {
  const [grades, setGrades] = useState([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [gradeName, setGradeName] = useState("")
  const [editGradeId, setEditGradeId] = useState(null)
  const [nameError, setNameError] = useState("")
  const { toast } = useToast()

  // State for deletion dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [gradeToDelete, setGradeToDelete] = useState(null)
  const [gradeToDeleteName, setGradeToDeleteName] = useState("")
  const [gradeProductCount, setGradeProductCount] = useState(0)

  // Track loading state for individual product counts
  const [productCountsLoading, setProductCountsLoading] = useState({})

  const [filteredGrades, setFilteredGrades] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  useEffect(() => {
    fetchGrades()
  }, [])

  useEffect(() => {
    // Filter grades based on search term
    if (searchTerm.trim() === "") {
      setFilteredGrades(grades)
    } else {
      const filtered = grades.filter((grade) => grade.grade.toLowerCase().includes(searchTerm.toLowerCase()))
      setFilteredGrades(filtered)
    }
    setCurrentPage(1) // Reset to first page when search changes
  }, [grades, searchTerm])

  const fetchGrades = async () => {
    try {
      setLoading(true)
      const response = await fetchApi("/api/v1/grade/gra-list/")
      const gradesData = response.data || []

      // Initialize grades with zero product counts
      const gradesWithCounts = gradesData.map((grade) => ({
        ...grade,
        productCount: 0,
        isCountLoading: true,
      }))

      setGrades(gradesWithCounts)

      // Fetch product counts for each grade
      await fetchProductCounts(gradesWithCounts)
    } catch (error) {
      console.error("Failed to fetch grades:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch grades: " + (error.message || "Unknown error"),
      })
      setGrades([])
    } finally {
      setLoading(false)
    }
  }

  const fetchProductCounts = async (gradesData) => {
    // Create a new object to track loading states
    const loadingStates = {}
    gradesData.forEach((grade) => {
      loadingStates[grade._id] = true
    })
    setProductCountsLoading(loadingStates)

    // Create a copy of the grades array to update with product counts
    const updatedGrades = [...gradesData]

    // Fetch product counts for each grade
    const countPromises = updatedGrades.map(async (grade, index) => {
      try {
        const response = await fetchApi(`/api/v1/product/list/?gradeId=${grade._id}`)

        // Extract product count from the correct path in the response
        // The API returns data.products array
        const productCount = response.data?.products?.length || 0

        console.log(`Grade ${grade.grade} (${grade._id}) has ${productCount} products`)

        // Update the grade with the product count
        updatedGrades[index] = {
          ...grade,
          productCount: productCount,
          isCountLoading: false,
        }

        // Update loading state for this grade
        setProductCountsLoading((prev) => ({
          ...prev,
          [grade._id]: false,
        }))
      } catch (error) {
        console.error(`Failed to fetch product count for grade ${grade.grade}:`, error)

        // If there's an error, set product count to 0
        updatedGrades[index] = {
          ...grade,
          productCount: 0,
          isCountLoading: false,
          countError: true,
        }

        // Update loading state for this grade
        setProductCountsLoading((prev) => ({
          ...prev,
          [grade._id]: false,
        }))
      }
    })

    // Wait for all count fetches to complete
    await Promise.all(countPromises)

    // Update the grades state with the product counts
    setGrades(updatedGrades)
  }

  const validateGradeName = () => {
    if (!gradeName.trim()) {
      setNameError("Grade is required")
      return false
    }
    setNameError("")
    return true
  }

  const handleAddGrade = async () => {
    if (!validateGradeName()) return

    try {
      await fetchApi("/api/v1/admin/grade/add", {
        method: "POST",
        body: JSON.stringify({ grade: gradeName }),
      })

      toast({
        title: "Success",
        description: "Grade added successfully",
      })

      setGradeName("")
      setIsAddDialogOpen(false)
      fetchGrades()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add grade: " + (error.message || "Unknown error"),
      })
    }
  }

  const handleEditGrade = async () => {
    if (!validateGradeName()) return

    try {
      await fetchApi("/api/v1/admin/grade/update", {
        method: "PUT",
        body: JSON.stringify({ gradeId: editGradeId, grade: gradeName }),
      })

      toast({
        title: "Success",
        description: "Grade updated successfully",
      })

      setGradeName("")
      setIsEditDialogOpen(false)
      fetchGrades()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update grade: " + (error.message || "Unknown error"),
      })
    }
  }

  const confirmDeleteGrade = async (grade) => {
    try {
      // Set loading state for this specific check
      setProductCountsLoading((prev) => ({
        ...prev,
        [grade._id]: true,
      }))

      // Fetch products associated with this grade
      const response = await fetchApi(`/api/v1/product/list/?gradeId=${grade._id}`)

      // Extract product count from the correct path in the response
      const productCount = response.data?.products?.length || 0

      console.log(`Checking deletion for grade ${grade.grade} (${grade._id}): ${productCount} products found`)

      // Update loading state
      setProductCountsLoading((prev) => ({
        ...prev,
        [grade._id]: false,
      }))

      // Store the grade info and product count
      setGradeToDelete(grade._id)
      setGradeToDeleteName(grade.grade)
      setGradeProductCount(productCount)

      // Open the confirmation dialog
      setDeleteDialogOpen(true)
    } catch (error) {
      console.error(`Failed to check products for grade ${grade.grade}:`, error)

      // Update loading state
      setProductCountsLoading((prev) => ({
        ...prev,
        [grade._id]: false,
      }))

      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to check associated products: " + (error.message || "Unknown error"),
      })
    }
  }

  const handleDeleteGrade = async () => {
    // If there are associated products, don't allow deletion
    if (gradeProductCount > 0) {
      setDeleteDialogOpen(false)
      toast({
        variant: "destructive",
        title: "Cannot Delete Grade",
        description: `This grade has ${gradeProductCount} associated products. Please reassign or delete these products first.`,
      })
      return
    }

    try {
      await fetchApi("/api/v1/admin/grade/remove", {
        method: "DELETE",
        body: JSON.stringify({ gradeId: gradeToDelete }),
      })

      toast({
        title: "Success",
        description: "Grade deleted successfully",
      })

      fetchGrades()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete grade: " + (error.message || "Unknown error"),
      })
    } finally {
      setDeleteDialogOpen(false)
      setGradeToDelete(null)
      setGradeToDeleteName("")
      setGradeProductCount(0)
    }
  }

  const openEditDialog = (grade) => {
    setEditGradeId(grade._id)
    setGradeName(grade.grade)
    setIsEditDialogOpen(true)
  }

  // Calculate pagination
  const totalItems = filteredGrades.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentGrades = filteredGrades.slice(startIndex, endIndex)

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1) // Reset to first page
  }

  const columns = [
    {
      key: "grade",
      header: "Grade",
      cell: (row) => <span className="font-medium">{row.grade}</span>,
    },
    {
      key: "productCount",
      header: "Products",
      cell: (row) => (
        <div className="flex items-center">
          {productCountsLoading[row._id] ? (
            <div className="flex items-center">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              <span className="text-muted-foreground">Loading...</span>
            </div>
          ) : (
            <span className="font-medium">{row.productCount || 0}</span>
          )}
        </div>
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
            onClick={() => openEditDialog(row)}
            className="h-8 w-8"
            title="Edit Grade"
          >
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Edit</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => confirmDeleteGrade(row)}
            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
            title="Delete Grade"
          >
            {productCountsLoading[row._id] ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash className="h-4 w-4" />
            )}
            <span className="sr-only">Delete</span>
          </Button>
        </div>
      ),
      className: "text-right",
    },
  ]

  return (
    <div>
      <Header title="Grades" />
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-semibold">All Grades</h2>
            <p className="text-sm text-muted-foreground">
              {totalItems} {totalItems === 1 ? "grade" : "grades"} total
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#28acc1] hover:bg-[#1e8a9a]">
                <Plus className="mr-2 h-4 w-4" />
                Add Grade
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Grade</DialogTitle>
                <DialogDescription>Enter the grade value.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="grade" className={nameError ? "text-destructive" : ""}>
                    Grade <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="grade"
                    value={gradeName}
                    onChange={(e) => {
                      setGradeName(e.target.value)
                      if (nameError) setNameError("")
                    }}
                    placeholder="Enter grade"
                    className={nameError ? "border-destructive" : ""}
                  />
                  {nameError && <p className="text-sm text-destructive">{nameError}</p>}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button className="bg-[#28acc1] hover:bg-[#1e8a9a]" onClick={handleAddGrade}>
                  Add Grade
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
            placeholder="Search grades..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Grade</DialogTitle>
              <DialogDescription>Update the grade value.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-grade" className={nameError ? "text-destructive" : ""}>
                  Grade <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-grade"
                  value={gradeName}
                  onChange={(e) => {
                    setGradeName(e.target.value)
                    if (nameError) setNameError("")
                  }}
                  className={nameError ? "border-destructive" : ""}
                />
                {nameError && <p className="text-sm text-destructive">{nameError}</p>}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button className="bg-[#28acc1] hover:bg-[#1e8a9a]" onClick={handleEditGrade}>
                Update Grade
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Grades Table */}
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="h-10 px-2 text-left font-medium">Grade</th>
                <th className="h-10 px-2 text-left font-medium">Products</th>
                <th className="h-10 px-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} className="h-24 text-center">
                    <div className="flex justify-center items-center h-full">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    </div>
                  </td>
                </tr>
              ) : currentGrades.length === 0 ? (
                <tr>
                  <td colSpan={3} className="h-24 text-center">
                    {searchTerm ? "No grades found matching your search." : "No grades found."}
                  </td>
                </tr>
              ) : (
                currentGrades.map((grade) => (
                  <tr key={grade._id} className="border-b hover:bg-muted/50">
                    <td className="p-2">
                      <span className="font-medium">{grade.grade}</span>
                    </td>
                    <td className="p-2">
                      <div className="flex items-center">
                        {productCountsLoading[grade._id] ? (
                          <div className="flex items-center">
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            <span className="text-muted-foreground">Loading...</span>
                          </div>
                        ) : (
                          <span className="font-medium">{grade.productCount || 0}</span>
                        )}
                      </div>
                    </td>
                    <td className="p-2 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(grade)}
                          className="h-8 w-8"
                          title="Edit Grade"
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => confirmDeleteGrade(grade)}
                          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                          title="Delete Grade"
                        >
                          {productCountsLoading[grade._id] ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash className="h-4 w-4" />
                          )}
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

        {/* Completely separate dialogs for different cases */}
        {gradeProductCount > 0 ? (
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cannot Delete Grade</AlertDialogTitle>
              </AlertDialogHeader>

              <div className="py-3">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Action Not Allowed</AlertTitle>
                  <AlertDescription>
                    There are {gradeProductCount} active products under this grade. Delete or reassign these products to
                    a different grade to delete this grade.
                  </AlertDescription>
                </Alert>

                <div className="mt-4 space-y-2">
                  <p className="font-medium">To delete this grade, you must first:</p>
                  <ol className="list-decimal pl-5 space-y-1">
                    <li>Go to the Products page</li>
                    <li>Reassign or delete products under this grade.</li>
                    <li>Return to this page and try deleting the grade again</li>
                  </ol>
                </div>
              </div>

              <AlertDialogFooter>
                <AlertDialogAction asChild>
                  <Button variant="default" onClick={() => setDeleteDialogOpen(false)}>
                    Close
                  </Button>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Grade</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete the grade "{gradeToDeleteName}"? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel asChild>
                  <Button variant="outline">Cancel</Button>
                </AlertDialogCancel>
                <AlertDialogAction asChild>
                  <Button variant="destructive" onClick={handleDeleteGrade}>
                    Delete
                  </Button>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  )
}
