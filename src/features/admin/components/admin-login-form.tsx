"use client";

/**
 * Admin Login Form — PakSeekers Phase 4.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, AlertCircle } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { loginAdminAction } from "@/server/actions/auth-actions";

export function AdminLoginForm() {
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
      setError("Invalid administrator credentials.");
      return;
    }

    startTransition(async () => {
      const res = await loginAdminAction({ email: emailVal, password: passwordVal });
      if (!res.success) {
        setError(res.error);
      } else {
        router.push(res.data.redirectUrl);
        router.refresh();
      }
    });
  };

  const handleFillDemo = () => {
    setEmail("admin@pakseekers.com");
    setPassword("admin123");
  };

  return (
    <form
      id="admin-login-form"
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
          id="admin-login-email"
          name="email"
          type="email"
          label="Administrator Email"
          required
          autoComplete="email"
          placeholder="admin@pakseekers.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isPending}
        />
      </div>

      <div>
        <Input
          id="admin-login-password"
          name="password"
          type="password"
          label="Master Password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isPending}
        />
      </div>

      <Button
        id="admin-login-submit"
        type="submit"
        size="md"
        className="w-full mt-2"
        disabled={isPending}
      >
        <ShieldCheck className="w-4 h-4 mr-2" />
        {isPending ? "Authenticating..." : "Sign In to Admin Panel"}
      </Button>

      {/* Demo Credentials Helper */}
      <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-text-secondary">
        <span>Admin: admin@pakseekers.com</span>
        <button
          type="button"
          onClick={handleFillDemo}
          className="text-primary font-semibold hover:underline cursor-pointer"
        >
          Auto-fill
        </button>
      </div>

      <div className="text-center text-xs text-text-secondary mt-2">
        <Link href="/" className="hover:underline text-text-secondary">
          ← Return to Public Homepage
        </Link>
      </div>
    </form>
  );
}
