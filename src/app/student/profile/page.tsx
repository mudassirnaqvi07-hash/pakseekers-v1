/**
 * Student Profile Page — PakSeekers Phase 4.
 */

import type { Metadata } from "next";
import { Calendar, ShieldCheck, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui";
import { PageHeader } from "@/components/shared";
import { requireStudent } from "@/server/auth/session";
import { StudentProfileForm } from "@/features/student/components/student-profile-form";

export const metadata: Metadata = {
  title: "Student Profile",
  description: "Manage your PakSeekers student profile, education level, and target university exam settings.",
};

export default async function StudentProfilePage() {
  const user = await requireStudent();

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto w-full">
      <PageHeader
        title="Student Profile Settings"
        description="Update your academic credentials, college affiliation, and target entrance examinations."
      />

      {/* Account Summary Banner */}
      <div className="rounded-xl border border-border bg-surface p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary/10 text-primary font-bold text-xl flex items-center justify-center shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary">{user.name}</h2>
            <p className="text-xs text-text-secondary">{user.email}</p>
            <div className="flex items-center gap-3 text-xs text-text-secondary mt-1">
              <span className="flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-primary" />
                {user.profile.targetExam || "MDCAT"}
              </span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-success" />
                Verified Student
              </span>
            </div>
          </div>
        </div>

        <div className="text-xs text-text-secondary sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-border">
          <div className="flex items-center gap-1 text-text-secondary justify-start sm:justify-end">
            <Calendar className="w-3.5 h-3.5" />
            <span>Member since {new Date(user.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Profile Edit Form Card */}
      <Card className="shadow-2xs">
        <CardContent className="p-6 sm:p-8">
          <h3 className="text-base font-bold text-text-primary mb-4 pb-2 border-b border-border">
            Academic Information
          </h3>
          <StudentProfileForm user={user} />
        </CardContent>
      </Card>
    </div>
  );
}
