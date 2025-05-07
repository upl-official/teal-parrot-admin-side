import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Define paths that are accessible without authentication
  const isPublicPath = path === "/login"

  // Get the token from cookies
  const token = request.cookies.get("adminToken")?.value || ""

  console.log(`Middleware check: Path=${path}, isPublicPath=${isPublicPath}, hasToken=${!!token}`)

  // Redirect logic based on authentication status
  if (isPublicPath && token) {
    // If user is on a public path but has a token, redirect to dashboard
    console.log("Middleware: User has token on public path, redirecting to dashboard")
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  if (!isPublicPath && !token) {
    // If user is on a protected path but doesn't have a token, redirect to login
    console.log("Middleware: User has no token on protected path, redirecting to login")
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

// Specify paths to run middleware on
export const config = {
  matcher: ["/login", "/dashboard/:path*"],
}
