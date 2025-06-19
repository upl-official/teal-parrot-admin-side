import { fetchApi } from "./api"

// Token expiration time (24 hours in milliseconds)
const TOKEN_EXPIRATION_TIME = 24 * 60 * 60 * 1000

// Storage keys
const STORAGE_KEYS = {
  TOKEN: "adminToken",
  ADMIN_INFO: "adminInfo",
  LOGIN_TIME: "adminLoginTime",
  SESSION_ID: "adminSessionId",
  TOKEN_EXPIRY: "adminTokenExpiry",
}

// Generate a unique session ID
const generateSessionId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// Check if we're in a browser environment
const isBrowser = () => typeof window !== "undefined"

// Clear all authentication data
const clearAuthData = () => {
  if (!isBrowser()) return

  try {
    // Clear localStorage
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key)
    })

    // Clear sessionStorage
    Object.values(STORAGE_KEYS).forEach((key) => {
      sessionStorage.removeItem(key)
    })

    // Clear cookies
    document.cookie = `${STORAGE_KEYS.TOKEN}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict`

    console.log("All authentication data cleared")
  } catch (error) {
    console.error("Error clearing auth data:", error)
  }
}

// Decode JWT token (basic implementation without verification)
const decodeJWT = (token) => {
  try {
    const parts = token.split(".")
    if (parts.length !== 3) return null

    const payload = parts[1]
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")))
    return decoded
  } catch (error) {
    console.error("Error decoding JWT:", error)
    return null
  }
}

// Validate token expiration
const isTokenExpired = (loginTime, tokenExpiry) => {
  const now = Date.now()

  // Check login time expiration (24 hours)
  if (loginTime) {
    const timeDiff = now - Number.parseInt(loginTime)
    if (timeDiff > TOKEN_EXPIRATION_TIME) {
      console.log("Token expired: 24 hour limit reached")
      return true
    }
  }

  // Check JWT expiration if available
  if (tokenExpiry) {
    const expiryTime = Number.parseInt(tokenExpiry)
    if (now > expiryTime) {
      console.log("Token expired: JWT expiry reached")
      return true
    }
  }

  return false
}

// Enhanced client-side token validation
const validateTokenStructure = (token) => {
  if (!token || typeof token !== "string") return false

  // Basic length check
  if (token.length < 10) return false

  // Check if it looks like a JWT
  const parts = token.split(".")
  if (parts.length === 3) {
    // Try to decode JWT
    const decoded = decodeJWT(token)
    if (decoded) {
      // Check if JWT has required fields
      return decoded.exp || decoded.iat || decoded.sub || decoded.email
    }
  }

  // For non-JWT tokens, just check basic structure
  return token.length > 20 && /^[A-Za-z0-9+/=._-]+$/.test(token)
}

// Check if user is authenticated with enhanced validation
export const isAuthenticated = () => {
  if (!isBrowser()) return false

  try {
    // Check both localStorage and sessionStorage
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN) || sessionStorage.getItem(STORAGE_KEYS.TOKEN)
    const loginTime = localStorage.getItem(STORAGE_KEYS.LOGIN_TIME) || sessionStorage.getItem(STORAGE_KEYS.LOGIN_TIME)
    const sessionId = localStorage.getItem(STORAGE_KEYS.SESSION_ID) || sessionStorage.getItem(STORAGE_KEYS.SESSION_ID)
    const tokenExpiry =
      localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY) || sessionStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY)

    if (!token || !loginTime || !sessionId) {
      console.log("Authentication check failed: Missing required data")
      return false
    }

    // Validate token structure
    if (!validateTokenStructure(token)) {
      console.log("Authentication check failed: Invalid token structure")
      clearAuthData()
      return false
    }

    // Check if token is expired
    if (isTokenExpired(loginTime, tokenExpiry)) {
      console.log("Authentication check failed: Token expired")
      clearAuthData()
      return false
    }

    console.log("Authentication check passed")
    return true
  } catch (error) {
    console.error("Error checking authentication:", error)
    clearAuthData()
    return false
  }
}

