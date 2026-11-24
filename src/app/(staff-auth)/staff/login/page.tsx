/**
 * Staff Login Page — /staff/login
 *
 * Placed under (staff-auth) route group so it does NOT inherit the
 * protected /staff/layout.tsx guard (prevents redirect loops).
 */

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Card, CardContent, Badge } from "@/components/ui";
import { BrandLogo } from "@/components/shared";
import { getCurrentUser, isSafeStaffCallbackUrl } from "@/server/auth/session";
import { StaffLoginForm } from "@/features/staff/components/staff-login-form";

export const metadata: Metadata = {
  title: "Staff Portal Sign In — PakSeekers",
  description: "Academic staff access portal for PakSeekers curriculum and test management.",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

export default async function StaffLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string; verified?: string }>;
}) {
  const { callbackUrl, error, verified } = await searchParams;
  const user = await getCurrentUser();

  // If already authenticated as active & verified staff, forward to Staff Dashboard or safe callback
  if (
    user &&
    user.role === "staff" &&
    (user.status || "active") !== "suspended" &&
    user.isEmailVerified !== false
  ) {
    if (isSafeStaffCallbackUrl(callbackUrl)) {
      redirect(callbackUrl!.trim());
    }
    redirect("/staff/dashboard");
  }

  // If authenticated as Student or Admin, do NOT redirect to their dashboard;
  // allow reliable account switching right here.
  const activeOtherUser =
    user && user.role !== "staff" ? { email: user.email, role: user.role } : null;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md my-auto py-8">
        <div className="text-center mb-6 flex flex-col items-center">
          <BrandLogo variant="full" size="md" href="/staff/login" className="mb-3" priority />
          <Badge variant="info" className="mb-2 text-[11px] font-bold uppercase tracking-wider">
            Staff Portal
          </Badge>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">
            Academic Staff Sign In
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Curriculum authoring, question bank management, and test curation.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-error/10 border border-error/25 text-error text-xs font-medium">
            {error}
          </div>
        )}

        {activeOtherUser && (
          <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-900 text-xs">
            <span className="font-semibold">Switching Accounts:</span> Currently signed in as{" "}
            <span className="uppercase font-bold">{activeOtherUser.role}</span> ({activeOtherUser.email}).
            Signing in with Staff credentials will replace this session and open the Staff Dashboard.
          </div>
        )}

        <Card className="shadow-sm">
          <CardContent className="p-5 sm:p-8">
            {verified === "true" && (
              <div className="mb-4 p-3 rounded-lg bg-success/10 border border-success/20 text-success text-xs font-semibold flex items-center gap-2">
                <span>✓ Email verified successfully! You can now sign in with your staff credentials.</span>
              </div>
            )}
            <StaffLoginForm callbackUrl={callbackUrl} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
