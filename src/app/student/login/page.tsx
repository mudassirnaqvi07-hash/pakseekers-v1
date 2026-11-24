/**
 * Student Login Page — PakSeekers Phase 4.
 */

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui";
import { BrandLogo } from "@/components/shared";
import { getCurrentUser, isSafeStudentCallbackUrl } from "@/server/auth/session";
import { StudentLoginForm } from "@/features/student/components/student-login-form";

export const metadata: Metadata = {
  title: "Student Sign In",
  description: "Sign in to your PakSeekers student account to access your practice tests and progress.",
};

export default async function StudentLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; verified?: string; error?: string }>;
}) {
  const { callbackUrl, verified, error } = await searchParams;
  const user = await getCurrentUser();

  // If already authenticated as a student, forward directly to student dashboard
  if (user && user.role === "student" && (user.status || "active") !== "suspended") {
    if (isSafeStudentCallbackUrl(callbackUrl)) {
      redirect(callbackUrl!.trim());
    }
    redirect("/student/dashboard");
  }

  // NOTE: If currently authenticated as admin or staff in another tab/context, DO NOT auto-redirect.
  // The user explicitly navigated to the student sign-in portal to authenticate with a student account.
  const activeOtherSession =
    user && user.role !== "student" ? { email: user.email, role: user.role } : null;

  return (
    <div className="w-full max-w-md my-auto py-8">
      <div className="text-center mb-6 flex flex-col items-center">
        <BrandLogo variant="full" size="md" href="/student/login" className="mb-3" priority />
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">
          Student Portal Sign In
        </h1>
        <p className="text-xs text-text-secondary mt-1">
          {callbackUrl
            ? "Sign in to your student account to access your requested practice test"
            : "Access your personalized test dashboard and attempt history"}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-error/10 border border-error/25 text-error text-xs font-medium">
          {error}
        </div>
      )}

      {activeOtherSession && (
        <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-900 text-xs">
          <span className="font-semibold">Switching Accounts:</span> Currently active{" "}
          <span className="uppercase font-bold">{activeOtherSession.role}</span> session detected (
          {activeOtherSession.email}). Signing in with student credentials will replace this session and open the Student Dashboard.
        </div>
      )}

      <Card className="shadow-sm">
        <CardContent className="p-6">
          {verified === "true" && (
            <div className="mb-4 p-3 rounded-lg bg-success/10 border border-success/20 text-success text-xs font-semibold flex items-center gap-2">
              <span>✓ Email verified successfully! You can now sign in with your credentials.</span>
            </div>
          )}
          <StudentLoginForm callbackUrl={callbackUrl} />
        </CardContent>
      </Card>
    </div>
  );
}
