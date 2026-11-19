import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, ShieldCheck, Target } from "lucide-react";
import { Badge, Button } from "@/components/ui";
import { SITE_CONFIG } from "@/lib/config/site";

export function HomeIntroSection() {
  return (
    <section className="py-16 md:py-20 bg-surface border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column: Context & Overview */}
          <div className="lg:col-span-7 flex flex-col items-start">
            <Badge variant="default" className="mb-3 font-semibold">
              Introduction
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-text-primary tracking-tight leading-tight">
              A Dedicated Engine for Competitive University Admissions
            </h2>
            <p className="mt-4 text-base text-text-secondary leading-relaxed">
              {SITE_CONFIG.about.overview}
            </p>
            <p className="mt-3 text-sm text-text-secondary leading-relaxed">
              Designed specifically for intermediate students (FSc Pre-Medical, FSc Pre-Engineering, ICS) and A-Level graduates aiming for admission into premier medical colleges, engineering universities, and computing institutions.
            </p>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
              <div className="p-3.5 rounded-xl bg-background border border-border flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                <span className="text-xs font-medium text-text-primary">
                  100% syllabus alignment with PMDC, UET & NUST standards
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-background border border-border flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                <span className="text-xs font-medium text-text-primary">
                  No academy tuition or hidden subscription paywalls
                </span>
              </div>
            </div>

            <div className="mt-8 flex items-center gap-4">
              <Link href="/about">
                <Button variant="outline" size="md" className="font-semibold">
                  Read About Our Mission & Vision
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5 shrink-0" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Column: Key Takeaway Pillars */}
          <div className="lg:col-span-5 grid grid-cols-1 gap-4">
            <div className="p-6 rounded-2xl border border-border bg-background flex items-start gap-4 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-text-primary">
                  Syllabus-Level Precision
                </h3>
                <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                  Every MCQ belongs to a clear academic taxonomy: Exam &rarr; Subject &rarr; Topic. No disorganized question dumps.
                </p>
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-border bg-background flex items-start gap-4 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0 mt-0.5">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-text-primary">
                  Step-by-Step Rationales
                </h3>
                <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                  Understand why the correct answer is valid and why distractors fail, reinforcing deep conceptual mastery.
                </p>
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-border bg-background flex items-start gap-4 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-accent/15 text-accent flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-text-primary">
                  Diagnostic Performance Feedback
                </h3>
                <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                  Persistent tracking identifies your weak topics automatically (&lt; 60% accuracy) for targeted revision.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
