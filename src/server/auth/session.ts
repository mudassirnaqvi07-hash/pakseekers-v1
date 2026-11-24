/**
 * Session Management & Centralized Route/Permission Authorization — PakSeekers RBAC.
 */

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { getAdminEntryPath } from "@/lib/config/admin-path";
import {
  deleteSession,
  findSessionByToken,
  findUserById,
} from "@/server/repositories/user-repository";
import {
  getEffectivePermissions,
  hasAnyPermission,
  normalizeUserRole,
} from "@/lib/auth/permissions";
import type { ActionResult, Permission, SafeUser, UserRole, UserSession } from "@/types";

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
 * - Verifies live DB record (role, status, permissions).
 * - Automatically invalidates stale sessions if the user's role changed in the DB.
 * - Returns a sanitized SafeUser guaranteed not to expose passwordHash.
 */
export async function getCurrentUser(): Promise<SafeUser | null> {
  try {
    const session = await getCurrentSession();
    if (!session) return null;

    const user = await findUserById(session.userId);
    if (!user) return null;

    const liveRole = normalizeUserRole(user.role);
    const sessionRole = normalizeUserRole(session.role);

    // Role change invalidates stale authorization state immediately
    if (liveRole !== sessionRole) {
      await deleteSession(session.token).catch(() => {});
      return null;
    }

    return {
      ...user,
      role: liveRole,
      permissions: getEffectivePermissions({ role: liveRole, permissions: user.permissions }),
    };
  } catch (err) {
    console.warn("Could not retrieve user from active session:", err instanceof Error ? err.message : err);
    return null;
  }
}

/**
 * Sets the HTTP-only session cookie.
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
 * Prevents students from being redirected into admin or staff portals.
 */
export function isSafeStudentCallbackUrl(url?: string | null): boolean {
  if (!isSafeCallbackUrl(url)) return false;
  const trimmed = url!.trim();
  if (
    trimmed.startsWith("/admin") ||
    trimmed.startsWith("/api/admin") ||
    trimmed.startsWith("/staff") ||
    trimmed.startsWith("/api/staff")
  ) {
    return false;
  }
  return true;
}

/**
 * Validates that a callback URL is safe for staff authentication.
 * Allows /staff/* routes while blocking admin and student portal destinations.
 */
export function isSafeStaffCallbackUrl(url?: string | null): boolean {
  if (!isSafeCallbackUrl(url)) return false;
  const trimmed = url!.trim();
  if (!trimmed.startsWith("/staff") || trimmed === "/staff/login") {
    return false;
  }
  return true;
}

/**
 * Validates that a callback URL is safe for administrator authentication.
 * Prevents administrators from being redirected into student or staff portals.
 */
export function isSafeAdminCallbackUrl(url?: string | null): boolean {
  if (!isSafeCallbackUrl(url)) return false;
  const trimmed = url!.trim();
  if (
    trimmed.startsWith("/student") ||
    trimmed.startsWith("/staff") ||
    trimmed.startsWith("/practice") ||
    trimmed.startsWith("/tests")
  ) {
    return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Portal Page & Layout Guards (Server Components)
// ---------------------------------------------------------------------------

/**
 * Guard: Requires an authenticated, active Student.
 */
export async function requireStudent(callbackUrl?: string): Promise<SafeUser> {
  const user = await getCurrentUser();
  if (!user) {
    if (isSafeStudentCallbackUrl(callbackUrl)) {
      redirect(`/student/login?callbackUrl=${encodeURIComponent(callbackUrl!.trim())}`);
    }
    redirect("/student/login");
  }

  if (user.role !== "student") {
    redirect("/access-denied?role=student-required");
  }

  if ((user.status || "").toLowerCase() === "suspended") {
    redirect(
      "/student/login?error=" +
        encodeURIComponent("Your account has been suspended. Please contact support.")
    );
  }

  return user;
}

/**
 * Guard: Requires an authenticated, active Administrator.
 */
export async function requireAdmin(): Promise<SafeUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(getAdminEntryPath());
  }

  if (user.role !== "admin") {
    redirect("/access-denied?role=admin-required");
  }

  if ((user.status || "").toLowerCase() === "suspended") {
    redirect("/access-denied?error=admin-suspended");
  }

  return user;
}

/**
 * Guard: Requires an authenticated, active Staff member.
 * Optionally enforces one or more required permissions (any-of match).
 * Students and Admins are strictly denied access to Staff-only routes as Staff.
 */
