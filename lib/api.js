const API_BASE_URL = "https://backend-project-r734.onrender.com"

// Helper function to get auth token
const getAuthToken = () => {
  if (typeof window === "undefined") return null

  try {
    // Check both localStorage and sessionStorage
    return localStorage.getItem("adminToken") || sessionStorage.getItem("adminToken")
  } catch (error) {
    console.error("Error accessing token storage:", error)
    return null
  }
}

// Helper function to make authenticated API requests
export const fetchApi = async (endpoint, options = {}) => {
  const token = getAuthToken()

  console.log("Making API request:", {
    endpoint,
    hasToken: !!token,
    tokenLength: token ? token.length : 0,
  })

  const defaultOptions = {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  }

  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...(options.headers || {}),
    },
  }

  try {
    console.log(`Fetching from: ${API_BASE_URL}${endpoint}`)
    console.log("Request headers:", mergedOptions.headers)

    const response = await fetch(`${API_BASE_URL}${endpoint}`, mergedOptions)

    // Handle 401 Unauthorized errors specifically
    if (response.status === 401) {
      console.error("Authentication failed (401):", endpoint)

      // Clear token and redirect to login
      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem("adminToken")
          localStorage.removeItem("adminInfo")
          localStorage.removeItem("adminLoginTime")
          localStorage.removeItem("adminSessionId")
          localStorage.removeItem("adminTokenExpiry")

          sessionStorage.removeItem("adminToken")
          sessionStorage.removeItem("adminInfo")
          sessionStorage.removeItem("adminLoginTime")
          sessionStorage.removeItem("adminSessionId")
          sessionStorage.removeItem("adminTokenExpiry")

          // Also clear the cookie
          document.cookie = "adminToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict"
        } catch (error) {
          console.error("Error clearing localStorage:", error)
        }

        // Only redirect if we're in the browser
        window.location.href = "/login"
      }

      throw new Error("Authentication failed. Please login again.")
    }

    // Handle 400 Bad Request errors
    if (response.status === 400) {
      const errorData = await response.json().catch(() => ({}))
      console.error("Bad request (400):", endpoint, errorData)
      throw new Error(errorData.message || "Bad request - please check your request parameters")
    }

    // Handle 404 Not Found errors
    if (response.status === 404) {
      console.error("API endpoint not found (404):", endpoint)
      throw new Error(`API endpoint not found: ${endpoint}`)
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error("API request failed:", response.status, errorData)
      throw new Error(errorData.message || `API request failed with status ${response.status}`)
    }

    const data = await response.json()
    console.log(`Response from ${endpoint}:`, data)
    return data
  } catch (error) {
    console.error(`API request error for ${endpoint}:`, error)
    throw error
  }
}

