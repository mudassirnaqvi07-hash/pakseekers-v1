/**
 * PakSeekers — Route Authorization Proxy
 *
 * This proxy (formerly "middleware") runs on the edge before every matched request.
 * It enforces authentication on protected routes at the server level — so even a
 * direct URL entry by an unauthenticated visitor is rejected before any page code runs.
 *
 * Access model:
 *   PUBLIC  — /exams, /exams/[examId], /exams/.../subjects/*, /exams/.../topics/[topicId]
 *             /student/login, /student/register
 *
 *   PROTECTED — /student/dashboard, /student/tests, /student/attempts,
 *               /student/results, /student/progress, /student/profile
 *               /exams/.../practice  (actual interactive test canvas)
 *
 * Strategy (optimistic cookie-presence check — no DB call in the proxy):
 *   - If a protected route is accessed without a session cookie → redirect to
 *     /student/login?callbackUrl=<encodedOriginalPath>.
 *   - If an authenticated student visits /student/login or /student/register →
 *     redirect to /student/dashboard.
 *   - All other requests pass through unmodified.
 *
 * NOTE: This is an optimistic/cookie-presence check only.
 * The actual session validity is re-verified at the Data Access Layer
 * (requireStudent / requireAdmin) in every protected Server Component and
 * Server Action. Never rely solely on this proxy for data-level security.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminEntryPath } from "@/lib/config/admin-path";

// Must match the constant in src/server/auth/session.ts
const SESSION_COOKIE_NAME = "pakseekers_session";

// ---------------------------------------------------------------------------
// Route classification
// ---------------------------------------------------------------------------

/**
 * Routes that require an authenticated student session.
 * Matched with startsWith so all sub-routes are covered automatically.
 */
const STUDENT_PROTECTED_PREFIXES = [
  "/student/dashboard",
  "/student/tests",
  "/student/attempts",
  "/student/results",
  "/student/progress",
  "/student/profile",
] as const;

/**
 * The /exams/.../practice path segment that activates the interactive test canvas.
 * Public topic/subject info pages (/exams/.../topics/[topicId]) are NOT protected.
 */
const EXAM_PRACTICE_SEGMENT = "/practice";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function hasSessionCookie(request: NextRequest): boolean {
  return !!request.cookies.get(SESSION_COOKIE_NAME)?.value;
}

function isStudentProtectedRoute(pathname: string): boolean {
  return STUDENT_PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isExamPracticeRoute(pathname: string): boolean {
  // Matches /exams/.../practice, /practice/:id, /tests/:id
  return (
    pathname.endsWith(EXAM_PRACTICE_SEGMENT) ||
    pathname.startsWith("/practice/") ||
    pathname.startsWith("/tests/")
  );
}

function buildLoginRedirect(request: NextRequest): NextResponse {
  const loginUrl = new URL("/student/login", request.nextUrl);
  // Preserve the full original path + search so the user is returned after auth
  const callbackUrl = request.nextUrl.pathname + request.nextUrl.search;
  loginUrl.searchParams.set("callbackUrl", callbackUrl);
  return NextResponse.redirect(loginUrl);
}

// ---------------------------------------------------------------------------
// Proxy function (entry point — must be exported as `proxy`)
// ---------------------------------------------------------------------------

export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  // Normalize pathname by stripping trailing slashes for consistent segment matching
  const normalizedPath = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  const authenticated = hasSessionCookie(request);
  const adminEntryPath = getAdminEntryPath();

  // 1. Secret Admin Entry Path — rewrite internally to /admin/login while keeping URL intact
  if (normalizedPath === adminEntryPath) {
    return NextResponse.rewrite(new URL("/admin/login", request.nextUrl));
  }

  // 2. Direct /admin/login is denied / returns 404 Not Found to prevent URL disclosure
  if (normalizedPath === "/admin/login") {
    return NextResponse.rewrite(new URL("/not-found", request.nextUrl), { status: 404 });
  }

  // 3. Admin portal protected routes — edge redirect unauthenticated requests to the private entry path
  if (normalizedPath.startsWith("/admin")) {
    if (!authenticated) {
      return NextResponse.redirect(new URL(adminEntryPath, request.nextUrl));
    }
    return NextResponse.next();
  }

  // 2. Protected student portal routes (/student/dashboard, /student/tests, etc.)
  if (isStudentProtectedRoute(normalizedPath)) {
    if (!authenticated) {
      return buildLoginRedirect(request);
    }
    return NextResponse.next();
  }

  // 3. Protected exam practice routes (interactive test canvas)
  //    e.g. /exams/mdcat/topics/cell-biology/practice, /practice/:id, /tests/:id
  //    Public topic info pages (/exams/mdcat/topics/cell-biology) are unaffected.
  if (isExamPracticeRoute(normalizedPath)) {
    if (!authenticated) {
      return buildLoginRedirect(request);
    }
    return NextResponse.next();
  }

  // 4. Note: Auth pages (/student/login, /admin/login) are intentionally evaluated
  //    by Server Components where the exact role (student vs admin) is resolved from the DB/store.
  //    This avoids infinite redirect loops when an admin navigates to the student portal.

  // 5. All other routes — public, pass through
  return NextResponse.next();
}

// ---------------------------------------------------------------------------
// Matcher — run the proxy on all app routes except Next.js internals & static assets
// ---------------------------------------------------------------------------

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static  (static assets bundled by Next.js)
     * - _next/image   (image optimization service)
     * - favicon.ico
     * - Public folder static files (images, fonts, etc.)
     */
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|woff2?|ttf|otf|eot|css|js)$).*)",
  ],
};
