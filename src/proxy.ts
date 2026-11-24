/**
 * PakSeekers — Route Authorization Proxy
 *
 * Runs on the edge before every matched request to enforce early route boundaries
 * across all three private portals (Student, Staff, Admin) and APIs.
 *
 * NOTE: This is an optimistic/cookie-presence check only.
 * Authoritative identity, role, account status, and granular permissions are
 * strictly verified from MongoDB on every protected Server Component, Server Action,
 * and API route via requireStudent / requireStaff / requireAdmin / verifyPermissionAuth.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminEntryPath } from "@/lib/config/admin-path";

const SESSION_COOKIE_NAME = "pakseekers_session";

const STUDENT_PUBLIC_AUTH_ROUTES = new Set(["/student/login", "/student/register"]);
const STAFF_PUBLIC_AUTH_ROUTES = new Set(["/staff/login"]);
const EXAM_PRACTICE_SEGMENT = "/practice";

function hasSessionCookie(request: NextRequest): boolean {
  return !!request.cookies.get(SESSION_COOKIE_NAME)?.value;
}

function isStudentProtectedRoute(pathname: string): boolean {
  if (STUDENT_PUBLIC_AUTH_ROUTES.has(pathname)) {
    return false;
  }
  return pathname === "/student" || pathname.startsWith("/student/");
}

function isStaffProtectedRoute(pathname: string): boolean {
  if (STAFF_PUBLIC_AUTH_ROUTES.has(pathname)) {
    return false;
  }
  return pathname === "/staff" || pathname.startsWith("/staff/");
}

function isExamPracticeRoute(pathname: string): boolean {
  return (
    pathname.endsWith(EXAM_PRACTICE_SEGMENT) ||
    pathname.startsWith("/practice/") ||
    pathname.startsWith("/tests/")
  );
}

function buildLoginRedirect(request: NextRequest, loginPath = "/student/login"): NextResponse {
  const loginUrl = new URL(loginPath, request.nextUrl);
  const callbackUrl = request.nextUrl.pathname + request.nextUrl.search;
  loginUrl.searchParams.set("callbackUrl", callbackUrl);
  return NextResponse.redirect(loginUrl);
}

export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const normalizedPath = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  const authenticated = hasSessionCookie(request);
  const adminEntryPath = getAdminEntryPath();

  // 1. Secret Admin Entry Path — rewrite internally to /admin/login while keeping URL intact
  if (normalizedPath === adminEntryPath) {
    return NextResponse.rewrite(new URL("/admin/login", request.nextUrl));
  }

  // 2. Direct /admin/login is hidden (returns 404 Not Found to prevent URL disclosure)
  if (normalizedPath === "/admin/login") {
    return NextResponse.rewrite(new URL("/not-found", request.nextUrl), { status: 404 });
  }

  // 3. API Private Boundaries — reject unauthenticated requests early with 401
  if (normalizedPath.startsWith("/api/admin") || normalizedPath.startsWith("/api/staff")) {
    if (!authenticated) {
      return NextResponse.json(
        { error: "Unauthorized: Authentication is required." },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  // 4. Admin Portal Protected Routes
  if (normalizedPath === "/admin" || normalizedPath.startsWith("/admin/")) {
    if (!authenticated) {
      return NextResponse.redirect(new URL(adminEntryPath, request.nextUrl));
    }
    return NextResponse.next();
  }

  // 5. Staff Portal Protected Routes (excludes /staff/login)
  if (isStaffProtectedRoute(normalizedPath)) {
    if (!authenticated) {
      return buildLoginRedirect(request, "/staff/login");
    }
    return NextResponse.next();
  }

  // 6. Student Portal Protected Routes (excludes /student/login and /student/register)
  if (isStudentProtectedRoute(normalizedPath)) {
    if (!authenticated) {
      return buildLoginRedirect(request, "/student/login");
    }
    return NextResponse.next();
  }

  // 7. Interactive Exam Practice & Direct Test Routes
  if (isExamPracticeRoute(normalizedPath)) {
    if (!authenticated) {
      return buildLoginRedirect(request, "/student/login");
    }
    return NextResponse.next();
  }

  // 8. Auth pages (/student/login, /student/register, /staff/login) & public pages pass through;
  //    Server Components resolve live DB role for authenticated redirects / account switching.
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|woff2?|ttf|otf|eot|css|js)$).*)",
  ],
};