// Function to handle file uploads with improved error handling and retry logic
export const uploadFiles = async (files, additionalData = {}, retryCount = 0) => {
  const token = getAuthToken()

  if (!token) {
    console.error("No authentication token found for file upload")
    throw new Error("Authentication required. Please login again.")
  }

  // Validate files
  if ((!Array.isArray(files) || files.length === 0) && !(files instanceof File)) {
    console.error("No valid files provided for upload")
    throw new Error("Please select at least one image to upload")
  }

  const formData = new FormData()

  // Add all files to the FormData
  if (Array.isArray(files)) {
    // Log file details for debugging
    files.forEach((file, index) => {
      console.log(`File ${index}:`, {
        name: file.name,
        type: file.type,
        size: `${(file.size / 1024).toFixed(2)} KB`,
      })

      // Check file type
      if (!file.type.startsWith("image/")) {
        throw new Error(`File "${file.name}" is not an image. Only image files are allowed.`)
      }

      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error(`File "${file.name}" exceeds the 5MB size limit.`)
      }

      formData.append(`images`, file)
    })
  } else if (files instanceof File) {
    // Check file type
    if (!files.type.startsWith("image/")) {
      throw new Error(`File "${files.name}" is not an image. Only image files are allowed.`)
    }

    // Check file size (limit to 5MB)
    if (files.size > 5 * 1024 * 1024) {
      throw new Error(`File "${files.name}" exceeds the 5MB size limit.`)
    }

    formData.append("images", files)
  }

  // Add additional data to the FormData with proper type conversion
  if (additionalData.name !== undefined) formData.append("name", additionalData.name)
  if (additionalData.description !== undefined) formData.append("description", additionalData.description)
  if (additionalData.stock !== undefined) formData.append("stock", Number.parseInt(additionalData.stock, 10))
  if (additionalData.category !== undefined) formData.append("category", additionalData.category)
  if (additionalData.material !== undefined) formData.append("material", additionalData.material)
  if (additionalData.grade !== undefined) formData.append("grade", additionalData.grade)
  if (additionalData.price !== undefined) formData.append("price", Number.parseFloat(additionalData.price))
  if (additionalData.gem !== undefined && additionalData.gem !== "") formData.append("gem", additionalData.gem)
  if (additionalData.coating !== undefined && additionalData.coating !== "")
    formData.append("coating", additionalData.coating)
  if (additionalData.size !== undefined && additionalData.size !== "") formData.append("size", additionalData.size)

  console.log("Uploading product with form data:", {
    files: Array.isArray(files) ? files.length : 1,
    additionalData: JSON.stringify({
      name: additionalData.name,
      description: additionalData.description,
      stock: Number.parseInt(additionalData.stock, 10),
      category: additionalData.category,
      material: additionalData.material,
      grade: additionalData.grade,
      price: Number.parseFloat(additionalData.price),
      gem: additionalData.gem,
      coating: additionalData.coating,
      size: additionalData.size,
    }),
  })

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/product/add`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        // Note: Do NOT set Content-Type here, the browser will set it with the correct boundary for FormData
      },
      body: formData,
    })

    // Log response status for debugging
    console.log(`Upload response status: ${response.status}`)

    // Handle specific error cases
    if (response.status === 413) {
      throw new Error("File upload failed: Files are too large. Please reduce file size or upload fewer files.")
    }

    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage = "File upload failed"

      try {
        // Try to parse as JSON
        const errorData = JSON.parse(errorText)
        errorMessage = errorData.message || errorMessage
      } catch (e) {
        // If not JSON, use the text as is if it exists
        if (errorText) {
          errorMessage = `File upload failed: ${errorText}`
        }
      }

      console.error("Upload error response:", errorText)
      throw new Error(errorMessage)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("File upload error:", error)

    // Implement retry logic for network errors
    if ((error.message.includes("network") || error.message.includes("fetch")) && retryCount < 2) {
      console.log(`Retrying upload (attempt ${retryCount + 1})...`)
      return uploadFiles(files, additionalData, retryCount + 1)
    }

    throw error
  }
}

// Function to update product with files
export const updateProductWithFiles = async (productId, data, files) => {
  const token = getAuthToken()

  if (!token) {
    console.error("No authentication token found for product update")
    throw new Error("Authentication required. Please login again.")
  }

  const formData = new FormData()

  // Add productId to the FormData
  formData.append("productId", productId)

  // Add all other data to the FormData
  // Ensure data types match API requirements
  if (data.name !== undefined) formData.append("name", data.name)
  if (data.description !== undefined) formData.append("description", data.description)
  if (data.stock !== undefined) formData.append("stock", Number.parseInt(data.stock, 10))
  if (data.category !== undefined) formData.append("category", data.category)
  if (data.material !== undefined) formData.append("material", data.material)
  if (data.grade !== undefined) formData.append("grade", data.grade)
  if (data.price !== undefined) formData.append("price", Number.parseFloat(data.price))
  if (data.gem !== undefined && data.gem !== "") formData.append("gem", data.gem)
  if (data.coating !== undefined && data.coating !== "") formData.append("coating", data.coating)
  if (data.size !== undefined && data.size !== "") formData.append("size", data.size)

  // Add files to the FormData if they exist
  if (files && files.length > 0) {
    // Validate files
    files.forEach((file, index) => {
      // Check file type
      if (!file.type.startsWith("image/")) {
        throw new Error(`File "${file.name}" is not an image. Only image files are allowed.`)
      }

      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error(`File "${file.name}" exceeds the 5MB size limit.`)
      }

      formData.append("images", file)
    })
  }

  console.log("Updating product with form data:", {
    productId,
    data: JSON.stringify({
      name: data.name,
      description: data.description,
      stock: Number.parseInt(data.stock, 10),
      category: data.category,
      material: data.material,
      grade: data.grade,
      price: Number.parseFloat(data.price),
      gem: data.gem,
      coating: data.coating,
      size: data.size,
    }),
    files: files ? files.length : 0,
  })

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/product/update`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        // Note: Do NOT set Content-Type here, the browser will set it with the correct boundary for FormData
      },
      body: formData,
    })

    // Log response status for debugging
    console.log(`Update response status: ${response.status}`)

    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage = "Product update failed"

      try {
        // Try to parse as JSON
        const errorData = JSON.parse(errorText)
        errorMessage = errorData.message || errorMessage
      } catch (e) {
        // If not JSON, use the text as is if it exists
        if (errorText) {
          errorMessage = `Product update failed: ${errorText}`
        }
      }

      console.error("Update error response:", errorText)
      throw new Error(errorMessage)
    }

    return await response.json()
  } catch (error) {
    console.error("Product update error:", error)
    throw error
  }
}
