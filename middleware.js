// src/middleware.js
import { NextResponse } from "next/server";

export function middleware(request) {
  const url = request.nextUrl.clone();
  const path = url.pathname;

  // Define public paths that don't require authentication
  const publicPaths = [
    "/login",
    "/signup",
    "/verifyemail",
    "/Account_verification_email",
  ];

  // Retrieve the token from cookies
  const token = request.cookies.get("token")?.value || "";

  // Define paths that require authentication
  const requiresAuth =
    path.startsWith("/NavComponent/courses/") || path === "/profile";

  // Redirect logged-in users away from public paths
  if (publicPaths.includes(path) && token) {
    return NextResponse.redirect(new URL("/", url));
  }

  // Redirect non-logged-in users to login page if they are trying to access protected paths
  if (requiresAuth && !token) {
    return NextResponse.redirect(new URL("/login", url));
  }

  // Continue if no redirection is needed
  return NextResponse.next();
}

// Configure the middleware to match specific paths
export const config = {
  matcher: [
    "/", // Home page
    "/profile", // User profile page
    "/NavComponent/courses/:path*", // Matches /NavComponent/courses and its sub-paths
    "/login", // Login page
    "/signup", // Signup page
    "/verifyemail", // Email verification page
    "/Account_verification_email", // Account verification email page
  ],
};
