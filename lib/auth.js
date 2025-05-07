import { fetchApi } from "./api"

// Check if user is authenticated
export const isAuthenticated = () => {
  if (typeof window === "undefined") return false

  const token = localStorage.getItem("adminToken")
  return !!token
}

// Login function
export const login = async (email, password) => {
  try {
    const response = await fetchApi("/api/v1/admin/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })

    if (response.success && response.data && response.data.token) {
      localStorage.setItem("adminToken", response.data.token)

      // Store admin info if available
      if (response.data.admin) {
        localStorage.setItem("adminInfo", JSON.stringify(response.data.admin))
      }

      return { success: true, data: response.data }
    } else {
      throw new Error("No token received")
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// Logout function
export const logout = () => {
  localStorage.removeItem("adminToken")
  localStorage.removeItem("adminInfo")

  // Force reload to clear any state
  window.location.href = "/login"
}

// Get admin info
export const getAdminInfo = () => {
  if (typeof window === "undefined") return null

  const adminInfo = localStorage.getItem("adminInfo")
  return adminInfo ? JSON.parse(adminInfo) : null
}
