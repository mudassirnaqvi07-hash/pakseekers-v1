/**
 * Session Management & Route Protection Utilities — PakSeekers Phase 4.
 */

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  findSessionByToken,
  findUserById,
} from "@/server/repositories/user-repository";
import type { User, UserSession } from "@/types";

export const SESSION_COOKIE_NAME = "pakseekers_session";

/**
 * Retrieves the active session from HTTP-only cookie.
 */
export async function getCurrentSession(): Promise<UserSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    return findSessionByToken(token);
  } catch {
    return null;
  }
}

/**
 * Retrieves the currently authenticated user from the active session.
 */
export async function getCurrentUser(): Promise<User | null> {
  const session = await getCurrentSession();
  if (!session) return null;

  return findUserById(session.userId);
}

/**
 * Sets the HTTP-only session cookie.
 */
export async function setSessionCookie(token: string): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    });
  } catch (err) {
    // When called outside request context (e.g. test runner), suppress
    console.warn("Session cookie not set (non-request scope):", err instanceof Error ? err.message : err);
  }
}

/**
 * Clears the session cookie.
 */
export async function clearSessionCookie(): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
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
 * Guard: Requires an authenticated student.
 * If not authenticated, or the authenticated user is not a student,
 * redirects to /student/login with optional safe callbackUrl.
 */
export async function requireStudent(callbackUrl?: string): Promise<User> {
  const user = await getCurrentUser();
  if (!user || user.role !== "student") {
    if (isSafeCallbackUrl(callbackUrl)) {
      redirect(`/student/login?callbackUrl=${encodeURIComponent(callbackUrl!.trim())}`);
    }
    redirect("/student/login");
  }
  return user;
}

/**
 * Guard: Requires an authenticated administrator.
 * If not authenticated or not admin, redirects to /admin/login.
 */
export async function requireAdmin(): Promise<User> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    redirect("/admin/login");
  }
  return user;
}
