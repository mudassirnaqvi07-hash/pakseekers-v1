"use client";

/**
 * StaffCreateForm — PakSeekers Admin.
 *
 * Allows Admins to create new Staff accounts with configured granular permissions
 * (pre-populated with DEFAULT_STAFF_PERMISSIONS).
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Eye, EyeOff, UserPlus, ArrowLeft } from "lucide-react";
import type { Permission } from "@/types";
import { DEFAULT_STAFF_PERMISSIONS } from "@/lib/auth/permissions";
import { createStaffAccountAction } from "@/server/actions/staff-actions";
import { Button, Input, Card, CardContent } from "@/components/ui";
import { StaffPermissionsEditor } from "./staff-permissions-editor";

export function StaffCreateForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [staffTitle, setStaffTitle] = useState("Academic Coordinator");
  const [department, setDepartment] = useState("Content & Curriculum");
  const [permissions, setPermissions] = useState<Permission[]>([...DEFAULT_STAFF_PERMISSIONS]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isPending || successMsg) return;

    setError(null);

    startTransition(async () => {
      const res = await createStaffAccountAction({
        name,
        email,
        password,
        staffTitle,
        department,
        permissions,
      });

      if (!res.success) {
        setError(res.error);
        return;
      }

      setSuccessMsg(
        res.message ||
          `Staff account created for ${res.data.staff.email}. Redirecting...`
      );
      setTimeout(() => {
        router.push(`/admin/staff/${res.data.staff.id}`);
        router.refresh();
      }, 900);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {error && (
        <div
          role="alert"
          className="p-3.5 rounded-lg bg-error/10 border border-error/25 text-error text-xs flex items-start gap-2.5"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div
          role="status"
          className="p-3.5 rounded-lg bg-success/10 border border-success/25 text-success text-xs flex items-center gap-2.5 font-medium"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Account Details Card */}
      <Card>
        <CardContent className="p-5 sm:p-6 flex flex-col gap-4">
          <h3 className="text-base font-bold text-text-primary">Staff Account Information</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              required
              placeholder="e.g. Ayesha Khan"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isPending}
            />
            <Input
              label="Staff Email Address"
              type="email"
              required
              placeholder="e.g. ayesha.staff@pakseekers.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isPending}
            />
            <div className="relative">
              <Input
                label="Initial Password"
                type={showPassword ? "text" : "password"}
                required
                placeholder="Min 8 chars, letters & numbers"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isPending}
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-3 top-[32px] text-text-secondary hover:text-text-primary cursor-pointer"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <Input
              label="Staff Title / Designation"
              placeholder="e.g. Subject Specialist"
              value={staffTitle}
              onChange={(e) => setStaffTitle(e.target.value)}
              disabled={isPending}
            />
            <Input
              label="Department"
              placeholder="e.g. Biology & MDCAT"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              disabled={isPending}
            />
          </div>
        </CardContent>
      </Card>

      {/* Grouped Permission Assignment */}
      <Card>
        <CardContent className="p-5 sm:p-6 flex flex-col gap-4">
          <div>
            <h3 className="text-base font-bold text-text-primary">Assign Module Permissions</h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Default Staff permissions are pre-selected (Curriculum, Question Bank, Imports, Draft Tests, Analytics). Publish/Delete Tests and Student Management are disabled by default.
            </p>
          </div>

          <StaffPermissionsEditor
            selectedPermissions={permissions}
            onChange={setPermissions}
            disabled={isPending}
          />
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-2">
        <Link href="/admin/staff" className="w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Cancel
          </Button>
        </Link>
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full sm:w-auto px-8 font-bold"
          isLoading={isPending}
          leftIcon={<UserPlus className="w-4 h-4" />}
        >
          Create Staff Account
        </Button>
      </div>
    </form>
  );
}
