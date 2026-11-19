"use client";

/**
 * Student Status Toggle Button — PakSeekers Admin.
 *
 * Allows administrators to suspend or reactivate student accounts.
 * Suspending an account immediately terminates all active student sessions.
 */

import { useState, useTransition } from "react";
import { UserCheck, UserX } from "lucide-react";
import { Button } from "@/components/ui";
import { updateStudentStatusAction } from "@/server/actions/admin-actions";

interface StudentStatusToggleProps {
  studentId: string;
  studentName: string;
  currentStatus: "active" | "suspended";
}

export function StudentStatusToggle({
  studentId,
  studentName,
  currentStatus,
}: StudentStatusToggleProps) {
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);
  const isSuspended = currentStatus === "suspended";
  const targetStatus = isSuspended ? "active" : "suspended";

  async function handleToggle() {
    startTransition(async () => {
      await updateStudentStatusAction(studentId, targetStatus);
      setShowConfirm(false);
    });
  }

  if (showConfirm) {
    return (
      <div className="inline-flex items-center gap-1.5 p-1 rounded-md bg-background border border-border">
        <span className="text-xs text-text-secondary px-1">
          {isSuspended ? `Reactivate ${studentName.slice(0, 15)}?` : `Suspend ${studentName.slice(0, 15)}?`}
        </span>
        <Button
          size="sm"
          variant={isSuspended ? "secondary" : "danger"}
          isLoading={isPending}
          onClick={handleToggle}
          className="h-7 text-xs px-2"
        >
          Confirm
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={isPending}
          onClick={() => setShowConfirm(false)}
          className="h-7 text-xs px-2 text-text-secondary"
        >
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <Button
      size="sm"
      variant={isSuspended ? "secondary" : "outline"}
      className="h-8 text-xs px-2.5"
      leftIcon={
        isSuspended ? (
          <UserCheck className="w-3.5 h-3.5 shrink-0" />
        ) : (
          <UserX className="w-3.5 h-3.5 shrink-0 text-error" />
        )
      }
      onClick={() => setShowConfirm(true)}
    >
      {isSuspended ? "Reactivate Account" : "Suspend Account"}
    </Button>
  );
}
