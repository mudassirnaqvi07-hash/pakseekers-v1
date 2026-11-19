import Link from "next/link";
import {
  Compass,
  CheckCircle2,
  Clock,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { Badge, Button } from "@/components/ui";

const steps = [
  {
    step: "01",
    icon: <Compass className="w-6 h-6" />,
    title: "Explore Examinations",
    description:
      "Select your target examination—MDCAT, ECAT, or NUST NET. Review the complete syllabus hierarchy and subject weightage.",
  },
  {
    step: "02",
    icon: <CheckCircle2 className="w-6 h-6" />,
    title: "Practice Questions",
    description:
      "Drill topic-specific question banks at your own pace. Read step-by-step pedagogical rationales to master difficult concepts.",
  },
  {
    step: "03",
    icon: <Clock className="w-6 h-6" />,
    title: "Attempt Tests",
    description:
      "Take timed mock exams under simulated test-day countdowns to build speed, eliminate exam panic, and perfect time management.",
  },
  {
    step: "04",
    icon: <TrendingUp className="w-6 h-6" />,
    title: "Track Progress",
    description:
      "Review your performance dashboard. Review automated weak area alerts (< 60% accuracy) and target specific topics for revision.",
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-16 md:py-24 bg-surface border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <Badge variant="default" className="mb-3 font-semibold">
            Study Workflow
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-text-primary tracking-tight">
            How PakSeekers Works
          </h2>
          <p className="mt-4 text-base text-text-secondary leading-relaxed">
            A structured, 4-step preparation cycle designed to take you from foundational concept review to full entrance test readiness.
          </p>
        </div>

        {/* 4-Step Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {steps.map((item, index) => (
            <div
              key={item.step}
              className="p-6 rounded-2xl border border-border bg-background flex flex-col justify-between hover:border-primary/40 transition-all shadow-2xs relative"
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    {item.icon}
                  </div>
                  <span className="text-2xl font-black font-mono text-primary/30">
                    {item.step}
                  </span>
                </div>

                <h3 className="text-base font-bold text-text-primary mb-2">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="pt-4 mt-6 border-t border-border flex items-center text-xs font-semibold text-text-secondary">
                <span>Step {index + 1} of 4</span>
              </div>
            </div>
          ))}
        </div>

        {/* Action Link */}
        <div className="mt-12 text-center">
          <Link href="/explore">
            <Button variant="outline" size="md" className="font-semibold">
              <span>View In-Depth Platform Guide</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5 shrink-0" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
