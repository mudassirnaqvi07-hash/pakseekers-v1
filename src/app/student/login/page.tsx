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
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  const user = await getCurrentUser();

  if (user) {
    if (user.role === "student") {
      if (isSafeStudentCallbackUrl(callbackUrl)) {
        redirect(callbackUrl!.trim());
      }
      redirect("/student/dashboard");
    } else if (user.role === "admin") {
      redirect("/admin/dashboard");
    }
  }

  return (
    <div className="w-full max-w-md my-auto py-8">
      <div className="text-center mb-6 flex flex-col items-center">
        <BrandLogo variant="full" size="md" href="/" className="mb-3" priority />
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">
          Student Portal Sign In
        </h1>
        <p className="text-xs text-text-secondary mt-1">
          {callbackUrl
            ? "Sign in to your student account to access your requested practice test"
            : "Access your personalized test dashboard and attempt history"}
        </p>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-6">
          <StudentLoginForm callbackUrl={callbackUrl} />
        </CardContent>
      </Card>
    </div>
  );
}