// Validate token by making a lightweight API call (using available endpoints)
export const validateTokenWithAPI = async () => {
  if (!isBrowser()) return false

  try {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN) || sessionStorage.getItem(STORAGE_KEYS.TOKEN)

    if (!token) return false

    // Use the admin user list endpoint to validate token (lightweight call)
    const response = await fetchApi("/api/v1/admin/user/list", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (response.success || response.data) {
      console.log("Token validation via API successful")
      return true
    } else {
      console.log("Token validation via API failed")
      clearAuthData()
      return false
    }
  } catch (error) {
    console.error("Error validating token via API:", error)

    // If it's a 401 or 403 error, clear auth data
    if (error.message && (error.message.includes("401") || error.message.includes("403"))) {
      clearAuthData()
    }

    return false
  }
}

// Login function with enhanced session management
export const login = async (email, password, rememberMe = false) => {
  try {
    console.log("Making login API request")

    // Clear any existing auth data first
    clearAuthData()

    const response = await fetchApi("/api/v1/admin/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })

    console.log("Login API response:", response)

    if (response.success && response.data && response.data.token) {
      const now = Date.now()
      const sessionId = generateSessionId()
      const token = response.data.token

      try {
        // Try to decode JWT to get expiration
        let tokenExpiry = null
        const decoded = decodeJWT(token)
        if (decoded && decoded.exp) {
          tokenExpiry = decoded.exp * 1000 // Convert to milliseconds
        } else {
          // If no JWT expiry, set our own (24 hours from now)
          tokenExpiry = now + TOKEN_EXPIRATION_TIME
        }

        // Choose storage based on "Remember Me" option
        const storage = rememberMe ? localStorage : sessionStorage

        // Store authentication data
        storage.setItem(STORAGE_KEYS.TOKEN, token)
        storage.setItem(STORAGE_KEYS.LOGIN_TIME, now.toString())
        storage.setItem(STORAGE_KEYS.SESSION_ID, sessionId)
        storage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, tokenExpiry.toString())

        // Store admin info if available
        if (response.data.admin) {
          storage.setItem(STORAGE_KEYS.ADMIN_INFO, JSON.stringify(response.data.admin))
        }

        // Also store in cookie for middleware access
        const cookieExpiry = rememberMe ? "; max-age=86400" : "" // 24 hours or session
        document.cookie = `${STORAGE_KEYS.TOKEN}=${token}; path=/${cookieExpiry}; SameSite=Strict; Secure`

        console.log("Authentication data stored successfully")

        // Set up automatic logout timer
        setupAutoLogout(tokenExpiry)

        return { success: true, data: response.data }
      } catch (storageError) {
        console.error("Error storing auth data:", storageError)
        return { success: false, error: "Failed to store authentication data" }
      }
    } else {
      let errorMessage = "Authentication failed"

      if (response.message) {
        errorMessage = response.message
      } else if (response.error) {
        errorMessage = response.error
      } else if (!response.success) {
        errorMessage = "Invalid credentials. Please check your email and password."
      }

      console.error("Authentication error:", errorMessage)
      return { success: false, error: errorMessage }
    }
  } catch (error) {
    console.error("Login error:", error)

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

// Setup automatic logout timer with smart expiry calculation
const setupAutoLogout = (tokenExpiry) => {
  if (!isBrowser()) return

  // Clear any existing timer
  if (window.autoLogoutTimer) {
    clearTimeout(window.autoLogoutTimer)
  }

  const now = Date.now()
  const timeUntilExpiry = tokenExpiry - now

  // Set timer for the earlier of: token expiry or 24 hours
  const logoutTime = Math.min(timeUntilExpiry, TOKEN_EXPIRATION_TIME)

  if (logoutTime > 0) {
    window.autoLogoutTimer = setTimeout(() => {
      console.log("Auto logout triggered due to token expiration")
      logout("Session expired")
    }, logoutTime)

    console.log(`Auto logout timer set for ${Math.round(logoutTime / 1000 / 60)} minutes`)
  } else {
    // Token is already expired
    console.log("Token already expired, logging out immediately")
    logout("Session expired")
  }
}

// Enhanced logout function
export const logout = (reason = "User logout") => {
  try {
    console.log(`Logging out: ${reason}`)

    // Clear the auto logout timer
    if (window.autoLogoutTimer) {
      clearTimeout(window.autoLogoutTimer)
      window.autoLogoutTimer = null
    }

    // Clear all authentication data
    clearAuthData()

    // Force reload to clear any state and redirect to login
    window.location.href = "/login"
  } catch (error) {
    console.error("Error during logout:", error)
    // Still redirect even if there was an error
    window.location.href = "/login"
  }
}

// Get admin info with validation
export const getAdminInfo = () => {
  if (!isBrowser()) return null

  try {
    // Check if user is still authenticated
    if (!isAuthenticated()) {
      return null
    }

    const adminInfo = localStorage.getItem(STORAGE_KEYS.ADMIN_INFO) || sessionStorage.getItem(STORAGE_KEYS.ADMIN_INFO)

    return adminInfo ? JSON.parse(adminInfo) : null
  } catch (error) {
    console.error("Error getting admin info:", error)
    return null
  }
}

// Initialize authentication system
export const initializeAuth = () => {
  if (!isBrowser()) return

  try {
    // Check if user is authenticated on page load
    if (isAuthenticated()) {
      console.log("User authenticated on page load")

      // Get token expiry and set up auto logout
      const tokenExpiry =
        localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY) || sessionStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY)
      if (tokenExpiry) {
        setupAutoLogout(Number.parseInt(tokenExpiry))
      }
    } else {
      console.log("User not authenticated on page load")
      clearAuthData()
    }

    // Set up periodic token validation (every 10 minutes) - less frequent to avoid unnecessary API calls
    setInterval(
      () => {
        if (isAuthenticated()) {
          // Only validate with API occasionally to avoid overloading
          if (Math.random() < 0.3) {
            // 30% chance
            validateTokenWithAPI().catch((error) => {
              console.warn("Periodic API validation failed:", error)
            })
          }
        }
      },
      10 * 60 * 1000,
    )

    // Handle page visibility change (tab switching)
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && isAuthenticated()) {
        // Just check client-side validation when tab becomes visible
        console.log("Tab became visible, checking authentication")
        if (!isAuthenticated()) {
          logout("Session expired while tab was hidden")
        }
      }
    })

    // Handle beforeunload for session storage cleanup
    window.addEventListener("beforeunload", () => {
      // If using sessionStorage, data will be cleared automatically
      // This is just for cleanup of timers
      if (window.autoLogoutTimer) {
        clearTimeout(window.autoLogoutTimer)
      }
    })
  } catch (error) {
    console.error("Error initializing auth system:", error)
  }
}

