"use client";

/**
 * Student Profile Form — PakSeekers Phase 4.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, CheckCircle2, AlertCircle } from "lucide-react";
import { Button, Input, Select } from "@/components/ui";
import { updateStudentProfileAction } from "@/server/actions/auth-actions";
import type { User as UserType } from "@/types";

interface StudentProfileFormProps {
  user: UserType;
}

export function StudentProfileForm({ user }: StudentProfileFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: user.name,
    educationLevel: user.profile.educationLevel || "FSc Pre-Medical",
    institution: user.profile.institution || "",
    targetExam: user.profile.targetExam || "MDCAT",
    phone: user.profile.phone || "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const res = await updateStudentProfileAction(formData);
      if (!res.success) {
        setError(res.error);
      } else {
        setSuccess("Your student profile has been updated successfully.");
        router.refresh();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full">
      {error && (
        <div className="p-3 rounded-md bg-error/10 border border-error/20 text-error text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 rounded-md bg-success/10 border border-success/20 text-success text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label className="block text-xs font-semibold text-text-primary mb-1">
            Full Name
          </label>
          <Input
            type="text"
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            disabled={isPending}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-primary mb-1">
            Email Address
          </label>
          <Input
            type="email"
            disabled
            value={user.email}
            className="bg-surface-hover cursor-not-allowed opacity-80"
          />
          <span className="text-[11px] text-text-secondary mt-1 block">
            Email address cannot be changed.
          </span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-primary mb-1">
            Education Level
          </label>
          <Select
            name="educationLevel"
            value={formData.educationLevel}
            onChange={handleChange}
            disabled={isPending}
          >
            <option value="FSc Pre-Medical">FSc Pre-Medical</option>
            <option value="FSc Pre-Engineering">FSc Pre-Engineering</option>
            <option value="ICS (Computer Science)">ICS (Computer Science)</option>
            <option value="A-Levels">A-Levels</option>
            <option value="Matric / O-Levels">Matric / O-Levels</option>
            <option value="Undergraduate">Undergraduate</option>
            <option value="Other">Other</option>
          </Select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-primary mb-1">
            Target Entry Exam
          </label>
          <Select
            name="targetExam"
            value={formData.targetExam}
            onChange={handleChange}
            disabled={isPending}
          >
            <option value="MDCAT">MDCAT (Medical & Dental)</option>
            <option value="FAST-NU">FAST-NU Entry Test</option>
            <option value="NUST NET">NUST NET</option>
            <option value="ECAT">ECAT (Engineering)</option>
            <option value="NTS">NTS / NAT</option>
            <option value="GIKI">GIKI Entry Test</option>
            <option value="Other">Other University Test</option>
          </Select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-primary mb-1">
            College / Institution
          </label>
          <Input
            type="text"
            name="institution"
            required
            placeholder="e.g. Punjab Group of Colleges"
            value={formData.institution}
            onChange={handleChange}
            disabled={isPending}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-primary mb-1">
            Contact Number (Optional)
          </label>
          <Input
            type="tel"
            name="phone"
            placeholder="+92 300 0000000"
            value={formData.phone}
            onChange={handleChange}
            disabled={isPending}
          />
        </div>
      </div>

      <div className="pt-4 border-t border-border flex justify-end">
        <Button type="submit" size="md" disabled={isPending}>
          <Save className="w-4 h-4 mr-2" />
          {isPending ? "Saving..." : "Save Profile Changes"}
        </Button>
      </div>
    </form>
  );
}
