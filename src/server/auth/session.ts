/**
 * Session Management & Route Protection Utilities — PakSeekers Phase 4.
 */

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminEntryPath } from "@/lib/config/admin-path";
import {
  findSessionByToken,
  findUserById,
} from "@/server/repositories/user-repository";
import type { SafeUser, UserSession } from "@/types";

export const SESSION_COOKIE_NAME = "pakseekers_session";

/**
 * Retrieves the raw session token from HTTP-only cookie.
 */
export async function getCurrentSessionToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    return cookieStore.get(SESSION_COOKIE_NAME)?.value || null;
  } catch {
    return null;
  }
}

/**
 * Retrieves the active session from HTTP-only cookie.
 */
export async function getCurrentSession(): Promise<UserSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    return await findSessionByToken(token);
  } catch {
    return null;
  }
}

/**
 * Retrieves the currently authenticated user from the active session.
 * Returns a sanitized SafeUser guaranteed not to expose passwordHash.
 */
export async function getCurrentUser(): Promise<SafeUser | null> {
  try {
    const session = await getCurrentSession();
    if (!session) return null;

    return await findUserById(session.userId);
  } catch (err) {
    console.warn("Could not retrieve user from active session:", err instanceof Error ? err.message : err);
    return null;
  }
}

/**
 * Sets the HTTP-only session cookie.
 *
 * Scoped correctly and consistently for both localhost and LAN IP development:
 * - Leaves `domain` unset to adhere to RFC 6265 Host-Only cookie semantics.
 *   This ensures localhost and LAN IPs maintain distinct, isolated cookie jars.
 * - Sets `secure` to true ONLY on HTTPS connections, preventing
 *   silent cookie drops by Chromium/WebKit on local HTTP development.
 */
export async function setSessionCookie(token: string): Promise<boolean> {
  try {
    const cookieStore = await cookies();

    let isHttps = false;
    try {
      const headerStore = await headers();
      const proto = headerStore.get("x-forwarded-proto");
      if (proto === "https") {
        isHttps = true;
      }
    } catch {
      // In non-request context (e.g. CLI or test scripts)
      isHttps = false;
    }

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    cookieStore.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: isHttps,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      expires: expiresAt,
    });
    return true;
  } catch (err) {
    // When called outside request context (e.g. test runner), suppress
    console.warn("Session cookie not set (non-request scope):", err instanceof Error ? err.message : err);
    return false;
  }
}

/**
 * Clears the session cookie across the application path.
 */
export async function clearSessionCookie(): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete({
      name: SESSION_COOKIE_NAME,
      path: "/",
    });
  } catch (err) {
    console.warn("Session cookie not cleared (non-request scope):", err instanceof Error ? err.message : err);
  }
}

/**
 * Validates that a callback URL is a safe, internal relative path.
 * Prevents open redirect vulnerabilities.
 */
export function isSafeCallbackUrl(url?: string | null): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  return (
    trimmed.startsWith("/") &&
    !trimmed.startsWith("//") &&
    !trimmed.startsWith("/\\") &&
    !trimmed.includes(":") &&
    !trimmed.includes("\n") &&
    !trimmed.includes("\r")
  );
}

/**
 * Validates that a callback URL is safe for student authentication.
 * Prevents students from being redirected into the admin portal.
 */
export function isSafeStudentCallbackUrl(url?: string | null): boolean {
  if (!isSafeCallbackUrl(url)) return false;
  const trimmed = url!.trim();
  // Reject any administrative destinations
  if (trimmed.startsWith("/admin") || trimmed.startsWith("/api/admin")) {
    return false;
  }
  return true;
}

/**
 * Validates that a callback URL is safe for administrator authentication.
 * Prevents administrators from being redirected into the student portal.
 */
export function isSafeAdminCallbackUrl(url?: string | null): boolean {
  if (!isSafeCallbackUrl(url)) return false;
  const trimmed = url!.trim();
  // Reject student-specific routes
  if (
    trimmed.startsWith("/student") ||
    trimmed.startsWith("/practice") ||
    trimmed.startsWith("/tests")
  ) {
    return false;
  }
  return true;
}

/**
 * Guard: Requires an authenticated student.
 * - Unauthenticated visitors are redirected to /student/login with optional safe callbackUrl.
 * - Authenticated administrators attempting to access student routes are strictly denied access
 *   and redirected to /access-denied.
 */
export async function requireStudent(callbackUrl?: string): Promise<SafeUser> {
  const user = await getCurrentUser();
  if (!user) {
    if (isSafeStudentCallbackUrl(callbackUrl)) {
      redirect(`/student/login?callbackUrl=${encodeURIComponent(callbackUrl!.trim())}`);
    }
    redirect("/student/login");
  }

  // Strict role check: Admin users cannot access student portal functionality
  if (user.role !== "student") {
    redirect("/access-denied?role=student-required");
  }

  if ((user.status || "").toLowerCase() === "suspended") {
    redirect("/student/login?error=" + encodeURIComponent("Your account has been suspended. Please contact support."));
  }

  return user;
}

/**
 * Guard: Requires an authenticated administrator.
 * - Unauthenticated visitors are redirected to /admin/login.
 * - Authenticated students attempting to access admin routes are strictly denied access
 *   and redirected to /access-denied.
 */
export async function requireAdmin(): Promise<SafeUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(getAdminEntryPath());
  }

  // Strict role check: Student users cannot access admin console functionality
  if (user.role !== "admin") {
    redirect("/access-denied?role=admin-required");
  }

  if ((user.status || "").toLowerCase() === "suspended") {
    redirect("/access-denied?error=admin-suspended");
  }

  return user;
}
