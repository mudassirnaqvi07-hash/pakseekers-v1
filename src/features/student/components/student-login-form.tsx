"use client";

/**
 * Student Login Form — PakSeekers Phase 4.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogIn, AlertCircle } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { loginStudentAction } from "@/server/actions/auth-actions";

export function StudentLoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const emailVal = ((formData.get("email") as string) || email).trim();
    const passwordVal = (formData.get("password") as string) || password;

    if (!emailVal || !passwordVal) {
      setError("Invalid email or password.");
      return;
    }

    startTransition(async () => {
      const res = await loginStudentAction({
        email: emailVal,
        password: passwordVal,
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

  const handleFillDemo = () => {
    setEmail("student@pakseekers.com");
    setPassword("student123");
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
          className="p-3 rounded-md bg-error/10 border border-error/20 text-error text-xs flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
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
          disabled={isPending}
        />
      </div>

      <div>
        <Input
          id="student-login-password"
          name="password"
          type="password"
          label="Password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isPending}
        />
      </div>

      <Button
        id="student-login-submit"
        type="submit"
        size="md"
        className="w-full mt-2"
        disabled={isPending}
      >
        <LogIn className="w-4 h-4 mr-2" />
        {isPending ? "Signing in..." : "Sign In to Student Portal"}
      </Button>

      {/* Demo Credentials Helper */}
      <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-text-secondary">
        <span>Demo: student@pakseekers.com</span>
        <button
          type="button"
          onClick={handleFillDemo}
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
