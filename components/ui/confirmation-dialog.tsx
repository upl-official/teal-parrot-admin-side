"use client"
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
import { Button } from "@/components/ui/button"

interface ConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children?: React.ReactNode
  onConfirm: () => void
  confirmText?: string
  cancelText?: string
  variant?: "default" | "destructive"
  showCancel?: boolean
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  onConfirm,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
  showCancel = true,
}: ConfirmationDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
        </AlertDialogHeader>
        
        {/* Render children outside of AlertDialogDescription */}
        {children && <div className="py-2">{children}</div>}
        
        <AlertDialogFooter>
          {showCancel && (
            <AlertDialogCancel asChild>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {cancelText}
              </Button>
            </AlertDialogCancel>
          )}
          <AlertDialogAction asChild>
            <Button
              variant={variant === "destructive" ? "destructive" : "default"}
              className={variant !== "destructive" ? "bg-[#28acc1] hover:bg-[#1e8a9a]" : ""}
              onClick={(e) => {
                e.preventDefault()
                onConfirm()
              }}
            >
              {confirmText}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
