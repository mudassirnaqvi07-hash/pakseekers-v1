"use client";

/**
 * Student Registration Form — PakSeekers Phase 4.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserPlus, AlertCircle } from "lucide-react";
import { Button, Input, Select } from "@/components/ui";
import { registerStudentAction } from "@/server/actions/auth-actions";

export function StudentRegisterForm({
  callbackUrl,
}: {
  callbackUrl?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    educationLevel: "FSc Pre-Medical",
    institution: "",
    targetExam: "MDCAT",
    phone: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const form = e.currentTarget;
    const data = new FormData(form);

    const name = ((data.get("name") as string) || formData.name).trim();
    const email = ((data.get("email") as string) || formData.email).trim();
    const password = (data.get("password") as string) || formData.password;
    const confirmPassword =
      (data.get("confirmPassword") as string) || formData.confirmPassword;
    const educationLevel =
      (data.get("educationLevel") as string) || formData.educationLevel;
    const targetExam =
      (data.get("targetExam") as string) || formData.targetExam;
    const institution =
      ((data.get("institution") as string) || formData.institution).trim() ||
      "Not specified";
    const phone = ((data.get("phone") as string) || formData.phone).trim();

    if (!name || !email || !password || !confirmPassword) {
      setError("Please fill in all required fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    startTransition(async () => {
      const res = await registerStudentAction({
        name,
        email,
        password,
        confirmPassword,
        educationLevel,
        institution,
        targetExam,
        phone: phone || undefined,
        callbackUrl,
      });

      if (!res.success) {
        setError(res.error);
      } else {
        router.push(res.data.redirectUrl);
        router.refresh();
      }
    });
  };

  return (
    <form
      id="student-register-form"
      method="POST"
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 w-full"
      noValidate
    >
      {error && (
        <div
          role="alert"
          className="p-3 rounded-md bg-error/10 border border-error/20 text-error text-xs flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <Input
          id="student-register-name"
          type="text"
          name="name"
          label="Full Name"
          required
          autoComplete="name"
          placeholder="e.g. Fatima Zahra"
          value={formData.name}
          onChange={handleChange}
          disabled={isPending}
        />
      </div>

      <div>
        <Input
          id="student-register-email"
          type="email"
          name="email"
          label="Email Address"
          required
          autoComplete="email"
          placeholder="student@example.com"
          value={formData.email}
          onChange={handleChange}
          disabled={isPending}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Input
            id="student-register-password"
            type="password"
            name="password"
            label="Password (min 6 characters)"
            required
            autoComplete="new-password"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            disabled={isPending}
          />
        </div>

        <div>
          <Input
            id="student-register-confirm-password"
            type="password"
            name="confirmPassword"
            label="Confirm Password"
            required
            autoComplete="new-password"
            placeholder="••••••••"
            value={formData.confirmPassword}
            onChange={handleChange}
            disabled={isPending}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Select
            id="student-register-education"
            name="educationLevel"
            label="Education Level"
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
          <Select
            id="student-register-target-exam"
            name="targetExam"
            label="Target Entry Exam"
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
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Input
            id="student-register-institution"
            type="text"
            name="institution"
            label="College / Institution (Optional)"
            placeholder="e.g. Punjab College, Lahore"
            value={formData.institution}
            onChange={handleChange}
            disabled={isPending}
          />
        </div>

        <div>
          <Input
            id="student-register-phone"
            type="tel"
            name="phone"
            label="Mobile Number (Optional)"
            autoComplete="tel"
            placeholder="+92 300 0000000"
            value={formData.phone}
            onChange={handleChange}
            disabled={isPending}
          />
        </div>
      </div>

      <Button
        id="student-register-submit"
        type="submit"
        size="md"
        className="w-full mt-2"
        disabled={isPending}
      >
        <UserPlus className="w-4 h-4 mr-2" />
        {isPending ? "Creating Account..." : "Create Free Student Account"}
      </Button>

      <div className="text-center text-xs text-text-secondary mt-2">
        Already registered?{" "}
        <Link
          href={
            callbackUrl
              ? `/student/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
              : "/student/login"
          }
          className="font-semibold text-primary hover:underline"
        >
          Sign in to your account
        </Link>
      </div>
    </form>
  );
}
