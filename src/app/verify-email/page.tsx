"use client";

import { useEffect, useState, useTransition, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  AlertTriangle,
  Mail,
  ArrowRight,
  Loader2,
  RefreshCw,
  GraduationCap,
} from "lucide-react";
import { Button, Input } from "@/components/ui";
import {
  verifyEmailTokenAction,
  resendVerificationAction,
} from "@/server/actions/auth-actions";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const initialStatus = searchParams.get("status");
  const initialReason = searchParams.get("reason");

  const [status, setStatus] = useState<"loading" | "success" | "error" | "idle">(
    initialStatus === "success"
      ? "success"
      : initialStatus === "error"
      ? "error"
      : token
      ? "loading"
      : "idle"
  );
  const [errorMessage, setErrorMessage] = useState<string>(
    initialReason === "expired"
      ? "This verification link has expired (links are valid for 30 minutes). Please request a new one below."
      : initialStatus === "error"
      ? "This verification link is invalid or has already been used."
      : ""
  );

  const [resendEmail, setResendEmail] = useState("");
  const [resendPending, startResendTransition] = useTransition();
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);

  // If a token was provided in the query parameters, verify it automatically
  useEffect(() => {
    if (!token || initialStatus) return;

    let isMounted = true;
    async function verify() {
      try {
        const res = await verifyEmailTokenAction(token!);
        if (!isMounted) return;

        if (res.success) {
          setStatus("success");
        } else {
          setStatus("error");
          setErrorMessage(res.error || "This verification link is invalid or has expired.");
        }
      } catch {
        if (!isMounted) return;
        setStatus("error");
        setErrorMessage("Unable to verify link right now. Please try again.");
      }
    }

    verify();

    return () => {
      isMounted = false;
    };
  }, [token, initialStatus]);

  const handleResend = (e: React.FormEvent) => {
    e.preventDefault();
    setResendError(null);
    setResendSuccess(null);

    const trimmed = resendEmail.trim();
    if (!trimmed || !trimmed.includes("@")) {
      setResendError("Please enter a valid email address.");
      return;
    }

    startResendTransition(async () => {
      try {
        const res = await resendVerificationAction(trimmed);
        if (res.success) {
          setResendSuccess(res.data.message);
        } else {
          setResendError(res.error || "Failed to send verification link.");
        }
      } catch {
        setResendError("An unexpected error occurred. Please try again.");
      }
    });
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 bg-surface">
      <div className="max-w-md w-full bg-background rounded-2xl border border-border shadow-xs p-8 text-center animate-in fade-in zoom-in-95 duration-200">
        
        {/* Brand Header */}
        <div className="flex items-center justify-center gap-2 mb-6 text-primary">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-primary" />
          </div>
          <span className="text-xl font-bold tracking-tight text-text-primary">PakSeekers</span>
        </div>

        {/* 1. Loading State */}
        {status === "loading" && (
          <div className="py-8 flex flex-col items-center">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <h2 className="text-xl font-bold text-text-primary">Verifying your email...</h2>
            <p className="text-sm text-text-secondary mt-2">
              Validating your verification token with PakSeekers security.
            </p>
          </div>
        )}

        {/* 2. Success State */}
        {status === "success" && (
          <div className="py-4 flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-success/10 text-success flex items-center justify-center mb-4">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-extrabold text-text-primary tracking-tight">
              Email Verified Successfully!
            </h2>
            <p className="text-sm text-text-secondary mt-3 leading-relaxed">
              Your student account is now active and ready. You can log in to access your dashboard, take practice tests, and track your entrance exam preparation.
            </p>
            <div className="mt-8 w-full">
              <Link href="/student/login">
                <Button size="lg" className="w-full font-bold">
                  Continue to Student Login
                  <ArrowRight className="w-4 h-4 ml-1.5 inline" />
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* 3. Error State */}
        {status === "error" && (
          <div className="py-2 flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-error/10 text-error flex items-center justify-center mb-4">
              <AlertTriangle className="w-10 h-10" />
            </div>
            <h2 className="text-xl font-bold text-text-primary tracking-tight">
              Verification Failed
            </h2>
            <p className="text-sm text-text-secondary mt-2 leading-relaxed">
              {errorMessage || "This verification link is invalid or has expired."}
            </p>

            {/* Resend Box */}
            <div className="mt-6 pt-6 border-t border-border w-full text-left">
              <h3 className="text-sm font-semibold text-text-primary mb-1">
                Need a new verification link?
              </h3>
              <p className="text-xs text-text-secondary mb-3">
                Enter your registered email address below and we will send you a fresh link.
              </p>

              <form onSubmit={handleResend} className="space-y-3">
                <Input
                  type="email"
                  placeholder="name@example.com"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  disabled={resendPending}
                  required
                />

                {resendError && (
                  <p className="text-xs text-error font-medium">{resendError}</p>
                )}

                {resendSuccess && (
                  <p className="text-xs text-success font-medium">{resendSuccess}</p>
                )}

                <Button
                  type="submit"
                  variant="secondary"
                  size="md"
                  className="w-full font-semibold"
                  isLoading={resendPending}
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                  Resend Verification Email
                </Button>
              </form>
            </div>

            <div className="mt-6 text-xs text-text-secondary">
              Already verified?{" "}
              <Link href="/student/login" className="text-primary font-semibold hover:underline">
                Sign in here
              </Link>
            </div>
          </div>
        )}

        {/* 4. Idle / Direct Visit State */}
        {status === "idle" && (
          <div className="py-2 flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
              <Mail className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-text-primary tracking-tight">
              Email Verification
            </h2>
            <p className="text-sm text-text-secondary mt-2 leading-relaxed">
              Enter your registered student email address to request or resend your account verification link.
            </p>

            <form onSubmit={handleResend} className="mt-6 space-y-3 w-full text-left">
              <Input
                type="email"
                placeholder="name@example.com"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                disabled={resendPending}
                required
              />

              {resendError && (
                <p className="text-xs text-error font-medium">{resendError}</p>
              )}

              {resendSuccess && (
                <p className="text-xs text-success font-medium">{resendSuccess}</p>
              )}

              <Button
                type="submit"
                size="md"
                className="w-full font-semibold"
                isLoading={resendPending}
              >
                <Mail className="w-4 h-4 mr-1.5" />
                Send Verification Link
              </Button>
            </form>

            <div className="mt-6 text-xs text-text-secondary">
              Back to{" "}
              <Link href="/student/login" className="text-primary font-semibold hover:underline">
                Student Sign In
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[80vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
