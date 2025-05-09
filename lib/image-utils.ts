/**
 * Utility functions for handling images
 */

/**
 * Downloads and processes images from URLs
 * @param imageUrls Array of image URLs to download
 * @param progressCallback Optional callback for tracking progress
 * @returns Array of File objects
 */
export const downloadAndProcessImages = async (
  imageUrls: string[],
  progressCallback?: (current: number, total: number) => void,
): Promise<File[]> => {
  if (!imageUrls || !imageUrls.length) {
    return []
  }

  const total = imageUrls.length
  let current = 0

  // Process images in parallel with progress tracking
  const imageFilesPromises = imageUrls.map(async (url, index) => {
    try {
      // Normalize URL - ensure it's absolute
      const normalizedUrl = normalizeImageUrl(url)

      // Add cache-busting parameter to avoid cached responses
      const urlWithCacheBust = `${normalizedUrl}${normalizedUrl.includes("?") ? "&" : "?"}cacheBust=${Date.now()}`

      // Fetch the image with proper headers
      const response = await fetch(urlWithCacheBust, {
        headers: {
          Accept: "image/*",
        },
        cache: "no-store",
        mode: "cors",
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`)
      }

      // Get the blob and determine the correct MIME type
      const blob = await response.blob()
      const contentType = response.headers.get("content-type") || blob.type || "image/jpeg"

      // Determine file extension from content type
      const extension = getExtensionFromMimeType(contentType)

      // Create a File object with the correct MIME type
      const file = new File([blob], `product-image-${index}.${extension}`, { type: contentType })

      // Update progress
      current++
      if (progressCallback) {
        progressCallback(current, total)
      }

      return file
    } catch (error) {
      console.error(`Failed to download image ${url}:`, error)

      // Update progress even for failed images
      current++
      if (progressCallback) {
        progressCallback(current, total)
      }

      return null
    }
  })

  // Wait for all downloads to complete and filter out failed ones
  const imageFiles = await Promise.all(imageFilesPromises)
  return imageFiles.filter((file): file is File => file !== null)
}

/**
 * Normalizes an image URL to ensure it's absolute
 */
const normalizeImageUrl = (url: string): string => {
  if (!url) return ""

  // If it's already an absolute URL, return it
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url
  }

  // If it's a relative URL, make it absolute
  // This assumes we're running on the client side
  if (typeof window !== "undefined") {
    const baseUrl = window.location.origin
    return url.startsWith("/") ? `${baseUrl}${url}` : `${baseUrl}/${url}`
  }

  return url
}

/**
 * Gets the appropriate file extension from a MIME type
 */
const getExtensionFromMimeType = (mimeType: string): string => {
  const mimeToExt: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
    "image/svg+xml": "svg",
    "image/bmp": "bmp",
    "image/tiff": "tiff",
  }

  return mimeToExt[mimeType.toLowerCase()] || "jpg"
}
