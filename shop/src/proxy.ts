import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, verifyToken } from "@/lib/session";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ignore static assets, internal paths, and API/Server Action headers if any
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifyToken(token) : null;

  // 1. Unauthenticated users - allow public showcase & login
  if (!session) {
    if (pathname === "/" || pathname === "/login" || pathname === "/showcase") {
      return NextResponse.next();
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Authenticated users visiting /login
  if (pathname === "/login") {
    if (session.role === "CASHIER" || session.role === "STAFF") {
      return NextResponse.redirect(new URL("/pos", request.url));
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 3. Authenticated users visiting / - allow viewing showcase with staff toolbar
  if (pathname === "/") {
    return NextResponse.next();
  }

  // 4. Role-based Route Guards
  const role = session.role;

  // Manager routes
  const managerAllowedPrefixes = ["/pos", "/products", "/inventory", "/finance"];
  // Cashier routes
  const cashierAllowedPrefixes = ["/pos"];

  if (role === "CASHIER" || role === "STAFF") {
    const isAllowed = cashierAllowedPrefixes.some((p) => pathname.startsWith(p));
    if (!isAllowed) {
      return NextResponse.redirect(new URL("/pos", request.url));
    }
  } else if (role === "MANAGER") {
    const isAllowed = managerAllowedPrefixes.some((p) => pathname.startsWith(p));
    if (!isAllowed) {
      // Manager cannot access finance, sales, reports, settings, dashboard
      return NextResponse.redirect(new URL("/products", request.url));
    }
  }
  // ADMIN and OWNER have full access to all routes

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
