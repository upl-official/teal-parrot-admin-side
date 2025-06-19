import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { isCrawler } from "./lib/security-utils"

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const userAgent = request.headers.get("user-agent")

  // Block crawlers completely with 403 response
  if (isCrawler(userAgent)) {
    console.log(`Crawler blocked: ${userAgent}`)
    return new NextResponse("Forbidden", { status: 403 })
  }

  // Define paths that are accessible without authentication
  const isPublicPath = path === "/login"
  const isAuthTestPath = path === "/auth-test"
  const isRedirectPath = path === "/redirect"

  // Get the token from cookies
  const token = request.cookies.get("adminToken")?.value || ""

  console.log(`Middleware check: Path=${path}, hasToken=${!!token}`)

  // Handle auth test and redirect paths
  if (isAuthTestPath || isRedirectPath) {
    const response = NextResponse.next()
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive")
    return response
  }

  // Redirect logic based on authentication status
  if (isPublicPath && token) {
    // If user is on login page but has a token, redirect to dashboard
    console.log("Middleware: User has token on login page, redirecting to dashboard")
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  if (!isPublicPath && !token) {
    // If user is on a protected path but doesn't have a token, redirect to login
    console.log("Middleware: User has no token on protected path, redirecting to login")
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Add security headers to all responses
  const response = NextResponse.next()

  // Add noindex header to all responses
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive")

  // Add basic security headers
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-XSS-Protection", "1; mode=block")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")

  // Add cache control for auth-related pages
  if (!isPublicPath) {
    response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate")
    response.headers.set("Pragma", "no-cache")
    response.headers.set("Expires", "0")
  }

  return response
}

// Specify paths to run middleware on
export const config = {
  matcher: ["/login", "/dashboard/:path*", "/auth-test", "/redirect"],
}
