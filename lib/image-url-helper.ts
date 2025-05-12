/**
 * Helper function to process image URLs and provide fallbacks
 * @param imageUrl The original image URL or path
 * @param fallbackText Text to use in the placeholder fallback
 * @returns A properly formatted image URL
 */
export function getProcessedImageUrl(imageUrl: string | undefined | null, fallbackText = "image"): string {
  // If no image URL is provided, return a placeholder
  if (!imageUrl) {
    return `/placeholder.svg?height=100&width=100&query=${encodeURIComponent(fallbackText)}`
  }

  // Handle absolute URLs (starting with http/https)
  if (imageUrl.startsWith("http")) {
    return imageUrl
  }

  // Handle relative URLs, ensuring they start with a slash
  return imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`
}

/**
 * Creates a fallback URL for when images fail to load
 * @param text Text to use in the placeholder
 * @param width Width of the placeholder
 * @param height Height of the placeholder
 * @returns A placeholder image URL
 */
export function createFallbackImageUrl(text = "image", width = 100, height = 100): string {
  return `/placeholder.svg?height=${height}&width=${width}&query=${encodeURIComponent(text)}`
}

/**
 * Extracts the first image URL from a product's images array or returns the image property
 * @param product The product object from the API
 * @returns The processed image URL
 */
export function getProductImageUrl(product: any): string {
  // Check if product has an images array with at least one item
  if (product.images && Array.isArray(product.images) && product.images.length > 0) {
    // Return the first image URL
    return getProcessedImageUrl(product.images[0], product.name || "product")
  }

  // If no images array or it's empty, try the image property
  if (product.image) {
    return getProcessedImageUrl(product.image, product.name || "product")
  }

  // If no image is found, return a placeholder
  return createFallbackImageUrl(product.name || "product", 100, 100)
}
