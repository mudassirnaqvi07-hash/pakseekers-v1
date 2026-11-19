import Link from "next/link";
import { FileQuestion, Home, ArrowLeft } from "lucide-react";
import { Card, CardContent, Button } from "@/components/ui";
import { BrandLogo } from "@/components/shared";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col justify-between p-4 sm:p-6">
      <header className="max-w-5xl mx-auto w-full py-4 flex items-center justify-between">
        <BrandLogo
          variant="horizontal"
          size="sm"
          href="/"
          subtitle="Entry Test Prep"
        />
        <Link
          href="/"
          className="text-xs font-semibold text-text-secondary hover:text-primary transition-colors flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return Home</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center py-10 w-full max-w-md mx-auto">
        <Card className="w-full shadow-md border-border">
          <CardContent className="p-6 sm:p-8 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6 shadow-2xs">
              <FileQuestion className="w-8 h-8" aria-hidden="true" />
            </div>

            <span className="text-xs font-extrabold uppercase tracking-widest text-primary mb-2">
              404 Error
            </span>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight mb-2">
              Page Not Found
            </h1>

            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed mb-6">
              The page you are looking for does not exist, has been moved, or is no longer available.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
              <Link href="/" className="w-full">
                <Button
                  variant="primary"
                  size="md"
                  className="w-full justify-center font-bold"
                  leftIcon={<Home className="w-4 h-4 shrink-0" />}
                >
                  Back to Homepage
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
