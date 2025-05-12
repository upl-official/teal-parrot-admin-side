"use client"
import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker"
import { addDays, addMonths } from "date-fns"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { CalendarRange } from "lucide-react"

interface DateRangePickerProps {
  startDate: Date | undefined
  endDate: Date | undefined
  onStartDateChange: (date: Date | undefined) => void
  onEndDateChange: (date: Date | undefined) => void
  startLabel?: string
  endLabel?: string
  startPlaceholder?: string
  endPlaceholder?: string
  startError?: string
  endError?: string
  disabled?: boolean
}

export function EnhancedDateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  startLabel = "Start Date",
  endLabel = "End Date",
  startPlaceholder = "Select start date",
  endPlaceholder = "Select end date",
  startError,
  endError,
  disabled = false,
}: DateRangePickerProps) {
  // Handle start date change
  const handleStartDateChange = (date: Date | undefined) => {
    onStartDateChange(date)

    // If end date is before start date, update end date
    if (date && endDate && endDate < date) {
      onEndDateChange(addDays(date, 1))
    }
  }

  // Preset date ranges
  const presetRanges = [
    {
      label: "Next 7 days",
      getRange: () => {
        const start = new Date()
        return {
          start,
          end: addDays(start, 7),
        }
      },
    },
    {
      label: "Next 30 days",
      getRange: () => {
        const start = new Date()
        return {
          start,
          end: addDays(start, 30),
        }
      },
    },
    {
      label: "Next 3 months",
      getRange: () => {
        const start = new Date()
        return {
          start,
          end: addMonths(start, 3),
        }
      },
    },
    {
      label: "Next 6 months",
      getRange: () => {
        const start = new Date()
        return {
          start,
          end: addMonths(start, 6),
        }
      },
    },
    {
      label: "Next year",
      getRange: () => {
        const start = new Date()
        return {
          start,
          end: addMonths(start, 12),
        }
      },
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Validity Period</h4>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              <CalendarRange className="h-3.5 w-3.5 mr-2" />
              Preset Ranges
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {presetRanges.map((preset) => (
              <DropdownMenuItem
                key={preset.label}
                onClick={() => {
                  const { start, end } = preset.getRange()
                  onStartDateChange(start)
                  onEndDateChange(end)
                }}
              >
                {preset.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <EnhancedDatePicker
          date={startDate}
          setDate={handleStartDateChange}
          label={startLabel}
          placeholder={startPlaceholder}
          disabled={disabled}
          error={startError}
        />
        <EnhancedDatePicker
          date={endDate}
          setDate={onEndDateChange}
          label={endLabel}
          placeholder={endPlaceholder}
          disabled={disabled}
          error={endError}
          disabledDates={(date) => (startDate ? date < startDate : false)}
          minDate={startDate}
        />
      </div>
    </div>
  )
}
