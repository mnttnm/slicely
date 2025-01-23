import { updateSession } from "@/server/services/supabase/middleware";
import { type NextRequest } from "next/server";

// List of paths that require authentication
const PROTECTED_PATHS = [
  "/api/", // API routes
  "/settings", // User settings
  "/profile", // User profile
];

// List of paths that should be accessible without authentication
const PUBLIC_PATHS = [
  "/login", // Login page
  "/signup", // Signup page
  "/studio", // Studio routes (read-only for non-authenticated users)
  "/dashboard", // Dashboard routes (read-only for non-authenticated users)
];

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);
  const url = new URL(request.url);

  // Check if the current path requires authentication
  const requiresAuth = PROTECTED_PATHS.some((path) => url.pathname.startsWith(path));
  const isPublicPath = PUBLIC_PATHS.some((path) => url.pathname.startsWith(path));

  // Get session from response headers (set by updateSession)
  const hasSession = response.headers.get("x-session-user") !== null;

  // If the path requires authentication and user is not authenticated, redirect to login
  if (requiresAuth && !hasSession) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("next", url.pathname);
    response.headers.set("location", redirectUrl.toString());
    response.headers.set("status", "302");
  }

  // If user is authenticated and trying to access auth pages (login/signup), redirect to home
  if ((url.pathname === "/login" || url.pathname === "/signup") && hasSession) {
    const redirectUrl = new URL("/", request.url);
    response.headers.set("location", redirectUrl.toString());
    response.headers.set("status", "302");
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};