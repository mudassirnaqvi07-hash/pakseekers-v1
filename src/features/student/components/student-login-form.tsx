"use client";

/**
 * Student Login Form — PakSeekers Phase 4.
 *
 * Implements accessible authentication form with password visibility toggle,
 * immediate validation feedback, duplicate submission defense, and success states.
 */

import { useState, useTransition } from "react";
import Link from "next/link";
import { AlertCircle, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { loginStudentAction } from "@/server/actions/auth-actions";

export function StudentLoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isPending || successMsg) return; // Prevent duplicate submissions

    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const emailVal = ((formData.get("email") as string) || email).trim();
    const passwordVal = (formData.get("password") as string) || password;

    if (!emailVal || !passwordVal) {
      setError("Please provide both your registered email address and password.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await loginStudentAction({
          email: emailVal,
          password: passwordVal,
          callbackUrl,
        });
        if (!res.success) {
          setError(res.error);
        } else {
          setSuccessMsg("Authentication verified! Launching your student portal...");
          // Authoritative navigation via window.location.href ensures the fresh session cookie
          // is committed and sent in headers across all origins (localhost and LAN IPs)
          setTimeout(() => {
            window.location.href = res.data.redirectUrl;
          }, 350);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to sign in. Please check your credentials and try again.");
      }
    });
  };

  const handleFillDemo = () => {
    setEmail("student@pakseekers.com");
    setPassword("student123");
    setError(null);
  };

  return (
    <form
      id="student-login-form"
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
          id="student-login-email"
          name="email"
          type="email"
          label="Email Address"
          required
          autoComplete="email"
          placeholder="student@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isPending || Boolean(successMsg)}
        />
      </div>

      <div>
        <Input
          id="student-login-password"
          name="password"
          type={showPassword ? "text" : "password"}
          label="Password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isPending || Boolean(successMsg)}
          rightElement={
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password text" : "Show password text"}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 text-text-secondary hover:text-text-primary focus:outline-none focus:ring-1 focus:ring-primary rounded transition-colors cursor-pointer"
              tabIndex={0}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          }
        />
      </div>

      <Button
        id="student-login-submit"
        type="submit"
        size="md"
        className="w-full mt-2 font-semibold"
        isLoading={isPending}
        disabled={isPending || Boolean(successMsg)}
      >
        {isPending ? "Signing in..." : "Sign In to Student Portal"}
      </Button>

      {/* Demo Credentials Helper */}
      <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-text-secondary">
        <span>Demo: student@pakseekers.com</span>
        <button
          type="button"
          onClick={handleFillDemo}
          aria-label="Auto fill demo credentials"
          className="text-primary font-semibold hover:underline cursor-pointer"
        >
          Auto-fill
        </button>
      </div>

      <div className="text-center text-xs text-text-secondary mt-2">
        Don&apos;t have an account yet?{" "}
        <Link
          href={
            callbackUrl
              ? `/student/register?callbackUrl=${encodeURIComponent(callbackUrl)}`
              : "/student/register"
          }
          className="font-semibold text-primary hover:underline"
        >
          Create Student Account
        </Link>
      </div>
    </form>
  );
}
