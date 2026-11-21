"use client";

import { useEffect, useState, useRef, useTransition, Suspense } from "react";
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
  Edit2,
  ShieldCheck,
} from "lucide-react";
import { Button, Input } from "@/components/ui";
import { verifyOtpAction, resendOtpAction } from "@/server/actions/auth-actions";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") || "";
  const isNewlyRegistered = searchParams.get("registered") === "true";

  const [email, setEmail] = useState(emailParam);
  const [isEditingEmail, setIsEditingEmail] = useState(!emailParam);
  const [prevEmailParam, setPrevEmailParam] = useState(emailParam);

  if (emailParam !== prevEmailParam) {
    setPrevEmailParam(emailParam);
    setEmail(emailParam);
    setIsEditingEmail(!emailParam);
  }

  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [verifyPending, startVerifyTransition] = useTransition();
  const [resendPending, startResendTransition] = useTransition();

  const [isVerified, setIsVerified] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState<number>(isNewlyRegistered ? 60 : 0);

  // 60-second cooldown timer decrementer
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  // Handle single digit input
  const handleDigitChange = (index: number, value: string) => {
    // Only accept numeric digit
    const cleaned = value.replace(/\D/g, "");
    if (!cleaned) {
      const newDigits = [...otpDigits];
      newDigits[index] = "";
      setOtpDigits(newDigits);
      return;
    }

    const digit = cleaned.slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    setOtpDigits(newDigits);
    setErrorMessage(null);

    // Auto-advance focus to next box
    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace, arrow keys, and keyboard navigation
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (otpDigits[index] === "" && index > 0) {
        // Move back and clear previous
        const newDigits = [...otpDigits];
        newDigits[index - 1] = "";
        setOtpDigits(newDigits);
        inputRefs.current[index - 1]?.focus();
      } else {
        const newDigits = [...otpDigits];
        newDigits[index] = "";
        setOtpDigits(newDigits);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Support pasting full 6-digit code into any box
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasteData) return;

    const newDigits = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasteData[i] || "";
    }
    setOtpDigits(newDigits);
    setErrorMessage(null);

    const focusIndex = Math.min(pasteData.length, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  // Handle OTP verification submission
  const handleVerify = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    const fullOtp = otpDigits.join("");
    if (fullOtp.length !== 6) {
      setErrorMessage("Please enter all 6 digits of your verification code.");
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      setIsEditingEmail(true);
      return;
    }

    startVerifyTransition(async () => {
      try {
        const res = await verifyOtpAction({
          email: trimmedEmail,
          otp: fullOtp,
        });

        if (!res.success) {
          setErrorMessage(res.error);
        } else {
          setIsVerified(true);
        }
      } catch {
        setErrorMessage("Unable to verify code right now. Please try again.");
      }
    });
  };

  // Handle Resend OTP Code
  const handleResend = () => {
    if (cooldown > 0 || resendPending) return;

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setErrorMessage("Please enter a valid email address to receive a code.");
      setIsEditingEmail(true);
      return;
    }

    setErrorMessage(null);
    setResendSuccess(null);

    startResendTransition(async () => {
      try {
        const res = await resendOtpAction({ email: trimmedEmail });
        if (!res.success) {
          setErrorMessage(res.error);
          if (res.retryAfterSeconds) {
            setCooldown(res.retryAfterSeconds);
          }
        } else {
          setResendSuccess(res.data.message);
          setCooldown(res.data.cooldownSeconds || 60);
          setOtpDigits(["", "", "", "", "", ""]);
          inputRefs.current[0]?.focus();
        }
      } catch {
        setErrorMessage("Failed to resend code. Please try again shortly.");
      }
    });
  };

  const isOtpComplete = otpDigits.every((d) => d !== "");

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

        {/* Success State */}
        {isVerified ? (
          <div className="py-4 flex flex-col items-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-success/10 text-success flex items-center justify-center mb-4">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-extrabold text-text-primary tracking-tight">
              Email Verified Successfully!
            </h2>
            <p className="text-sm text-text-secondary mt-3 leading-relaxed">
              Your student account has been activated. You can now sign in to start preparing for MDCAT, ECAT, and university admissions exams.
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
        ) : (
          /* OTP Form State */
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
              <ShieldCheck className="w-7 h-7" />
            </div>

            <h2 className="text-2xl font-extrabold text-text-primary tracking-tight">
              Enter Verification Code
            </h2>

            <p className="text-sm text-text-secondary mt-2">
              We have sent a 6-digit numeric verification code to your email address.
            </p>

            {/* Email Display / Edit Field */}
            <div className="mt-4 w-full">
              {isEditingEmail ? (
                <div className="flex flex-col gap-1.5 text-left mb-2">
                  <label htmlFor="verify-email-input" className="text-xs font-semibold text-text-secondary">
                    Registered Email Address
                  </label>
                  <div className="flex gap-2">
                    <Input
                      id="verify-email-input"
                      type="email"
                      placeholder="student@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={verifyPending || resendPending}
                      required
                      className="text-sm"
                    />
                    {emailParam && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="md"
                        onClick={() => setIsEditingEmail(false)}
                      >
                        Done
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-surface border border-border rounded-lg text-sm text-text-primary font-medium">
                  <Mail className="w-4 h-4 text-primary shrink-0" />
                  <span className="truncate max-w-[240px]">{email}</span>
                  <button
                    type="button"
                    onClick={() => setIsEditingEmail(true)}
                    className="p-1 text-text-secondary hover:text-primary transition-colors rounded"
                    title="Change email"
                    aria-label="Change email"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div
                role="alert"
                aria-live="polite"
                className="mt-4 p-3 rounded-lg bg-error/10 border border-error/20 text-error text-xs flex items-start gap-2.5 w-full text-left animate-in fade-in"
              >
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">{errorMessage}</p>
                  {errorMessage.includes("expired") && (
                    <p className="mt-1 text-error/90">
                      Click &quot;Resend Code&quot; below to receive a new code.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Resend Success Feedback */}
            {resendSuccess && (
              <div
                role="status"
                aria-live="polite"
                className="mt-4 p-3 rounded-lg bg-success/10 border border-success/20 text-success text-xs flex items-center gap-2.5 w-full text-left animate-in fade-in"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{resendSuccess}</span>
              </div>
            )}

            {/* 6-Digit OTP Input Form */}
            <form onSubmit={handleVerify} className="mt-6 w-full space-y-6">
              <div className="flex justify-center items-center gap-2 sm:gap-3">
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    disabled={verifyPending}
                    aria-label={`Digit ${index + 1}`}
                    autoComplete="one-time-code"
                    className="w-11 h-14 sm:w-13 sm:h-16 text-center text-2xl font-extrabold rounded-xl border border-border bg-surface text-text-primary focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all shadow-xs"
                  />
                ))}
              </div>

              <div className="text-xs text-text-secondary">
                <span>Code expires in <strong>10 minutes</strong>. Never share this code with anyone.</span>
              </div>

              {/* Verify Button */}
              <Button
                type="submit"
                size="lg"
                className="w-full font-bold"
                disabled={!isOtpComplete || !email || verifyPending}
                isLoading={verifyPending}
              >
                Verify Code & Activate Account
                <ArrowRight className="w-4 h-4 ml-1.5 inline" />
              </Button>
            </form>

            {/* Resend OTP Section */}
            <div className="mt-6 pt-5 border-t border-border w-full flex flex-col items-center gap-2">
              <p className="text-xs text-text-secondary">
                Didn&apos;t receive the code or expired? Check your spam folder or resend.
              </p>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResend}
                disabled={cooldown > 0 || resendPending}
                isLoading={resendPending}
                className="text-primary font-semibold text-xs"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                {cooldown > 0 ? `Resend Code in ${cooldown}s` : "Resend Verification Code"}
              </Button>
            </div>

            {/* Return to Login */}
            <div className="mt-4 text-xs text-text-secondary">
              Already verified?{" "}
              <Link href="/student/login" className="text-primary font-semibold hover:underline">
                Sign in here
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
