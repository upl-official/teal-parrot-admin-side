"use client"
import { DatePicker } from "@/components/ui/date-picker"
import { addDays } from "date-fns"

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

export function DateRangePicker({
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <DatePicker
        date={startDate}
        setDate={handleStartDateChange}
        label={startLabel}
        placeholder={startPlaceholder}
        disabled={disabled}
        error={startError}
      />
      <DatePicker
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
  )
}
