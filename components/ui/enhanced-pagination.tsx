"use client"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface EnhancedPaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  onItemsPerPageChange: (itemsPerPage: number) => void
  pageSizeOptions?: number[]
}

export function EnhancedPagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  pageSizeOptions = [10, 25, 50, 100],
}: EnhancedPaginationProps) {
  // Don't render pagination if there's only one page or no items
  if (totalItems === 0) return null

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return
    onPageChange(page)
  }

  const handleItemsPerPageChange = (value: string) => {
    const newItemsPerPage = Number.parseInt(value, 10)
    onItemsPerPageChange(newItemsPerPage)
  }

  // Create an array of page numbers to display
  const getPageNumbers = () => {
    const pages = []
    const maxPagesToShow = 5

    if (totalPages <= maxPagesToShow) {
      // If we have fewer pages than our max, show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)

      // Calculate start and end of page range
      let start = Math.max(2, currentPage - 1)
      let end = Math.min(totalPages - 1, currentPage + 1)

      // Adjust if we're near the beginning
      if (currentPage <= 3) {
        start = 2
        end = 4
      }

      // Adjust if we're near the end
      if (currentPage >= totalPages - 2) {
        start = totalPages - 3
        end = totalPages - 1
      }

      // Add ellipsis after first page if needed
      if (start > 2) {
        pages.push("ellipsis-start")
      }

      // Add middle pages
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      // Add ellipsis before last page if needed
      if (end < totalPages - 1) {
        pages.push("ellipsis-end")
      }

      // Always show last page
      pages.push(totalPages)
    }

    return pages
  }

  const pageNumbers = getPageNumbers()

  // Calculate the range of items being displayed
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-4">
      <div className="text-sm text-muted-foreground">
        Showing <span className="font-medium">{startItem}</span> to <span className="font-medium">{endItem}</span> of{" "}
        <span className="font-medium">{totalItems}</span> items
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Items per page:</span>
          <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={itemsPerPage.toString()} />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((option) => (
                <SelectItem key={option} value={option.toString()}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <nav className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous Page</span>
          </Button>

          {/* Page Numbers */}
          <div className="flex items-center gap-1">
            {pageNumbers.map((page, index) => {
              if (page === "ellipsis-start" || page === "ellipsis-end") {
                return (
                  <div key={`ellipsis-${index}`} className="flex h-8 w-8 items-center justify-center text-sm">
                    ...
                  </div>
                )
              }

              return (
                <Button
                  key={`page-${page}`}
                  variant={currentPage === page ? "default" : "outline"}
                  size="icon"
                  onClick={() => handlePageChange(page as number)}
                  className="h-8 w-8"
                >
                  {page}
                </Button>
              )
            })}
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next Page</span>
          </Button>
        </nav>
      </div>
    </div>
  )
}
