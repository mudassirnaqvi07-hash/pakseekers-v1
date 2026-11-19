"use client";

/**
 * Root Error Boundary — PakSeekers.
 *
 * Catches unhandled runtime and rendering exceptions, providing an accessible,
 * branded recovery interface with 'Try Again' and navigation back to safety.
 */

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { Button, Card, CardContent } from "@/components/ui";
import { BrandLogo } from "@/components/shared";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error boundary triggered:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col justify-between p-4 sm:p-6">
      <header className="max-w-5xl mx-auto w-full py-4 flex items-center justify-between">
        <BrandLogo variant="horizontal" size="sm" href="/" subtitle="Entry Test Prep" />
        <Link
          href="/"
          className="text-xs font-semibold text-text-secondary hover:text-primary transition-colors"
        >
          ← Return to Homepage
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center py-10 w-full max-w-md mx-auto">
        <Card className="w-full shadow-md border-border">
          <CardContent className="p-6 sm:p-8 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-error/10 text-error flex items-center justify-center mb-6 shadow-2xs">
              <AlertCircle className="w-8 h-8" aria-hidden="true" />
            </div>

            <span className="text-xs font-extrabold uppercase tracking-widest text-error mb-2">
              System Notice
            </span>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight mb-2">
              Something went wrong
            </h1>

            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed mb-6">
              An unexpected temporary issue occurred while loading this page. Please try refreshing.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
              <Button
                variant="primary"
                size="md"
                onClick={() => reset()}
                className="w-full sm:flex-1 justify-center font-bold cursor-pointer"
                leftIcon={<RefreshCw className="w-4 h-4 shrink-0" />}
              >
                Try Again
              </Button>

              <Link href="/" className="w-full sm:flex-1">
                <Button
                  variant="outline"
                  size="md"
                  className="w-full justify-center font-semibold cursor-pointer"
                  leftIcon={<Home className="w-4 h-4 shrink-0" />}
                >
                  Homepage
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>

      <footer className="max-w-5xl mx-auto w-full py-4 text-center text-xs text-text-secondary">
        <p>© {new Date().getFullYear()} PakSeekers. All rights reserved.</p>
      </footer>
    </div>
  );
}
