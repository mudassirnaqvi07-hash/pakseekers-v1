"use client";

/**
 * Student Account Lifecycle Management Actions — PakSeekers Admin.
 *
 * Provides full account lifecycle controls:
 *   - Suspension with active session termination
 *   - Reactivation with access restoration
 *   - Permanent deletion with complete data removal and email release
 *
 * Requirements:
 *   - Dedicated confirmation dialogs for suspension and reactivation
 *   - Strict explicit confirmation checkbox safeguard for permanent deletion
 *   - Clear communication of irreversibility
 *   - Loading states and disabled states to prevent double submissions
 *   - Success feedback and live list refresh
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  UserX,
  UserCheck,
  Trash2,
  AlertTriangle,
  X,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui";
import {
  updateStudentStatusAction,
  deleteStudentAccountAction,
} from "@/server/actions/admin-actions";

interface StudentAccountActionsProps {
  studentId: string;
  studentName: string;
  studentEmail?: string;
  currentStatus: "active" | "suspended";
  redirectOnDelete?: boolean;
}

export function StudentAccountActions({
  studentId,
  studentName,
  studentEmail,
  currentStatus,
  redirectOnDelete = false,
}: StudentAccountActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeDialog, setActiveDialog] = useState<"suspend" | "reactivate" | "delete" | null>(null);
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const isSuspended = currentStatus === "suspended";

  function closeDialog() {
    if (isPending) return;
    setActiveDialog(null);
    setDeleteConfirmed(false);
    setDialogError(null);
  }

  function handleStatusChange(targetStatus: "active" | "suspended") {
    setDialogError(null);
    startTransition(async () => {
      const res = await updateStudentStatusAction(studentId, targetStatus);
      if (res.success) {
        closeDialog();
        const actionLabel = targetStatus === "suspended" ? "suspended" : "reactivated";
        setFeedback({
          type: "success",
          message: `Account for ${studentName} was successfully ${actionLabel}.`,
        });
        setTimeout(() => setFeedback(null), 4000);
        router.refresh();
      } else {
        setDialogError(res.error || "Failed to update account status. Please try again.");
      }
    });
  }

  function handleDeleteAccount() {
    if (!deleteConfirmed) return;
    setDialogError(null);
    startTransition(async () => {
      const res = await deleteStudentAccountAction(studentId);
      if (res.success) {
        closeDialog();
        setFeedback({
          type: "success",
          message: `Account for ${studentName} has been permanently deleted.`,
        });
        if (redirectOnDelete) {
          router.push("/admin/students");
        } else {
          router.refresh();
        }
      } else {
        setDialogError(res.error || "Failed to delete account. Please try again.");
      }
    });
  }

  return (
    <div className="relative inline-flex items-center gap-1.5">
      {/* Inline Feedback Toast */}
      {feedback && (
        <div
          className={`absolute bottom-full right-0 mb-2 z-30 whitespace-nowrap px-3 py-1.5 rounded-md shadow-md text-xs flex items-center gap-1.5 font-medium animate-in fade-in slide-in-from-bottom-1 ${
            feedback.type === "success"
              ? "bg-success/15 border border-success/30 text-success"
              : "bg-error/15 border border-error/30 text-error"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Primary Status Action: Suspend or Reactivate */}
      {isSuspended ? (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="h-8 text-xs px-2.5 font-medium"
          leftIcon={<UserCheck className="w-3.5 h-3.5 shrink-0 text-success" />}
          onClick={() => {
            setDialogError(null);
            setActiveDialog("reactivate");
          }}
        >
          Reactivate
        </Button>
      ) : (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 text-xs px-2.5 font-medium hover:border-amber-500/50 hover:text-amber-600"
          leftIcon={<UserX className="w-3.5 h-3.5 shrink-0 text-amber-600" />}
          onClick={() => {
            setDialogError(null);
            setActiveDialog("suspend");
          }}
        >
          Suspend
        </Button>
      )}

      {/* Permanent Delete Trigger */}
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="h-8 text-xs px-2 text-text-secondary hover:text-error hover:bg-error/10 font-medium"
        leftIcon={<Trash2 className="w-3.5 h-3.5 shrink-0" />}
        onClick={() => {
          setDeleteConfirmed(false);
          setDialogError(null);
          setActiveDialog("delete");
        }}
        title="Permanently Delete Account"
      >
        Delete
      </Button>

      {/* Modal Dialog Backdrop */}
      {activeDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isPending) closeDialog();
          }}
        >
          <div
            className="bg-surface border border-border rounded-xl shadow-2xl max-w-md w-full p-6 flex flex-col gap-5 animate-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialog-title"
          >
            {/* ----------------------------------------------------------- */}
            {/* 1. SUSPENSION DIALOG                                       */}
            {/* ----------------------------------------------------------- */}
            {activeDialog === "suspend" && (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                      <UserX className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 id="dialog-title" className="text-base font-bold text-text-primary leading-tight">
                        Suspend Student Account?
                      </h3>
                      <p className="text-xs text-text-secondary mt-0.5 truncate max-w-xs">
                        {studentName} {studentEmail ? `(${studentEmail})` : ""}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={closeDialog}
                    className="text-text-secondary hover:text-text-primary p-1 rounded-md transition-colors disabled:opacity-50"
                    aria-label="Close dialog"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="rounded-lg bg-surface-hover border border-border p-3.5 flex flex-col gap-2 text-xs leading-relaxed text-text-secondary">
                  <p className="text-text-primary font-semibold">What happens during suspension:</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>The student will be blocked from logging into the platform.</li>
                    <li>All existing active student sessions will be terminated immediately.</li>
                    <li>Direct access to student dashboards, practice canvas, and APIs will be blocked.</li>
                    <li>
                      <strong className="text-text-primary font-semibold">Academic records are preserved:</strong> All past test attempts, results, and statistics remain safely stored.
                    </li>
                  </ul>
                </div>

                {dialogError && (
                  <div className="text-xs text-error font-medium p-3 rounded-md bg-error/10 border border-error/20 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{dialogError}</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isPending}
                    onClick={closeDialog}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    isLoading={isPending}
                    onClick={() => handleStatusChange("suspended")}
                  >
                    Confirm Suspension
                  </Button>
                </div>
              </>
            )}

            {/* ----------------------------------------------------------- */}
            {/* 2. REACTIVATION DIALOG                                     */}
            {/* ----------------------------------------------------------- */}
            {activeDialog === "reactivate" && (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 id="dialog-title" className="text-base font-bold text-text-primary leading-tight">
                        Reactivate Student Account?
                      </h3>
                      <p className="text-xs text-text-secondary mt-0.5 truncate max-w-xs">
                        {studentName} {studentEmail ? `(${studentEmail})` : ""}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={closeDialog}
                    className="text-text-secondary hover:text-text-primary p-1 rounded-md transition-colors disabled:opacity-50"
                    aria-label="Close dialog"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="rounded-lg bg-surface-hover border border-border p-3.5 flex flex-col gap-2 text-xs leading-relaxed text-text-secondary">
                  <p className="text-text-primary font-semibold">What happens upon reactivation:</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>The account status returns to <strong className="text-success font-semibold">ACTIVE</strong>.</li>
                    <li>The student can log in normally with their existing credentials.</li>
                    <li>Full access to examination preparations, diagnostic tests, and dashboard is restored.</li>
                    <li>All past attempts and progress history remain completely functional.</li>
                  </ul>
                </div>

                {dialogError && (
                  <div className="text-xs text-error font-medium p-3 rounded-md bg-error/10 border border-error/20 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{dialogError}</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isPending}
                    onClick={closeDialog}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    isLoading={isPending}
                    onClick={() => handleStatusChange("active")}
                  >
                    Confirm Reactivation
                  </Button>
                </div>
              </>
            )}

            {/* ----------------------------------------------------------- */}
            {/* 3. PERMANENT DELETION DIALOG                               */}
            {/* ----------------------------------------------------------- */}
            {activeDialog === "delete" && (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-error/10 text-error flex items-center justify-center shrink-0">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 id="dialog-title" className="text-base font-bold text-text-primary leading-tight">
                        Permanently Delete Student Account
                      </h3>
                      <p className="text-xs text-text-secondary mt-0.5 truncate max-w-xs">
                        {studentName} {studentEmail ? `(${studentEmail})` : ""}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={closeDialog}
                    className="text-text-secondary hover:text-text-primary p-1 rounded-md transition-colors disabled:opacity-50"
                    aria-label="Close dialog"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="rounded-lg bg-error/10 border border-error/20 p-3.5 flex flex-col gap-2 text-xs text-text-secondary">
                  <div className="flex items-center gap-2 text-error font-bold">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>This action is permanent and cannot be undone.</span>
                  </div>
                  <ul className="list-disc pl-4 space-y-1 mt-1 text-[11px] leading-relaxed">
                    <li>The user document and personal profile will be deleted permanently.</li>
                    <li>All active sessions and authentication tokens will be invalidated.</li>
                    <li>All examination track enrollments and historical test attempts will be erased.</li>
                    <li>
                      <span className="text-text-primary font-medium">Email address release:</span> The email{" "}
                      <strong className="text-text-primary font-semibold">{studentEmail || "address"}</strong> will be completely released and can be used to register a new account.
                    </li>
                  </ul>
                </div>

                {/* Explicit confirmation checkbox */}
                <label className="flex items-start gap-2.5 p-3 rounded-lg bg-surface-hover border border-border cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={deleteConfirmed}
                    disabled={isPending}
                    onChange={(e) => setDeleteConfirmed(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-border text-error focus:ring-error"
                  />
                  <span className="text-xs font-semibold text-text-primary leading-tight">
                    I understand that this permanent deletion is irreversible, and all student records will be permanently removed.
                  </span>
                </label>

                {dialogError && (
                  <div className="text-xs text-error font-medium p-3 rounded-md bg-error/10 border border-error/20 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{dialogError}</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isPending}
                    onClick={closeDialog}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    disabled={!deleteConfirmed || isPending}
                    isLoading={isPending}
                    onClick={handleDeleteAccount}
                  >
                    Permanently Delete Account
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
