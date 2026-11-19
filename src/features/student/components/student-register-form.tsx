"use client";

/**
 * Student Registration Form — PakSeekers Phase 4.
 *
 * Implements accessible student registration with password visibility toggles,
 * real-time requirement feedback, duplicate submission defense, and success redirection.
 */

import { useState, useTransition } from "react";
import Link from "next/link";
import { AlertCircle, Eye, EyeOff, CheckCircle2, Check, X } from "lucide-react";
import { Button, Input, Select } from "@/components/ui";
import { registerStudentAction } from "@/server/actions/auth-actions";

export function StudentRegisterForm({
  callbackUrl,
}: {
  callbackUrl?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  const hasMinLength = formData.password.length >= 8;
  const hasLetter = /[A-Za-z]/.test(formData.password);
  const hasNumber = /\d/.test(formData.password);
  const passwordsMatch = formData.confirmPassword.length > 0 && formData.password === formData.confirmPassword;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isPending || successMsg) return; // Prevent duplicate submissions

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

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (!/^(?=.*[A-Za-z])(?=.*\d)/.test(password)) {
      setError("Password must contain at least one letter and one number.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please ensure both fields are identical.");
      return;
    }

    startTransition(async () => {
      try {
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
          setSuccessMsg("Account created successfully! Preparing your student dashboard...");
          setTimeout(() => {
            window.location.href = res.data.redirectUrl;
          }, 350);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to create account. Please check your details and try again.");
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
          aria-live="polite"
          className="p-3 rounded-md bg-error/10 border border-error/20 text-error text-xs flex items-start gap-2.5 animate-in fade-in"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div
          role="status"
          aria-live="polite"
          className="p-3 rounded-md bg-success/10 border border-success/20 text-success text-xs flex items-center gap-2.5 animate-in fade-in"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="font-medium">{successMsg}</span>
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
          disabled={isPending || Boolean(successMsg)}
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
          disabled={isPending || Boolean(successMsg)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Input
            id="student-register-password"
            type={showPassword ? "text" : "password"}
            name="password"
            label="Password"
            required
            autoComplete="new-password"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            disabled={isPending || Boolean(successMsg)}
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password text" : "Show password text"}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 text-text-secondary hover:text-text-primary focus:outline-none focus:ring-1 focus:ring-primary rounded transition-colors cursor-pointer"
                tabIndex={0}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />
        </div>

        <div>
          <Input
            id="student-register-confirm-password"
            type={showConfirmPassword ? "text" : "password"}
            name="confirmPassword"
            label="Confirm Password"
            required
            autoComplete="new-password"
            placeholder="••••••••"
            value={formData.confirmPassword}
            onChange={handleChange}
            disabled={isPending || Boolean(successMsg)}
            rightElement={
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                aria-label={showConfirmPassword ? "Hide confirmation password text" : "Show confirmation password text"}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 text-text-secondary hover:text-text-primary focus:outline-none focus:ring-1 focus:ring-primary rounded transition-colors cursor-pointer"
                tabIndex={0}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />
        </div>
      </div>

      {/* Password requirements indicators */}
      {formData.password.length > 0 && (
        <div className="p-2.5 rounded-lg bg-surface border border-border text-xs flex flex-wrap gap-x-4 gap-y-1 text-text-secondary">
          <span className={`flex items-center gap-1 ${hasMinLength ? "text-success font-medium" : ""}`}>
            {hasMinLength ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5 opacity-40" />}
            At least 8 characters
          </span>
          <span className={`flex items-center gap-1 ${hasLetter && hasNumber ? "text-success font-medium" : ""}`}>
            {hasLetter && hasNumber ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5 opacity-40" />}
            Letters & numbers
          </span>
          {formData.confirmPassword.length > 0 && (
            <span className={`flex items-center gap-1 ${passwordsMatch ? "text-success font-medium" : "text-error"}`}>
              {passwordsMatch ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
              {passwordsMatch ? "Passwords match" : "Passwords do not match"}
            </span>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Select
            id="student-register-education"
            name="educationLevel"
            label="Education Level"
            value={formData.educationLevel}
            onChange={handleChange}
            disabled={isPending || Boolean(successMsg)}
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
            disabled={isPending || Boolean(successMsg)}
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
            disabled={isPending || Boolean(successMsg)}
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
            disabled={isPending || Boolean(successMsg)}
          />
        </div>
      </div>

      <Button
        id="student-register-submit"
        type="submit"
        size="md"
        className="w-full mt-2 font-semibold"
        isLoading={isPending}
        disabled={isPending || Boolean(successMsg)}
      >
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
