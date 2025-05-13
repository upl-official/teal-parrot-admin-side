"use client"

import { useState, useEffect, type ChangeEvent, type FocusEvent } from "react"
import { Input, type InputProps } from "@/components/ui/input"
import { formatPriceValue } from "@/lib/price-utils"

interface DecimalInputProps extends Omit<InputProps, "onChange" | "value"> {
  value: string
  onChange: (value: string) => void
  onBlur?: (e: FocusEvent<HTMLInputElement>) => void
  decimalPlaces?: number
  min?: number
  max?: number
}

export function DecimalInput({ value, onChange, onBlur, decimalPlaces = 2, min, max, ...props }: DecimalInputProps) {
  const [localValue, setLocalValue] = useState(value)

  // Update local value when prop value changes
  useEffect(() => {
    setLocalValue(value)
  }, [value])

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value

    // Allow empty input
    if (newValue === "") {
      setLocalValue("")
      onChange("")
      return
    }

    // Only allow numeric input with decimal point
    if (!/^-?\d*\.?\d*$/.test(newValue)) {
      return
    }

    // Update local state immediately for responsive UI
    setLocalValue(newValue)

    // Pass the raw value to parent component
    onChange(newValue)
  }

  // Update the handleBlur function to support variable decimal places
  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    // Format the value on blur
    if (localValue !== "") {
      const numValue = Number.parseFloat(localValue)

      // Apply min/max constraints
      let constrainedValue = numValue
      if (min !== undefined && numValue < min) {
        constrainedValue = min
      }
      if (max !== undefined && numValue > max) {
        constrainedValue = max
      }

      // Format to specified decimal places
      const formattedValue = formatPriceValue(constrainedValue, decimalPlaces)
      setLocalValue(formattedValue)
      onChange(formattedValue)
    }

    // Call the onBlur handler if provided
    if (onBlur) {
      onBlur(e)
    }
  }

  return (
    <Input type="text" inputMode="decimal" value={localValue} onChange={handleChange} onBlur={handleBlur} {...props} />
  )
}
