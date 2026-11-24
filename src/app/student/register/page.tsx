/**
 * Student Registration Page — PakSeekers Phase 4.
 */

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui";
import { BrandLogo } from "@/components/shared";
import { getCurrentUser, isSafeStudentCallbackUrl } from "@/server/auth/session";
import { StudentRegisterForm } from "@/features/student/components/student-register-form";

export const metadata: Metadata = {
  title: "Create Student Account",
  description: "Create your free PakSeekers student account to start practicing for Pakistani university entrance exams.",
};

export default async function StudentRegisterPage({
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
    } else if (user.role === "staff") {
      redirect("/staff/dashboard");
    } else if (user.role === "admin") {
      redirect("/admin/dashboard");
    }
  }

  return (
    <div className="w-full max-w-lg my-auto py-8">
      <div className="text-center mb-6 flex flex-col items-center">
        <BrandLogo variant="full" size="md" href="/" className="mb-3" priority />
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">
          Create Free Student Account
        </h1>
        <p className="text-xs text-text-secondary mt-1">
          {callbackUrl
            ? "Create an account to start practicing and record your test results"
            : "Set up your profile to track your scores, attempts, and curriculum progress"}
        </p>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-6 sm:p-8">
          <StudentRegisterForm callbackUrl={callbackUrl} />
        </CardContent>
      </Card>
    </div>
  );
}
