/**
 * Access Denied Page — /access-denied
 *
 * Rendered when an authenticated user attempts to access a portal or action
 * outside their assigned role or permission set (ADMIN, STAFF, STUDENT).
 */

import type { Metadata } from "next";
import Link from "next/link";
import { ShieldAlert, ArrowLeft, LogOut, LayoutDashboard } from "lucide-react";
import { Card, CardContent, Button, Badge } from "@/components/ui";
import { BrandLogo } from "@/components/shared";
import { getCurrentUser } from "@/server/auth/session";
import { getDashboardRouteForRole } from "@/lib/auth/permissions";
import {
  logoutStudentAction,
  logoutStaffAction,
  logoutAdminAction,
} from "@/server/actions/auth-actions";

export const metadata: Metadata = {
  title: "Access Denied | PakSeekers",
  description: "You do not have permission to access the requested portal or module.",
};

export const dynamic = "force-dynamic";

export default async function AccessDeniedPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; required?: string }>;
}) {
  const { role, required } = await searchParams;
  const user = await getCurrentUser();

  const homeDashboard = user ? getDashboardRouteForRole(user.role) : "/student/login";
  const logoutAction =
    user?.role === "admin"
      ? logoutAdminAction
      : user?.role === "staff"
      ? logoutStaffAction
      : logoutStudentAction;

  const isPermissionDenied = role === "permission-required";

  let headline = "Access Boundary Enforced";
  let description =
    "You do not have the required permissions to view this resource. Please sign in with an authorized account.";

  if (isPermissionDenied && user) {
    headline = "Insufficient Module Permissions";
    description = `Your ${user.role.toUpperCase()} account (${user.email}) does not currently have the required permission${
      required ? ` (${required})` : ""
    } to access this module. Contact an Administrator if you need access.`;
  } else if (user) {
    if (role === "admin-required") {
      headline = "Administrator Privileges Required";
      description = `You are signed in as ${user.role.toUpperCase()} (${user.email}). The requested Administration Console route is strictly restricted to Administrator accounts.`;
    } else if (role === "staff-required") {
      headline = "Staff Portal Boundary";
      description = `You are signed in as ${user.role.toUpperCase()} (${user.email}). Staff Portal workspace routes are reserved exclusively for Staff accounts.`;
    } else if (role === "student-required") {
      headline = "Student Portal Boundary";
      description = `You are signed in as ${user.role.toUpperCase()} (${user.email}). Student practice tests, attempts, and dashboards are reserved exclusively for Student accounts.`;
    }
  }

  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col justify-between p-4 sm:p-6">
      <header className="max-w-5xl mx-auto w-full py-4 flex items-center justify-between">
        <BrandLogo
          variant="horizontal"
          size="sm"
          href={homeDashboard}
          subtitle="Security Boundary"
        />
        <Link
          href="/explore"
          className="text-xs font-semibold text-text-secondary hover:text-primary transition-colors"
        >
          ← Browse Exam Catalog
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center py-10 w-full max-w-lg mx-auto">
        <Card className="w-full shadow-md border-border">
          <CardContent className="p-6 sm:p-8 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-error/10 text-error flex items-center justify-center mb-6 shadow-2xs">
              <ShieldAlert className="w-8 h-8" aria-hidden="true" />
            </div>

            <Badge variant="error" className="mb-3 uppercase tracking-wider text-[10px] font-bold">
              403 Forbidden
            </Badge>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
              Access Denied
            </h1>

            <p className="text-sm font-semibold text-text-primary mt-2">{headline}</p>
            <p className="text-xs sm:text-sm text-text-secondary mt-2 leading-relaxed">
              {description}
            </p>

            {user ? (
              <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 w-full">
                <Link href={homeDashboard} className="w-full sm:flex-1">
                  <Button
                    variant="primary"
                    size="md"
                    className="w-full justify-center font-bold"
                    leftIcon={<LayoutDashboard className="w-4 h-4 shrink-0" />}
                  >
                    Return to My Dashboard
                  </Button>
                </Link>

                <form action={logoutAction} className="w-full sm:flex-1">
                  <Button
                    variant="outline"
                    size="md"
                    type="submit"
                    className="w-full justify-center text-text-secondary hover:text-error hover:border-error/40 font-semibold"
                    leftIcon={<LogOut className="w-4 h-4 shrink-0" />}
                  >
                    Switch Account
                  </Button>
                </form>
              </div>
            ) : (
              <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 w-full">
                <Link href="/explore" className="w-full sm:flex-1">
                  <Button
                    variant="outline"
                    size="md"
                    className="w-full justify-center font-semibold"
                    leftIcon={<ArrowLeft className="w-4 h-4 shrink-0" />}
                  >
                    Browse Catalog
                  </Button>
                </Link>

                <Link href="/student/login" className="w-full sm:flex-1">
                  <Button variant="primary" size="md" className="w-full justify-center font-bold">
                    Student Sign In
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <footer className="max-w-5xl mx-auto w-full py-4 text-center text-xs text-text-secondary">
        <p>© {new Date().getFullYear()} PakSeekers. Role-Based Access Control Enforced.</p>
      </footer>
    </div>
  );
}
