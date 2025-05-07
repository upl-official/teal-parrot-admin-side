const API_BASE_URL = "https://backend-project-r734.onrender.com"

// Helper function to make authenticated API requests
export const fetchApi = async (endpoint, options = {}) => {
  let token = null

  // Safely get token from localStorage
  if (typeof window !== "undefined") {
    try {
      token = localStorage.getItem("adminToken")
      console.log("Token retrieved for API request:", token ? "Token exists" : "No token")
    } catch (error) {
      console.error("Error accessing localStorage:", error)
    }
  }

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
    const response = await fetch(`${API_BASE_URL}${endpoint}`, mergedOptions)

    // Handle 401 Unauthorized errors specifically
    if (response.status === 401) {
      console.error("Authentication failed (401):", endpoint)

      // Clear token and redirect to login
      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem("adminToken")
          localStorage.removeItem("adminInfo")

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

// Update the uploadFiles function to match the API requirements

// Function to handle file uploads
export const uploadFiles = async (files, additionalData = {}) => {
  const token = localStorage.getItem("adminToken")
  const formData = new FormData()

  // Add all files to the FormData
  if (Array.isArray(files)) {
    files.forEach((file) => {
      formData.append(`images`, file)
    })
  } else if (files instanceof File) {
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
    files: files.length,
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
      },
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || "File upload failed")
    }

    return await response.json()
  } catch (error) {
    console.error("File upload error:", error)
    throw error
  }
}

// Function to update product with files
export const updateProductWithFiles = async (productId, data, files) => {
  const token = localStorage.getItem("adminToken")
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
    files.forEach((file) => {
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
      },
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || "Product update failed")
    }

    return await response.json()
  } catch (error) {
    console.error("Product update error:", error)
    throw error
  }
}
