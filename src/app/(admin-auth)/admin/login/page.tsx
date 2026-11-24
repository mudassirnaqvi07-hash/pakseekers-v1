/**
 * Admin Login Page — PakSeekers Phase 4.
 */

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui";
import { BrandLogo } from "@/components/shared";
import { getCurrentUser } from "@/server/auth/session";
import { AdminLoginForm } from "@/features/admin/components/admin-login-form";

export const metadata: Metadata = {
  title: "Admin Sign In",
  description: "Administrative access control for PakSeekers content management portal.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLoginPage() {
  const user = await getCurrentUser();
  // If already authenticated as an administrator, forward directly to admin command center
  if (user && user.role === "admin") {
    redirect("/admin/dashboard");
  }

  // NOTE: If currently authenticated as a student in another tab/context, DO NOT auto-redirect to student dashboard.
  // The user explicitly navigated to the admin login portal to authenticate as an administrator.
  const activeStudentEmail = user && user.role === "student" ? user.email : null;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md my-auto py-8">
        <div className="text-center mb-6 flex flex-col items-center">
          <BrandLogo variant="full" size="md" href="/" className="mb-3" priority />
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">
            Admin Portal Sign In
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Authorized personnel only. Content management and test curation.
          </p>
        </div>

        {activeStudentEmail && (
          <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-900 text-xs">
            <span className="font-semibold">Switching Accounts:</span> Currently active student session detected ({activeStudentEmail}). Signing in with administrator credentials will replace this session and open the Admin Dashboard.
          </div>
        )}

        <Card className="shadow-sm">
          <CardContent className="p-5 sm:p-8">
            <AdminLoginForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
