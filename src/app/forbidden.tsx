/**
 * Next.js App Router 403 Forbidden UI — /forbidden
 */

import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { Card, CardContent, Button, Badge } from "@/components/ui";
import { BrandLogo } from "@/components/shared";

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col justify-between p-4 sm:p-6">
      <header className="max-w-5xl mx-auto w-full py-4 flex items-center justify-between">
        <BrandLogo variant="horizontal" size="sm" href="/" subtitle="Security Barrier" />
        <Link
          href="/"
          className="text-xs font-semibold text-text-secondary hover:text-primary transition-colors"
        >
          ← Return to Public Homepage
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center py-10 w-full max-w-lg mx-auto">
        <Card className="w-full shadow-md border-border">
          <CardContent className="p-6 sm:p-8 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-error/10 text-error flex items-center justify-center mb-6 shadow-2xs">
              <ShieldAlert className="w-8 h-8" aria-hidden="true" />
            </div>

            <Badge variant="error" className="mb-3 uppercase tracking-wider text-[10px] font-bold">
              403 Forbidden
            </Badge>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
              Access Restricted
            </h1>

            <p className="text-xs sm:text-sm text-text-secondary mt-2 leading-relaxed">
              Your account role does not have authorization to access this portal or resource.
            </p>

            <div className="mt-8 flex items-center justify-center gap-3 w-full">
              <Link href="/" className="w-full sm:w-auto">
                <Button
                  variant="primary"
                  size="md"
                  className="w-full sm:w-auto px-8 font-bold"
                  leftIcon={<ArrowLeft className="w-4 h-4 shrink-0" />}
                >
                  Return to Homepage
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>

      <footer className="max-w-5xl mx-auto w-full py-4 text-center text-xs text-text-secondary">
        <p>© {new Date().getFullYear()} PakSeekers. Role-Based Access Control Enforced.</p>
      </footer>
    </div>
  );
}