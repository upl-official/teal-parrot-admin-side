import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Define paths that are accessible without authentication
  const isPublicPath = path === "/login"

  // Get the token from cookies
  const token = request.cookies.get("adminToken")?.value || ""

  // Redirect logic based on authentication status
  if (isPublicPath && token) {
    // If user is on a public path but has a token, redirect to dashboard
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  if (!isPublicPath && !token) {
    // If user is on a protected path but doesn't have a token, redirect to login
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

// Specify paths to run middleware on
export const config = {
  matcher: ["/login", "/dashboard/:path*"],
}
