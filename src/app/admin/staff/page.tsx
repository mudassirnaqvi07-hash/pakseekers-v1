import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, UserPlus, Search, Edit, Users } from "lucide-react";
import { requireAdmin } from "@/server/auth/session";
import { getStaffList } from "@/server/services/user-service";
import { getEffectivePermissions, STAFF_ASSIGNABLE_PERMISSIONS } from "@/lib/auth/permissions";
import { PageHeader } from "@/components/shared/page-header";
import { Button, Badge, Card, CardContent } from "@/components/ui";
import { StaffStatusToggle } from "@/features/admin/components/staff-status-toggle";

export const metadata: Metadata = {
  title: "Staff & Permissions — PakSeekers Admin",
  description: "Create staff accounts, configure granular RBAC permissions, and manage staff lifecycle.",
};

interface AdminStaffPageProps {
  searchParams: Promise<{
    search?: string;
    status?: "active" | "suspended" | "all";
  }>;
}

export default async function AdminStaffPage({ searchParams }: AdminStaffPageProps) {
  await requireAdmin();
  const { search, status } = await searchParams;

  const normalizedStatus = status === "active" || status === "suspended" ? status : undefined;
  const staffMembers = await getStaffList({
    search: search || "",
    status: normalizedStatus,
  });

  const activeCount = staffMembers.filter((s) => (s.status || "active") === "active").length;
  const suspendedCount = staffMembers.filter((s) => s.status === "suspended").length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Staff & Role Management"
        description="Create academic staff accounts, configure module permissions, and control portal access."
        actions={
          <Link href="/admin/staff/new">
            <Button variant="primary" size="sm" leftIcon={<UserPlus className="w-4 h-4" />}>
              Create Staff Account
            </Button>
          </Link>
        }
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-text-secondary">Total Staff Accounts</p>
              <p className="text-2xl font-extrabold text-text-primary mt-1">{staffMembers.length}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-text-secondary">Active Staff</p>
              <p className="text-2xl font-extrabold text-emerald-700 mt-1">{activeCount}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-700 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-text-secondary">Deactivated</p>
              <p className="text-2xl font-extrabold text-text-primary mt-1">{suspendedCount}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-700 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <form method="GET" className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              name="search"
              placeholder="Search staff by name, email, title, or department..."
              defaultValue={search || ""}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              name="status"
              defaultValue={status || "all"}
              className="px-3 py-2 text-xs rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary w-full sm:w-auto"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Staff</option>
              <option value="suspended">Deactivated Staff</option>
            </select>

            <Button size="sm" variant="primary" type="submit" className="h-9 px-4 text-xs font-semibold">
              Filter
            </Button>
          </div>
        </form>
      </Card>

      {/* Staff List Table */}
      {staffMembers.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent className="flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-text-primary">No Staff Accounts Found</h3>
            <p className="text-xs text-text-secondary max-w-md">
              Create your first Staff account to delegate curriculum authoring, question bank curation, and draft test management without exposing Admin governance settings.
            </p>
            <Link href="/admin/staff/new" className="mt-2">
              <Button size="sm" variant="primary" leftIcon={<UserPlus className="w-4 h-4" />}>
                Create Staff Account
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-surface border border-border rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse min-w-[720px]">
              <thead className="bg-background border-b border-border text-xs font-semibold text-text-secondary uppercase tracking-wider">
                <tr>
                  <th className="px-4 sm:px-6 py-3">Staff Member</th>
                  <th className="px-4 sm:px-6 py-3">Designation</th>
                  <th className="px-4 sm:px-6 py-3">Email Verification</th>
                  <th className="px-4 sm:px-6 py-3">Permissions</th>
                  <th className="px-4 sm:px-6 py-3">Account Status</th>
                  <th className="px-4 sm:px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {staffMembers.map((member) => {
                  const effective = getEffectivePermissions(member);
                  const canPublish = effective.includes("TEST_PUBLISH");
                  const isVerified = member.isEmailVerified !== false;
                  return (
                    <tr key={member.id} className="hover:bg-background/60 transition-colors">
                      <td className="px-4 sm:px-6 py-4">
                        <div className="font-semibold text-text-primary">{member.name}</div>
                        <div className="text-xs text-text-secondary">{member.email}</div>
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <div className="text-xs font-medium text-text-primary">
                          {member.staffTitle || "Academic Coordinator"}
                        </div>
                        <div className="text-[11px] text-text-secondary">
                          {member.department || "Content & Curriculum"}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        {isVerified ? (
                          <Badge variant="success" dot className="text-xs">
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="warning" dot className="text-xs">
                            Pending Verification
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge variant="info" className="text-[11px]">
                            {effective.length}/{STAFF_ASSIGNABLE_PERMISSIONS.length} active
                          </Badge>
                          {canPublish && (
                            <Badge variant="success" className="text-[10px]">
                              Can Publish Tests
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <StaffStatusToggle
                          staffId={member.id}
                          currentStatus={(member.status as "active" | "suspended") || "active"}
                        />
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-right">
                        <Link href={`/admin/staff/${member.id}`}>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-8"
                            leftIcon={<Edit className="w-3.5 h-3.5" />}
                          >
                            Manage & Permissions
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
