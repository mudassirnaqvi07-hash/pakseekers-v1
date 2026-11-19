/**
 * Access Denied Page — /access-denied
 *
 * Rendered when an authenticated user attempts to access a portal
 * outside their assigned role (e.g., student accessing /admin/* or
 * admin accessing /student/*).
 */

import type { Metadata } from "next";
import Link from "next/link";
import { ShieldAlert, ArrowLeft, LogOut, LayoutDashboard } from "lucide-react";
import { Card, CardContent, Button, Badge } from "@/components/ui";
import { BrandLogo } from "@/components/shared";
import { getCurrentUser } from "@/server/auth/session";
import { logoutStudentAction, logoutAdminAction } from "@/server/actions/auth-actions";

export const metadata: Metadata = {
  title: "Access Denied | PakSeekers",
  description: "You do not have permission to access the requested portal.",
};

export const dynamic = "force-dynamic";

export default async function AccessDeniedPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const { role } = await searchParams;
  const user = await getCurrentUser();

  const isStudentAttemptingAdmin =
    user?.role === "student" || role === "admin-required";
  const isAdminAttemptingStudent =
    user?.role === "admin" || role === "student-required";

  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col justify-between p-4 sm:p-6">
      <header className="max-w-5xl mx-auto w-full py-4 flex items-center justify-between">
        <BrandLogo
          variant="horizontal"
          size="sm"
          href={
            user?.role === "admin"
              ? "/admin/dashboard"
              : user?.role === "student"
              ? "/student/dashboard"
              : "/"
          }
          subtitle="Security Boundary"
        />
        <Link
          href="/"
          className="text-xs font-semibold text-text-secondary hover:text-primary transition-colors"
        >
          ← Return to Public Homepage
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center py-10 w-full max-w-lg mx-auto">
        <Card className="w-full shadow-md border-border">
          <CardContent className="p-6 sm:p-8 flex flex-col items-center text-center">
            {/* Warning Shield Icon */}
            <div className="w-16 h-16 rounded-2xl bg-error/10 text-error flex items-center justify-center mb-6 shadow-2xs">
              <ShieldAlert className="w-8 h-8" aria-hidden="true" />
            </div>

            <Badge variant="error" className="mb-3 uppercase tracking-wider text-[10px] font-bold">
              403 Forbidden
            </Badge>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
              Access Denied
            </h1>

            {isStudentAttemptingAdmin ? (
              <>
                <p className="text-sm font-semibold text-text-primary mt-2">
                  Administrator Privileges Required
                </p>
                <p className="text-xs sm:text-sm text-text-secondary mt-2 leading-relaxed">
                  You are currently signed in with a Student account
                  {user?.email ? ` (${user.email})` : ""}. The requested administrative section
                  is restricted to authorized staff only.
                </p>

                <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 w-full">
                  <Link href="/student/dashboard" className="w-full sm:flex-1">
                    <Button
                      variant="primary"
                      size="md"
                      className="w-full justify-center font-bold"
                      leftIcon={<LayoutDashboard className="w-4 h-4 shrink-0" />}
                    >
                      Return to Dashboard
                    </Button>
                  </Link>

                  <form action={logoutStudentAction} className="w-full sm:flex-1">
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
              </>
            ) : isAdminAttemptingStudent ? (
              <>
                <p className="text-sm font-semibold text-text-primary mt-2">
                  Student Portal Boundary
                </p>
                <p className="text-xs sm:text-sm text-text-secondary mt-2 leading-relaxed">
                  You are currently signed in with an Administrator account
                  {user?.email ? ` (${user.email})` : ""}. Student testing, practice attempts,
                  and dashboards are reserved for student accounts.
                </p>

                <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 w-full">
                  <Link href="/admin/dashboard" className="w-full sm:flex-1">
                    <Button
                      variant="primary"
                      size="md"
                      className="w-full justify-center font-bold"
                      leftIcon={<LayoutDashboard className="w-4 h-4 shrink-0" />}
                    >
                      Return to Admin Console
                    </Button>
                  </Link>

                  <form action={logoutAdminAction} className="w-full sm:flex-1">
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
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-text-primary mt-2">
                  Authentication Required
                </p>
                <p className="text-xs sm:text-sm text-text-secondary mt-2 leading-relaxed">
                  You do not have the required permissions to view this resource.
                  Please sign in with an authorized account.
                </p>

                <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 w-full">
                  <Link href="/" className="w-full sm:flex-1">
                    <Button
                      variant="outline"
                      size="md"
                      className="w-full justify-center font-semibold"
                      leftIcon={<ArrowLeft className="w-4 h-4 shrink-0" />}
                    >
                      Homepage
                    </Button>
                  </Link>

                  <Link href="/student/login" className="w-full sm:flex-1">
                    <Button
                      variant="primary"
                      size="md"
                      className="w-full justify-center font-bold"
                    >
                      Student Sign In
                    </Button>
                  </Link>
                </div>
              </>
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