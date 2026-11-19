"use client";

/**
 * Admin Login Form — PakSeekers Phase 4.
 *
 * Implements administrative authentication with password visibility toggle,
 * duplicate submission defense, accessible status alerts, and seamless redirection.
 */

import { useState, useTransition } from "react";
import Link from "next/link";
import { AlertCircle, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { loginAdminAction } from "@/server/actions/auth-actions";

export function AdminLoginForm() {
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
      setError("Please enter your administrator email and password.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await loginAdminAction({ email: emailVal, password: passwordVal });
        if (!res.success) {
          setError(res.error);
        } else {
          setSuccessMsg("Administrator session verified! Loading command center...");
          setTimeout(() => {
            window.location.href = res.data.redirectUrl;
          }, 350);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to sign in right now. Please check your credentials and try again.");
      }
    });
  };

  const handleFillDemo = () => {
    setEmail("admin@pakseekers.com");
    setPassword("admin123");
    setError(null);
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
          id="admin-login-email"
          name="email"
          type="email"
          label="Administrator Email"
          required
          autoComplete="email"
          placeholder="admin@pakseekers.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isPending || Boolean(successMsg)}
        />
      </div>

      <div>
        <Input
          id="admin-login-password"
          name="password"
          type={showPassword ? "text" : "password"}
          label="Master Password"
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
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-text-secondary hover:text-text-primary focus:outline-none focus:ring-1 focus:ring-primary rounded transition-colors cursor-pointer"
              tabIndex={0}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
        />
      </div>

      <Button
        id="admin-login-submit"
        type="submit"
        size="md"
        className="w-full mt-2 font-semibold"
        isLoading={isPending}
        disabled={isPending || Boolean(successMsg)}
      >
        {isPending ? "Authenticating..." : "Sign In to Admin Panel"}
      </Button>

      {/* Demo Credentials Helper */}
      <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-text-secondary">
        <span>Admin: admin@pakseekers.com</span>
        <button
          type="button"
          onClick={handleFillDemo}
          aria-label="Auto fill demo admin credentials"
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