export async function requireStaff(
  requiredPermission?: Permission | Permission[]
): Promise<SafeUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/staff/login");
  }

  if (user.role !== "staff") {
    redirect("/access-denied?role=staff-required");
  }

  if ((user.status || "").toLowerCase() === "suspended") {
    redirect(
      "/staff/login?error=" +
        encodeURIComponent("Your staff account has been deactivated by an administrator.")
    );
  }

  if (user.isEmailVerified === false) {
    redirect(`/verify-email?email=${encodeURIComponent(user.email)}&role=staff`);
  }

  if (requiredPermission) {
    const perms = Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission];
    if (!hasAnyPermission(user, perms)) {
      redirect(`/access-denied?role=permission-required&required=${encodeURIComponent(perms.join(","))}`);
    }
  }

  return user;
}

// ---------------------------------------------------------------------------
// Reusable Server Action & API Route Authorization Helpers
// ---------------------------------------------------------------------------

/**
 * Server Action Guard: Requires an authenticated, active Admin.
 */
export async function verifyAdminAuth(): Promise<
  { user: SafeUser } | { error: ActionResult<never> }
> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      error: {
        success: false,
        error: "Unauthorized: Please sign in with an administrator account.",
      },
    };
  }
  if (user.role !== "admin") {
    return {
      error: {
        success: false,
        error: "Forbidden: Administrator privileges are required to perform this action.",
      },
    };
  }
  if ((user.status || "").toLowerCase() === "suspended") {
    return {
      error: {
        success: false,
        error: "Unauthorized: Your administrator account has been suspended.",
      },
    };
  }
  return { user };
}

/**
 * Server Action Guard: Verifies authentication, active status, allowed role,
 * and granular permission(s) against live DB state.
 * - ADMIN always passes when "admin" is in allowedRoles.
 * - STAFF must hold at least one of `requiredPermissions` (or all if `requireAll: true`).
 */
export async function verifyPermissionAuth(
  requiredPermissions: Permission | Permission[],
  options: {
    allowedRoles?: UserRole[];
    requireAll?: boolean;
  } = {}
): Promise<{ user: SafeUser } | { error: ActionResult<never> }> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      error: {
        success: false,
        error: "Unauthorized: Authentication is required to perform this action.",
      },
    };
  }

  if ((user.status || "").toLowerCase() === "suspended") {
    return {
      error: {
        success: false,
        error:
          user.role === "staff"
            ? "Unauthorized: Your staff account has been deactivated."
            : "Unauthorized: Your account has been suspended.",
      },
    };
  }

  if ((user.role === "student" || user.role === "staff") && user.isEmailVerified === false) {
    return {
      error: {
        success: false,
        error: "Forbidden: Email verification is required before performing this operation.",
      },
    };
  }

  const allowedRoles = options.allowedRoles ?? ["admin", "staff"];
  if (!allowedRoles.includes(user.role)) {
    return {
      error: {
        success: false,
        error: "Forbidden: Your role does not have access to perform this operation.",
      },
    };
  }

  const perms = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
  if (perms.length > 0) {
    const effective = new Set(getEffectivePermissions(user));
    const authorized = options.requireAll
      ? perms.every((p) => effective.has(p))
      : perms.some((p) => effective.has(p));

    if (!authorized) {
      return {
        error: {
          success: false,
          error: `Forbidden: Missing required permission (${perms.join(" or ")}).`,
        },
      };
    }
  }

  return { user };
}

/**
 * API Route Guard: Returns `{ user }` or `{ response: NextResponse }` with proper 401/403 status.
 */
export async function verifyApiAuth(
  options: {
    allowedRoles?: UserRole[];
    requiredPermissions?: Permission | Permission[];
    requireAll?: boolean;
  } = {}
): Promise<{ user: SafeUser } | { response: NextResponse }> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      response: NextResponse.json(
        { error: "Unauthorized: Authentication required." },
        { status: 401 }
      ),
    };
  }

  if ((user.status || "").toLowerCase() === "suspended") {
    return {
      response: NextResponse.json(
        { error: "Forbidden: Account is suspended or deactivated." },
        { status: 403 }
      ),
    };
  }

  if ((user.role === "student" || user.role === "staff") && user.isEmailVerified === false) {
    return {
      response: NextResponse.json(
        { error: "Forbidden: Email verification is required to access this API." },
        { status: 403 }
      ),
    };
  }

  const allowedRoles = options.allowedRoles ?? ["admin"];
  if (!allowedRoles.includes(user.role)) {
    return {
      response: NextResponse.json(
        { error: "Forbidden: Insufficient role privileges." },
        { status: 403 }
      ),
    };
  }

  if (options.requiredPermissions) {
    const perms = Array.isArray(options.requiredPermissions)
      ? options.requiredPermissions
      : [options.requiredPermissions];
    const effective = new Set(getEffectivePermissions(user));
    const authorized = options.requireAll
      ? perms.every((p) => effective.has(p))
      : perms.some((p) => effective.has(p));

    if (!authorized) {
      return {
        response: NextResponse.json(
          { error: `Forbidden: Missing required permission (${perms.join(" or ")}).` },
          { status: 403 }
        ),
      };
    }
  }

  return { user };
}
