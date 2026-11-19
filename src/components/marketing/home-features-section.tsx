import Link from "next/link";
import {
  GraduationCap,
  Layers,
  HelpCircle,
  Clock,
  BarChart3,
  ArrowRight,
} from "lucide-react";
import { Badge, Button } from "@/components/ui";

const coreFeatures = [
  {
    icon: <GraduationCap className="w-6 h-6" />,
    badge: "Targeted Prep",
    title: "Exam Preparation",
    description:
      "Standardized syllabi tailored for Pakistan's premier entrance tests: MDCAT (Medical), ECAT (Engineering), and NUST NET (Engineering & CS).",
  },
  {
    icon: <Layers className="w-6 h-6" />,
    badge: "Structured Tracks",
    title: "Subject-Wise Learning",
    description:
      "Modular tracks spanning Biology, Chemistry, Physics, Mathematics, and English organized systematically by syllabus weightage.",
  },
  {
    icon: <HelpCircle className="w-6 h-6" />,
    badge: "Verified Rationales",
    title: "Topic-Based MCQ Practice",
    description:
      "Practice curated questions graduated across easy, medium, and hard tiers with verified step-by-step pedagogical explanations.",
  },
  {
    icon: <Clock className="w-6 h-6" />,
    badge: "Real Pacing",
    title: "Mock Tests & Simulations",
    description:
      "Full-length and section-wise timed assessments with live countdown timers that reproduce official test-day stamina and pressure.",
  },
  {
    icon: <BarChart3 className="w-6 h-6" />,
    badge: "Diagnostic Insight",
    title: "Performance Tracking",
    description:
      "Persistent analytics tracking accuracy rates, completion times, and automatic detection of weak areas requiring targeted revision.",
  },
];

export function HomeFeaturesSection() {
  return (
    <section className="py-16 md:py-24 bg-background border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-14">
          <Badge variant="default" className="mb-3 font-semibold">
            Platform Capabilities
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-text-primary tracking-tight">
            Key Platform Features
          </h2>
          <p className="mt-4 text-base text-text-secondary leading-relaxed">
            Everything you need to master entrance examinations through conceptual clarity, disciplined practice, and data-driven revision.
          </p>
        </div>

        {/* 5-Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coreFeatures.map((feature, idx) => (
            <div
              key={feature.title}
              className={`p-7 rounded-2xl border border-border bg-surface hover:border-primary/40 hover:shadow-xs transition-all flex flex-col justify-between ${
                idx === 3 ? "md:col-span-1 lg:col-span-1" : ""
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    {feature.icon}
                  </div>
                  <Badge variant="info" className="text-[10px] font-bold">
                    {feature.badge}
                  </Badge>
                </div>

                <h3 className="text-lg font-bold text-text-primary mb-2">
                  {feature.title}
                </h3>
                <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                  {feature.description}
                </p>
              </div>

              <div className="pt-4 mt-6 border-t border-border flex items-center text-xs font-semibold text-primary">
                <span>Core Module</span>
              </div>
            </div>
          ))}

          {/* Deep Exploration Card */}
          <div className="p-7 rounded-2xl border border-primary/30 bg-primary/5 flex flex-col justify-between">
            <div>
              <Badge variant="warning" className="text-[10px] font-bold mb-4">
                Full Details
              </Badge>
              <h3 className="text-lg font-bold text-text-primary mb-2">
                Discover All Capabilities
              </h3>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed mb-6">
                Explore how the PakSeekers curriculum taxonomy, timer engine, and question bank operate in detail.
              </p>
            </div>

            <div>
              <Link href="/explore">
                <Button size="md" className="w-full font-semibold">
                  Explore Platform Details
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5 shrink-0" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
