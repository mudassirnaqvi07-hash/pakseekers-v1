"use client";

/**
 * Student Status Toggle / Lifecycle Component — PakSeekers Admin.
 *
 * Wraps StudentAccountActions to maintain backward compatibility with existing usages
 * while providing full account lifecycle controls (suspension, reactivation, deletion).
 */

import { StudentAccountActions } from "./student-account-actions";

export interface StudentStatusToggleProps {
  studentId: string;
  studentName: string;
  studentEmail?: string;
  currentStatus: "active" | "suspended";
  redirectOnDelete?: boolean;
}

export function StudentStatusToggle({
  studentId,
  studentName,
  studentEmail,
  currentStatus,
  redirectOnDelete = false,
}: StudentStatusToggleProps) {
  return (
    <StudentAccountActions
      studentId={studentId}
      studentName={studentName}
      studentEmail={studentEmail}
      currentStatus={currentStatus}
      redirectOnDelete={redirectOnDelete}
    />
  );
}

export { StudentAccountActions };