// Get token for API calls
export const getAuthToken = () => {
  if (!isBrowser()) return null

  if (!isAuthenticated()) return null

  return localStorage.getItem(STORAGE_KEYS.TOKEN) || sessionStorage.getItem(STORAGE_KEYS.TOKEN)
}

// Check if session is about to expire (within 5 minutes)
export const isSessionNearExpiry = () => {
  if (!isBrowser()) return false

  try {
    const tokenExpiry =
      localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY) || sessionStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY)
    const loginTime = localStorage.getItem(STORAGE_KEYS.LOGIN_TIME) || sessionStorage.getItem(STORAGE_KEYS.LOGIN_TIME)

    if (!tokenExpiry && !loginTime) return false

    const now = Date.now()
    const fiveMinutes = 5 * 60 * 1000

    // Check JWT expiry
    if (tokenExpiry) {
      const expiryTime = Number.parseInt(tokenExpiry)
      if (now + fiveMinutes > expiryTime) return true
    }

    // Check 24-hour expiry
    if (loginTime) {
      const loginTimestamp = Number.parseInt(loginTime)
      const sessionExpiry = loginTimestamp + TOKEN_EXPIRATION_TIME
      if (now + fiveMinutes > sessionExpiry) return true
    }

    return false
  } catch (error) {
    console.error("Error checking session expiry:", error)
    return false
  }
}

// Extend session (refresh login time)
export const extendSession = () => {
  if (!isBrowser() || !isAuthenticated()) return false

  try {
    const storage = localStorage.getItem(STORAGE_KEYS.TOKEN) ? localStorage : sessionStorage
    const now = Date.now()
    const newExpiry = now + TOKEN_EXPIRATION_TIME

    // Update login time and expiry
    storage.setItem(STORAGE_KEYS.LOGIN_TIME, now.toString())
    storage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, newExpiry.toString())

    // Reset the auto logout timer
    setupAutoLogout(newExpiry)

    console.log("Session extended successfully")
    return true
  } catch (error) {
    console.error("Error extending session:", error)
    return false
  }
}
