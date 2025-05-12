"use client"

import * as React from "react"
import { format, addDays, addWeeks, addMonths } from "date-fns"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface DatePickerProps {
  date: Date | undefined
  setDate: (date: Date | undefined) => void
  label?: string
  placeholder?: string
  disabled?: boolean
  error?: string
  disabledDates?: (date: Date) => boolean
  minDate?: Date
}

export function EnhancedDatePicker({
  date,
  setDate,
  label,
  placeholder = "Select date",
  disabled = false,
  error,
  disabledDates,
  minDate,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("")

  // Update input value when date changes
  React.useEffect(() => {
    if (date) {
      setInputValue(format(date, "yyyy-MM-dd"))
    } else {
      setInputValue("")
    }
  }, [date])

  // Handle manual input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)

    // Try to parse the date
    if (value) {
      try {
        const parts = value.split("-")
        if (parts.length === 3) {
          const year = Number.parseInt(parts[0], 10)
          const month = Number.parseInt(parts[1], 10) - 1 // JS months are 0-indexed
          const day = Number.parseInt(parts[2], 10)

          if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
            const newDate = new Date(year, month, day)
            if (newDate.toString() !== "Invalid Date") {
              // Check if date is disabled
              if (disabledDates && disabledDates(newDate)) {
                return
              }
              // Check if date is before minDate
              if (minDate && newDate < minDate) {
                return
              }
              setDate(newDate)
            }
          }
        }
      } catch (error) {
        // Invalid date format, do nothing
      }
    }
  }

  // Handle calendar selection
  const handleCalendarSelect = (newDate: Date | undefined) => {
    setDate(newDate)
    setIsOpen(false)
  }

  // Preset date options
  const presetOptions = [
    {
      label: "Today",
      getValue: () => new Date(),
    },
    {
      label: "Tomorrow",
      getValue: () => addDays(new Date(), 1),
    },
    {
      label: "In a week",
      getValue: () => addWeeks(new Date(), 1),
    },
    {
      label: "In a month",
      getValue: () => addMonths(new Date(), 1),
    },
    {
      label: "In 3 months",
      getValue: () => addMonths(new Date(), 3),
    },
  ]

  return (
    <div className="flex flex-col space-y-1.5">
      {label && <label className="text-sm font-medium">{label}</label>}
      <div className="flex">
        <div className="relative flex-1">
          <Input
            type="date"
            value={inputValue}
            onChange={handleInputChange}
            className={cn(
              "pr-10",
              error ? "border-destructive" : "",
              date ? "text-foreground" : "text-muted-foreground",
            )}
            disabled={disabled}
            min={minDate ? format(minDate, "yyyy-MM-dd") : undefined}
            onClick={() => setIsOpen(false)} // Ensure any open popovers are closed
          />
          {date && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0"
                onClick={() => setDate(undefined)}
              >
                <span className="sr-only">Clear date</span>
                <span className="text-muted-foreground">×</span>
              </Button>
            </div>
          )}
        </div>
        <div className="flex">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className={cn("rounded-l-none", error ? "border-destructive" : "")}
                disabled={disabled}
                type="button"
              >
                Presets
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {presetOptions.map((option) => (
                <DropdownMenuItem
                  key={option.label}
                  onClick={() => {
                    const newDate = option.getValue()
                    // Check if date is disabled
                    if (disabledDates && disabledDates(newDate)) {
                      return
                    }
                    // Check if date is before minDate
                    if (minDate && newDate < minDate) {
                      return
                    }
                    setDate(newDate)
                  }}
                  className="flex items-center justify-between"
                >
                  {option.label}
                  {date && format(date, "yyyy-MM-dd") === format(option.getValue(), "yyyy-MM-dd") && (
                    <Check className="h-4 w-4 ml-2" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
