import Link from "next/link";
import {
  Sparkles,
  Clock,
  CheckCircle2,
  BarChart3,
  Check,
} from "lucide-react";
import { Badge, Button } from "@/components/ui";
import { SITE_CONFIG } from "@/lib/config/site";
import type { SafeUser } from "@/types";

interface HeroSectionProps {
  currentUser?: SafeUser | null;
}

export function HeroSection({ currentUser }: HeroSectionProps) {
  const primaryHref = currentUser?.role === "student"
    ? "/student/dashboard"
    : "/student/register";

  const primaryLabel = currentUser?.role === "student"
    ? "Go to Student Dashboard"
    : "Get Started Free";

  return (
    <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 bg-gradient-to-b from-primary/5 via-background to-background border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Messaging & CTAs */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            {/* Tagline Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface border border-border text-xs font-semibold text-text-primary shadow-2xs mb-6">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span>{SITE_CONFIG.tagline}</span>
            </div>

            {/* Headline */}
            <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-text-primary leading-[1.15]">
              Prepare Smarter.{" "}
              <span className="text-primary underline decoration-accent/40 decoration-4 underline-offset-8">
                Achieve Further.
              </span>
            </h1>

            {/* Subheadline */}
            <p className="mt-6 text-sm sm:text-base md:text-lg text-text-secondary leading-relaxed max-w-xl">
              {SITE_CONFIG.subheadline}
            </p>

            {/* Key Value Checklist */}
            <div className="mt-6 flex flex-wrap gap-y-2 gap-x-4 sm:gap-x-6 text-xs sm:text-sm text-text-secondary font-medium">
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-success shrink-0" />
                PMDC & UET Aligned
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-success shrink-0" />
                Step-by-Step Rationales
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-success shrink-0" />
                Timed Simulation
              </span>
            </div>

            {/* CTA Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              <Link href={primaryHref} className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto px-8 font-bold"
                >
                  {primaryLabel}
                </Button>
              </Link>

              <Link href="/explore" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto px-8 font-semibold"
                >
                  Explore Platform
                </Button>
              </Link>
            </div>

            {/* Quick highlight bar */}
            <div className="mt-12 pt-8 border-t border-border/80 grid grid-cols-3 gap-2 sm:gap-4 w-full max-w-lg">
              <div className="min-w-0">
                <p className="text-lg xs:text-xl sm:text-2xl font-bold text-primary truncate">MDCAT</p>
                <p className="text-[11px] sm:text-xs text-text-secondary mt-0.5 truncate">Medical & Dental</p>
              </div>
              <div className="min-w-0">
                <p className="text-lg xs:text-xl sm:text-2xl font-bold text-primary truncate">ECAT</p>
                <p className="text-[11px] sm:text-xs text-text-secondary mt-0.5 truncate">Engineering</p>
              </div>
              <div className="min-w-0">
                <p className="text-lg xs:text-xl sm:text-2xl font-bold text-primary truncate">NET</p>
                <p className="text-[11px] sm:text-xs text-text-secondary mt-0.5 truncate">NUST Test</p>
              </div>
            </div>
          </div>

          {/* Right Column: High-Fidelity Test Canvas Preview */}
          <div className="lg:col-span-5 relative">
            {/* Background glow card */}
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-2xl blur-lg opacity-70" />

            {/* Simulated Live Question Card */}
            <div className="relative rounded-2xl border border-border bg-surface p-6 shadow-md">
              {/* Header preview meta */}
              <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
                <div className="flex items-center gap-2">
                  <Badge variant="info" className="font-bold text-[10px]">
                    MDCAT Biology
                  </Badge>
                  <span className="text-xs text-text-secondary">Cell Biology</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-mono font-bold">
                  <Clock className="w-3.5 h-3.5" />
                  <span>14:48</span>
                </div>
              </div>

              {/* Question stem */}
              <div className="mb-4">
                <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block mb-1">
                  Question 14 of 40
                </span>
                <p className="text-sm font-semibold text-text-primary leading-relaxed">
                  Which organelle is responsible for synthesizing ATP through aerobic
                  cellular respiration?
                </p>
              </div>

              {/* Options list */}
              <div className="space-y-2 mb-4 text-xs">
                <div className="p-2.5 rounded-lg border border-border bg-background text-text-secondary flex items-center justify-between">
                  <span>A. Ribosome</span>
                </div>
                <div className="p-2.5 rounded-lg border border-primary bg-primary/5 text-primary font-semibold flex items-center justify-between shadow-2xs">
                  <span>B. Mitochondrion</span>
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                </div>
                <div className="p-2.5 rounded-lg border border-border bg-background text-text-secondary flex items-center justify-between">
                  <span>C. Golgi Apparatus</span>
                </div>
                <div className="p-2.5 rounded-lg border border-border bg-background text-text-secondary flex items-center justify-between">
                  <span>D. Endoplasmic Reticulum</span>
                </div>
              </div>

              {/* Pedagogical Explanation Preview */}
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-[11px]">
                <div className="flex items-center gap-1 font-bold text-primary mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-accent" />
                  <span>Pedagogical Explanation:</span>
                </div>
                <p className="text-text-secondary leading-normal">
                  Mitochondria produce the majority of cellular ATP via the citric acid
                  cycle and oxidative phosphorylation in the inner mitochondrial cristae.
                </p>
              </div>

              {/* Card Footer Badge */}
              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-[11px] text-text-secondary">
                <span className="flex items-center gap-1 font-medium">
                  <BarChart3 className="w-3.5 h-3.5 text-success" />
                  Instant Score Tracking
                </span>
                <span className="text-primary font-semibold">PakSeekers Engine</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
