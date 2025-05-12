"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"

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

export function DatePicker({
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

  return (
    <div className="flex flex-col space-y-1.5">
      {label && <label className="text-sm font-medium">{label}</label>}
      <div className="flex">
        <Input
          type="date"
          value={inputValue}
          onChange={handleInputChange}
          className={cn("rounded-r-none", error ? "border-destructive" : "")}
          disabled={disabled}
          min={minDate ? format(minDate, "yyyy-MM-dd") : undefined}
        />
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn("rounded-l-none border-l-0", error ? "border-destructive" : "")}
              disabled={disabled}
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
              }}
            >
              <CalendarIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleCalendarSelect}
              disabled={disabledDates}
              fromDate={minDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
