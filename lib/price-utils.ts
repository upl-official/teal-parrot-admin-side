/**
 * Utility functions for price handling and formatting
 */

/**
 * Format a number as a price string with proper decimal places
 * @param value - The price value to format
 * @param decimalPlaces - Number of decimal places to show (default: 2)
 * @returns Formatted price string
 */
export const formatPriceValue = (value: number | string, decimalPlaces = 2): string => {
  if (value === null || value === undefined || value === "") return ""

  // Convert to number if it's a string
  const numValue = typeof value === "string" ? Number.parseFloat(value) : value

  // Check if it's a valid number
  if (isNaN(numValue)) return ""

  // Format with fixed decimal places
  return numValue.toFixed(decimalPlaces)
}

/**
 * Format a price for display with currency symbol
 * @param price - The price to format
 * @returns Formatted price with currency symbol
 */
export const formatPriceDisplay = (price: number | string): string => {
  if (price === null || price === undefined || price === "") return "₹0"

  const numPrice = typeof price === "string" ? Number.parseFloat(price) : price

  if (isNaN(numPrice)) return "₹0"

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numPrice)
}

// Replace this function:
export const calculateSellingPrice = (price: string | number, discount: string | number): string => {
  if (!price || isNaN(Number(price))) return "0"

  const numPrice = typeof price === "string" ? Number.parseFloat(price) : price
  const numDiscount = typeof discount === "string" ? Number.parseFloat(discount || "0") : discount || 0

  if (isNaN(numPrice) || isNaN(numDiscount)) return "0"
  if (numPrice <= 0) return "0.00"

  // Ensure discount is between 0 and 100
  const validDiscount = Math.max(0, Math.min(100, numDiscount))

  // Calculate with high precision
  const discountAmount = (numPrice * validDiscount) / 100
  const sellingPrice = numPrice - discountAmount

  // Return formatted to 2 decimal places
  return sellingPrice.toFixed(2)
}

// Add a numeric version of the function
export const calculateSellingPriceAsNumber = (price: string | number, discount: string | number): number => {
  if (!price || isNaN(Number(price))) return 0

  const numPrice = typeof price === "string" ? Number.parseFloat(price) : price
  const numDiscount = typeof discount === "string" ? Number.parseFloat(discount || "0") : discount || 0

  if (isNaN(numPrice) || isNaN(numDiscount)) return 0
  if (numPrice <= 0) return 0

  // Ensure discount is between 0 and 100
  const validDiscount = Math.max(0, Math.min(100, numDiscount))

  // Calculate with high precision
  const discountAmount = (numPrice * validDiscount) / 100
  const sellingPrice = numPrice - discountAmount

  // Return as number with 2 decimal precision
  return Number(sellingPrice.toFixed(2))
}

// Update the calculateDiscountFromPrices function to handle more precise calculations
export const calculateDiscountFromPrices = (originalPrice: string | number, sellingPrice: string | number): string => {
  if (!originalPrice || !sellingPrice) return "0"

  const numOriginalPrice = typeof originalPrice === "string" ? Number.parseFloat(originalPrice) : originalPrice
  const numSellingPrice = typeof sellingPrice === "string" ? Number.parseFloat(sellingPrice) : sellingPrice

  if (isNaN(numOriginalPrice) || isNaN(numSellingPrice) || numOriginalPrice <= 0) return "0"

  // If selling price is higher than original, no discount
  if (numSellingPrice >= numOriginalPrice) return "0"

  // Calculate discount with high precision
  const discountAmount = numOriginalPrice - numSellingPrice
  const discountPercentage = (discountAmount / numOriginalPrice) * 100

  // Return with full precision (no fixed decimal places)
  return discountPercentage.toString()
}

// Add a new function to format discount percentage with variable precision
export const formatDiscountPercentage = (discount: number | string, maxDecimals = 6): string => {
  if (discount === null || discount === undefined || discount === "") return "0"

  const numDiscount = typeof discount === "string" ? Number.parseFloat(discount) : discount

  if (isNaN(numDiscount)) return "0"

  // Remove trailing zeros but keep up to maxDecimals
  const formatted = numDiscount.toFixed(maxDecimals).replace(/\.?0+$/, "")
  return formatted === "" ? "0" : formatted
}

/**
 * Validate a price input
 * @param value - The price value to validate
 * @param options - Validation options
 * @returns Error message or null if valid
 */
export const validatePriceInput = (
  value: string | number,
  options: {
    required?: boolean
    min?: number
    max?: number
    fieldName?: string
  } = {},
): string | null => {
  const { required = false, min = 0, max, fieldName = "Price" } = options

  // Check if required
  if (required && (!value || value === "")) {
    return `${fieldName} is required`
  }

  // If not required and empty, it's valid
  if (!required && (!value || value === "")) {
    return null
  }

  const numValue = typeof value === "string" ? Number.parseFloat(value) : value

  // Check if it's a valid number
  if (isNaN(numValue)) {
    return `${fieldName} must be a valid number`
  }

  // Check minimum value
  if (min !== undefined && numValue < min) {
    return `${fieldName} must be at least ${min}`
  }

  // Check maximum value
  if (max !== undefined && numValue > max) {
    return `${fieldName} cannot exceed ${max}`
  }

  return null
}
