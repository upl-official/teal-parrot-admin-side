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
import { Plus, Pencil, Trash } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { fetchApi } from "@/lib/api"
import { DataTable } from "@/components/ui/data-table"
// Add the import for ConfirmationDialog at the top of the file:
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"

export default function GradesPage() {
  const [grades, setGrades] = useState([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [gradeName, setGradeName] = useState("")
  const [editGradeId, setEditGradeId] = useState(null)
  const [nameError, setNameError] = useState("")
  const { toast } = useToast()

  // Add the state variables for the confirmation dialog:
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [gradeToDelete, setGradeToDelete] = useState(null)

  useEffect(() => {
    fetchGrades()
  }, [])

  const fetchGrades = async () => {
    try {
      setLoading(true)
      const response = await fetchApi("/api/v1/grade/gra-list/")
      // Updated to match the API response structure
      const gradesData = response.data || []
      setGrades(gradesData)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch grades",
      })
      setGrades([])
    } finally {
      setLoading(false)
    }
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

  const confirmDeleteGrade = (gradeId) => {
    setGradeToDelete(gradeId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteGrade = async () => {
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
        description: "Failed to delete grade",
      })
    } finally {
      setDeleteDialogOpen(false)
      setGradeToDelete(null)
    }
  }

  const openEditDialog = (grade) => {
    setEditGradeId(grade._id)
    setGradeName(grade.grade)
    setIsEditDialogOpen(true)
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
      cell: (row) => row.productCount || 0,
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
            onClick={() => confirmDeleteGrade(row._id)}
            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
            title="Delete Grade"
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
      <Header title="Grades" />
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold">All Grades</h2>
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
                    Grade
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

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Grade</DialogTitle>
              <DialogDescription>Update the grade value.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-grade" className={nameError ? "text-destructive" : ""}>
                  Grade
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

        <DataTable
          columns={columns}
          data={grades}
          searchKey="grade"
          searchPlaceholder="Search grades..."
          itemsPerPage={10}
          loading={loading}
        />

        {/* Add the confirmation dialog here */}
        <ConfirmationDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Delete Grade"
          description="Are you sure you want to delete this grade? This action cannot be undone and may affect products associated with this grade."
          onConfirm={handleDeleteGrade}
          confirmText="Delete"
          cancelText="Cancel"
          variant="destructive"
        />
      </div>
    </div>
  )
}
