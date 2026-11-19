"use client";

/**
 * Student Edit Form — PakSeekers Admin.
 *
 * Allows administrators to update student profile fields (e.g. correct misspelled name,
 * update target exam, city, or education level).
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Button, Input, Select } from "@/components/ui";
import type { SafeUser } from "@/types";
import { updateStudentProfileByAdminAction } from "@/server/actions/admin-actions";

interface StudentEditFormProps {
  student: SafeUser;
}

export function StudentEditForm({ student }: StudentEditFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await updateStudentProfileByAdminAction(student.id, formData);
      if (!result.success) {
        setError(result.error);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.refresh();
      }, 600);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <div className="p-3 rounded-md bg-error/10 border border-error/20 flex items-center gap-2 text-xs text-error">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 rounded-md bg-success/10 border border-success/20 flex items-center gap-2 text-xs text-success">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Student profile updated successfully!</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Input
            name="name"
            label="Full Name"
            defaultValue={student.name}
            required
          />
        </div>

        <div>
          <Input
            name="email"
            label="Email Address (Login Identifier)"
            defaultValue={student.email}
            disabled
            className="opacity-70 bg-background cursor-not-allowed"
          />
        </div>

        <div>
          <Input
            name="phone"
            label="Phone Number"
            placeholder="03001234567"
            defaultValue={student.phone || ""}
          />
        </div>

        <div>
          <Select
            name="targetExam"
            label="Target Entrance Exam"
            defaultValue={student.targetExam || "MDCAT"}
          >
            <option value="MDCAT">MDCAT (Medical & Dental)</option>
            <option value="ECAT">ECAT (Engineering UET)</option>
            <option value="NET">NUST NET</option>
            <option value="FAST">FAST-NU Admission Test</option>
            <option value="GIKI">GIKI Engineering Test</option>
            <option value="PIEAS">PIEAS Entrance Test</option>
          </Select>
        </div>

        <div>
          <Select
            name="educationLevel"
            label="Current Education Level"
            defaultValue={student.educationLevel || "FSc Pre-Medical"}
          >
            <option value="FSc Pre-Medical">FSc Pre-Medical</option>
            <option value="FSc Pre-Engineering">FSc Pre-Engineering</option>
            <option value="ICS">ICS (Computer Science)</option>
            <option value="A-Levels">A-Levels</option>
            <option value="Repeater / Gap Year">Repeater / Gap Year</option>
          </Select>
        </div>

        <div>
          <Input
            name="city"
            label="City"
            placeholder="e.g. Lahore, Karachi, Islamabad"
            defaultValue={student.city || ""}
          />
        </div>
      </div>

      <div className="flex justify-end pt-3">
        <Button
          type="submit"
          variant="primary"
          size="sm"
          isLoading={isPending}
          className="px-6 font-semibold"
        >
          Save Profile Changes
        </Button>
      </div>
    </form>
  );
}
