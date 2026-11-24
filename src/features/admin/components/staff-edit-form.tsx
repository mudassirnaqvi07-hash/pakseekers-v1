"use client";

/**
 * StaffEditForm — PakSeekers Admin.
 *
 * Allows Admins to edit Staff details, modify/revoke permissions in real-time,
 * activate/deactivate Staff (revoking active sessions), and permanently delete Staff.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Save, ShieldCheck, Trash2, Power, Mail, RefreshCw } from "lucide-react";
import type { Permission, SafeUser } from "@/types";
import { getEffectivePermissions } from "@/lib/auth/permissions";
import {
  updateStaffDetailsAction,
  updateStaffPermissionsAction,
  updateStaffStatusAction,
  deleteStaffAccountAction,
  resendStaffVerificationByAdminAction,
} from "@/server/actions/staff-actions";
import { Button, Input, Card, CardContent, Badge } from "@/components/ui";
import { StaffPermissionsEditor } from "./staff-permissions-editor";

interface StaffEditFormProps {
  staff: SafeUser;
}

export function StaffEditForm({ staff }: StaffEditFormProps) {
  const router = useRouter();
  const [isDetailsPending, startDetailsTransition] = useTransition();
  const [isPermsPending, startPermsTransition] = useTransition();
  const [isLifecyclePending, startLifecycleTransition] = useTransition();

  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  // Profile fields
  const [name, setName] = useState(staff.name);
  const [email, setEmail] = useState(staff.email);
  const [staffTitle, setStaffTitle] = useState(staff.staffTitle || "Academic Coordinator");
  const [department, setDepartment] = useState(staff.department || "Content & Curriculum");
  const [newPassword, setNewPassword] = useState("");

  // Permissions state
  const [permissions, setPermissions] = useState<Permission[]>(() =>
    getEffectivePermissions(staff)
  );
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isSuspended = (staff.status || "active") === "suspended";
  const isEmailPending = staff.isEmailVerified === false;

  const handleResendVerification = () => {
    setFeedback(null);
    startLifecycleTransition(async () => {
      const res = await resendStaffVerificationByAdminAction(staff.id);
      if (!res.success) {
        setFeedback({ type: "error", text: res.error });
        return;
      }
      setFeedback({ type: "success", text: res.data.message });
    });
  };

  const handleSaveDetails = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    startDetailsTransition(async () => {
      const res = await updateStaffDetailsAction(staff.id, {
        name,
        email,
        staffTitle,
        department,
        password: newPassword || undefined,
      });

      if (!res.success) {
        setFeedback({ type: "error", text: res.error });
        return;
      }

      setNewPassword("");
      setFeedback({ type: "success", text: res.message || "Staff details updated." });
      router.refresh();
    });
  };

  const handleSavePermissions = () => {
    setFeedback(null);

    startPermsTransition(async () => {
      const res = await updateStaffPermissionsAction(staff.id, permissions);
      if (!res.success) {
        setFeedback({ type: "error", text: res.error });
        return;
      }

      setFeedback({
        type: "success",
        text: res.message || "Permissions saved and applied immediately.",
      });
      router.refresh();
    });
  };

  const handleToggleStatus = () => {
    setFeedback(null);
    const nextStatus = isSuspended ? "active" : "suspended";

    startLifecycleTransition(async () => {
      const res = await updateStaffStatusAction(staff.id, nextStatus);
      if (!res.success) {
        setFeedback({ type: "error", text: res.error });
        return;
      }

      setFeedback({
        type: "success",
        text: res.message || `Staff account ${nextStatus === "active" ? "activated" : "deactivated"}.`,
      });
      router.refresh();
    });
  };

  const handleDelete = () => {
    setFeedback(null);

    startLifecycleTransition(async () => {
      const res = await deleteStaffAccountAction(staff.id);
      if (!res.success) {
        setFeedback({ type: "error", text: res.error });
        setConfirmDelete(false);
        return;
      }

      router.push("/admin/staff");
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {feedback && (
        <div
          role={feedback.type === "error" ? "alert" : "status"}
          className={`p-3.5 rounded-lg border text-xs flex items-start gap-2.5 ${
            feedback.type === "error"
              ? "bg-error/10 border-error/25 text-error"
              : "bg-success/10 border-success/25 text-success font-medium"
          }`}
        >
          {feedback.type === "error" ? (
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Email Verification Status Card (Separate from Lifecycle Status) */}
      <Card>
        <CardContent className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-text-primary">Email Verification</h3>
                {isEmailPending ? (
                  <Badge variant="warning" dot className="text-xs">
                    Pending Verification
                  </Badge>
                ) : (
                  <Badge variant="success" dot className="text-xs">
                    Verified
                  </Badge>
                )}
              </div>
              <p className="text-xs text-text-secondary mt-1">
                {isEmailPending
                  ? `Staff member must confirm the 6-digit verification code sent to ${staff.email} before logging into the Staff Portal.`
                  : "Email address verified via 6-digit verification code."}
              </p>
            </div>
          </div>

          {isEmailPending && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              isLoading={isLifecyclePending}
              onClick={handleResendVerification}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              className="shrink-0"
            >
              Resend Verification Code
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Lifecycle & Status Controls */}
      <Card>
        <CardContent className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-text-primary">Account Lifecycle</h3>
              <Badge variant={isSuspended ? "error" : "success"} dot className="capitalize text-xs">
                {isSuspended ? "Deactivated" : "Active"}
              </Badge>
            </div>
            <p className="text-xs text-text-secondary mt-1">
              {isSuspended
                ? "This Staff account is deactivated. All active sessions are revoked and portal login is blocked."
                : "This Staff account is active and can access permitted Staff Portal modules."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Button
              type="button"
              size="sm"
              variant={isSuspended ? "primary" : "outline"}
              isLoading={isLifecyclePending}
              onClick={handleToggleStatus}
              leftIcon={<Power className="w-3.5 h-3.5" />}
            >
              {isSuspended ? "Activate Staff" : "Deactivate Staff"}
            </Button>

            {confirmDelete ? (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="danger"
                  isLoading={isLifecyclePending}
                  onClick={handleDelete}
                >
                  Confirm Delete
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={isLifecyclePending}
                  onClick={() => setConfirmDelete(false)}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setConfirmDelete(true)}
                className="text-error border-error/30 hover:bg-error/10"
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              >
                Delete Account
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Profile Details */}
      <Card>
        <CardContent className="p-5 sm:p-6">
          <form onSubmit={handleSaveDetails} className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-text-primary">Staff Details</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isDetailsPending}
              />
              <Input
                label="Email Address"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isDetailsPending}
              />
              <Input
                label="Staff Title"
                value={staffTitle}
                onChange={(e) => setStaffTitle(e.target.value)}
                disabled={isDetailsPending}
              />
              <Input
                label="Department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                disabled={isDetailsPending}
              />
              <Input
                label="Reset Password (Optional)"
                type="password"
                placeholder="Leave blank to keep current password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isDetailsPending}
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                size="sm"
                variant="primary"
                isLoading={isDetailsPending}
                leftIcon={<Save className="w-4 h-4" />}
              >
                Save Details
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Permission Management */}
      <Card>
        <CardContent className="p-5 sm:p-6 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <span>Assigned Permissions</span>
              </h3>
              <p className="text-xs text-text-secondary mt-0.5">
                Changes take effect immediately across all active sessions and server actions.
              </p>
            </div>

            <Button
              type="button"
              size="sm"
              variant="primary"
              isLoading={isPermsPending}
              onClick={handleSavePermissions}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Save Permissions
            </Button>
          </div>

          <StaffPermissionsEditor
            selectedPermissions={permissions}
            onChange={setPermissions}
            disabled={isPermsPending}
          />

          <div className="flex justify-end pt-2 border-t border-border">
            <Button
              type="button"
              size="md"
              variant="primary"
              isLoading={isPermsPending}
              onClick={handleSavePermissions}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Apply Permission Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
