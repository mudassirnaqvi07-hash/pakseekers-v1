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

/**
 * Auth pages — if an already-authenticated student visits these, redirect to dashboard.
 */
const STUDENT_AUTH_PAGES = ["/student/login", "/student/register"] as const;

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
  // Matches /exams/.../practice and /exams/.../practice?testId=...
  // The pathname does NOT include query params, so a simple endsWith check is enough.
  return pathname.endsWith(EXAM_PRACTICE_SEGMENT);
}

function isStudentAuthPage(pathname: string): boolean {
  return STUDENT_AUTH_PAGES.some(
    (page) => pathname === page || pathname.startsWith(page + "/")
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
  const authenticated = hasSessionCookie(request);

  // 1. Student auth pages — bounce authenticated users back to dashboard
  if (isStudentAuthPage(pathname)) {
    if (authenticated) {
      return NextResponse.redirect(new URL("/student/dashboard", request.nextUrl));
    }
    return NextResponse.next();
  }

  // 2. Protected student portal routes
  if (isStudentProtectedRoute(pathname)) {
    if (!authenticated) {
      return buildLoginRedirect(request);
    }
    return NextResponse.next();
  }

  // 3. Protected exam practice routes (interactive test canvas)
  //    e.g. /exams/mdcat/topics/cell-biology/practice
  //    Public topic info pages (/exams/mdcat/topics/cell-biology) are unaffected.
  if (isExamPracticeRoute(pathname)) {
    if (!authenticated) {
      return buildLoginRedirect(request);
    }
    return NextResponse.next();
  }

  // 4. All other routes — public, pass through
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
