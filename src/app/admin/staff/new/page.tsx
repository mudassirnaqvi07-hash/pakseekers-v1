import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/server/auth/session";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui";
import { StaffCreateForm } from "@/features/admin/components/staff-create-form";

export const metadata: Metadata = {
  title: "Create Staff Account — PakSeekers Admin",
  description: "Provision a new Staff account with customized module permissions.",
};

export default async function AdminCreateStaffPage() {
  await requireAdmin();

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between gap-4">
        <PageHeader
          title="Create Staff Account"
          description="Provision a new academic Staff member and configure their exact module permissions."
        />
        <Link href="/admin/staff" className="shrink-0">
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Staff List
          </Button>
        </Link>
      </div>

      <StaffCreateForm />
    </div>
  );
}
