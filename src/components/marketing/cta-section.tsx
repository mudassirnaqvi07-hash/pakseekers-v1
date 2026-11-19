import Link from "next/link";
import { CheckCircle2, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui";
import type { SafeUser } from "@/types";

interface CtaSectionProps {
  currentUser?: SafeUser | null;
}

export function CtaSection({ currentUser }: CtaSectionProps) {
  const registerHref = currentUser?.role === "student"
    ? "/student/dashboard"
    : "/student/register";

  const registerText = currentUser?.role === "student"
    ? "Open Your Student Dashboard"
    : "Create Free Student Account";

  return (
    <section className="py-20 bg-primary text-white relative overflow-hidden">
      {/* Subtle geometric background overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <div className="w-14 h-14 rounded-2xl bg-white/10 text-white flex items-center justify-center mx-auto mb-6 backdrop-blur-sm border border-white/20">
          <GraduationCap className="w-8 h-8" />
        </div>

        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
          Ready to Accelerate Your University Entrance Preparation?
        </h2>

        <p className="text-primary-foreground/90 max-w-2xl mx-auto mb-8 text-base sm:text-lg leading-relaxed">
          Begin practicing right now with syllabus-accurate MCQs, verified explanations,
          and realistic timed assessments for MDCAT, ECAT, and NUST NET.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href={registerHref} className="w-full sm:w-auto">
            <Button
              size="lg"
              variant="secondary"
              className="w-full sm:w-auto px-8 font-bold"
            >
              {registerText}
            </Button>
          </Link>

          {!currentUser && (
            <Link href="/student/login" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto px-8 bg-transparent text-white border-white hover:bg-white/10"
              >
                Student Sign In
              </Button>
            </Link>
          )}
        </div>

        {/* Guarantee Pills */}
        <div className="mt-10 pt-8 border-t border-white/20 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs text-primary-foreground/80 font-medium">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-accent" />
            Standardized Question Banks
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-accent" />
            Zero Distraction Interface
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-accent" />
            No Academy Tuition Required
          </span>
        </div>
      </div>
    </section>
  );
}
