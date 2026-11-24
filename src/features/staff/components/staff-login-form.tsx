"use client";

/**
 * Staff Login Form — PakSeekers Staff Portal.
 *
 * Implements Staff authentication with password visibility toggle,
 * email verification enforcement & OTP resend flow, duplicate submission defense,
 * and full browser navigation to commit the fresh session cookie on login.
 */

import { useState, useTransition } from "react";
import Link from "next/link";
import { AlertCircle, Eye, EyeOff, CheckCircle2, Mail, RefreshCw } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { loginStaffAction, resendVerificationAction } from "@/server/actions/auth-actions";

export function StaffLoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resendPending, startResendTransition] = useTransition();
  const [resendMsg, setResendMsg] = useState<{ text: string; isError?: boolean } | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isPending || successMsg) return;

    setError(null);
    setUnverifiedEmail(null);
    setResendMsg(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const emailVal = ((formData.get("email") as string) || email).trim();
    const passwordVal = (formData.get("password") as string) || password;

    if (!emailVal || !passwordVal) {
      setError("Please enter your staff email and password.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await loginStaffAction({
          email: emailVal,
          password: passwordVal,
          callbackUrl,
        });
        if (!res.success) {
          setError(res.error);
          if (res.isEmailUnverified) {
            setUnverifiedEmail(res.unverifiedEmail || emailVal);
          }
        } else {
          setSuccessMsg("Staff session verified! Launching your workspace...");
          setTimeout(() => {
            window.location.href = res.data.redirectUrl;
          }, 300);
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to sign in right now. Please check your credentials and try again."
        );
      }
    });
  };

  const handleResendVerification = () => {
    if (!unverifiedEmail || resendPending) return;
    setResendMsg(null);
    startResendTransition(async () => {
      try {
        const res = await resendVerificationAction(unverifiedEmail);
        if (res.success) {
          setResendMsg({ text: res.data.message, isError: false });
        } else {
          setResendMsg({
            text: res.error || "Failed to resend verification code.",
            isError: true,
          });
        }
      } catch {
        setResendMsg({
          text: "Unable to send verification code. Please try again shortly.",
          isError: true,
        });
      }
    });
  };

  return (
    <form
      id="staff-login-form"
      method="POST"
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 w-full"
      noValidate
    >
      {error && !unverifiedEmail && (
        <div
          role="alert"
          aria-live="polite"
          className="p-3 rounded-md bg-error/10 border border-error/20 text-error text-xs flex items-start gap-2.5 animate-in fade-in"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {unverifiedEmail && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-900 text-xs flex flex-col gap-2.5 animate-in fade-in"
        >
          <div className="flex items-start gap-2.5">
            <Mail className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-900">Email Verification Required</p>
              <p className="text-amber-800/90 mt-0.5">
                Your staff account ({unverifiedEmail}) has not been verified yet. Please enter the 6-digit verification code sent to your email.
              </p>
            </div>
          </div>

          {resendMsg && (
            <div
              className={`p-2 rounded text-xs font-medium ${
                resendMsg.isError
                  ? "bg-error/15 text-error"
                  : "bg-success/15 text-success"
              }`}
            >
              {resendMsg.text}
            </div>
          )}

          <div className="pt-1 flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResendVerification}
              isLoading={resendPending}
              className="text-amber-900 border-amber-300 hover:bg-amber-100/50 text-xs"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Resend Code
            </Button>
            <Link
              href={`/verify-email?email=${encodeURIComponent(unverifiedEmail)}&role=staff`}
              className="text-xs text-primary hover:underline font-semibold"
            >
              Enter Verification Code &rarr;
            </Link>
          </div>
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
          id="staff-login-email"
          name="email"
          type="email"
          label="Staff Email Address"
          required
          autoComplete="email"
          placeholder="staff@pakseekers.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isPending || Boolean(successMsg)}
        />
      </div>

      <div>
        <div className="relative">
          <Input
            id="staff-login-password"
            name="password"
            type={showPassword ? "text" : "password"}
            label="Password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isPending || Boolean(successMsg)}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-[32px] text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full mt-2 font-bold"
        isLoading={isPending || Boolean(successMsg)}
      >
        {successMsg
          ? "Redirecting..."
          : isPending
          ? "Verifying Staff Session..."
          : "Sign In to Staff Portal"}
      </Button>

      <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-text-secondary">
        <span>Are you a student?</span>
        <Link href="/student/login" className="text-primary font-semibold hover:underline">
          Student Portal Login →
        </Link>
      </div>
    </form>
  );
}
