import { fetchApi } from "./api"

// Check if user is authenticated
export const isAuthenticated = () => {
  if (typeof window === "undefined") return false

  try {
    const token = localStorage.getItem("adminToken")
    if (!token) return false

    // Basic validation that the token exists and has some length
    return token.length > 10
  } catch (error) {
    console.error("Error checking authentication:", error)
    return false
  }
}

// Login function
export const login = async (email, password) => {
  try {
    console.log("Making login API request")
    const response = await fetchApi("/api/v1/admin/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })

    console.log("Login API response:", response)

    if (response.success && response.data && response.data.token) {
      // Safely store token in localStorage
      try {
        // Clear any existing tokens first
        localStorage.removeItem("adminToken")
        localStorage.removeItem("adminInfo")

        // Set the new token and admin info
        localStorage.setItem("adminToken", response.data.token)

        // Store admin info if available
        if (response.data.admin) {
          localStorage.setItem("adminInfo", JSON.stringify(response.data.admin))
        }

        console.log("Token and admin info stored successfully")

        // Also store in a cookie for middleware access
        document.cookie = `adminToken=${response.data.token}; path=/; max-age=86400; SameSite=Strict`

        return { success: true, data: response.data }
      } catch (storageError) {
        console.error("Error storing auth data:", storageError)
        return { success: false, error: "Failed to store authentication data" }
      }
    } else {
      // Handle specific error messages from the API
      let errorMessage = "Authentication failed"

      if (response.message) {
        errorMessage = response.message
      } else if (response.error) {
        errorMessage = response.error
      } else if (!response.success) {
        errorMessage = "Invalid credentials. Please check your email and password."
      }

      console.error("Authentication error:", errorMessage)
      throw new Error(errorMessage)
    }
  } catch (error) {
    console.error("Login error:", error)

    // Check if the error is related to invalid credentials
    const errorMessage = error.message || "Authentication failed"

    if (
      errorMessage.toLowerCase().includes("invalid") ||
      errorMessage.toLowerCase().includes("incorrect") ||
      errorMessage.toLowerCase().includes("wrong") ||
      errorMessage.toLowerCase().includes("not found") ||
      errorMessage.toLowerCase().includes("unauthorized") ||
      errorMessage.toLowerCase().includes("401")
    ) {
      return {
        success: false,
        error: "Invalid credentials. Please check your email and password.",
      }
    }

    return {
      success: false,
      error: errorMessage,
    }
  }
}

// Logout function
export const logout = () => {
  try {
    localStorage.removeItem("adminToken")
    localStorage.removeItem("adminInfo")

    // Also clear the cookie
    document.cookie = "adminToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict"

    console.log("Logged out successfully")

    // Force reload to clear any state
    window.location.href = "/login"
  } catch (error) {
    console.error("Error during logout:", error)
    // Still redirect even if there was an error clearing localStorage
    window.location.href = "/login"
  }
}

// Get admin info
export const getAdminInfo = () => {
  if (typeof window === "undefined") return null

  try {
    const adminInfo = localStorage.getItem("adminInfo")
    return adminInfo ? JSON.parse(adminInfo) : null
  } catch (error) {
    console.error("Error getting admin info:", error)
    return null
  }
}
