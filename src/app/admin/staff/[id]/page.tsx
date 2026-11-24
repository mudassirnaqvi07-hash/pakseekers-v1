import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, Calendar, Briefcase } from "lucide-react";
import { requireAdmin } from "@/server/auth/session";
import { getStaffById } from "@/server/services/user-service";
import { Button, Badge } from "@/components/ui";
import { StaffEditForm } from "@/features/admin/components/staff-edit-form";

export const metadata: Metadata = {
  title: "Manage Staff Account — PakSeekers Admin",
};

interface AdminStaffDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminStaffDetailPage({ params }: AdminStaffDetailPageProps) {
  await requireAdmin();
  const { id } = await params;

  const staff = await getStaffById(id);
  if (!staff) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between gap-4">
        <Link href="/admin/staff">
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Staff Roster
          </Button>
        </Link>
      </div>

      {/* Header Profile Summary */}
      <div className="rounded-xl border border-border bg-surface p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-bold text-lg flex items-center justify-center shrink-0">
            {staff.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-extrabold text-text-primary">{staff.name}</h1>
              <Badge variant="info" className="text-[10px] uppercase font-bold">
                STAFF
              </Badge>
              {staff.isEmailVerified === false ? (
                <Badge variant="warning" dot className="text-[11px]">
                  Pending Verification
                </Badge>
              ) : (
                <Badge variant="success" dot className="text-[11px]">
                  Email Verified
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-secondary mt-1">
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" />
                {staff.email}
              </span>
              <span className="flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5" />
                {staff.staffTitle || "Academic Coordinator"} • {staff.department || "Curriculum"}
              </span>
            </div>
          </div>
        </div>

        <div className="text-xs text-text-secondary flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          <span>Joined {new Date(staff.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      <StaffEditForm staff={staff} />
    </div>
  );
}
