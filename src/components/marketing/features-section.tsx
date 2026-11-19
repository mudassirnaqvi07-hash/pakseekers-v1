import {
  BookOpen,
  Layers,
  HelpCircle,
  Clock,
  Sparkles,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import { Badge, Button } from "@/components/ui";
import { SITE_CONFIG } from "@/lib/config/site";

const iconMap: Record<string, React.ReactNode> = {
  "exam-catalog": <BookOpen className="w-6 h-6" />,
  "subject-practice": <Layers className="w-6 h-6" />,
  "topic-mcqs": <HelpCircle className="w-6 h-6" />,
  "timed-tests": <Clock className="w-6 h-6" />,
  "pedagogical-explanations": <Sparkles className="w-6 h-6" />,
  "progress-tracking": <BarChart3 className="w-6 h-6" />,
};

export function FeaturesSection() {
  return (
    <section id="features" className="py-16 md:py-24 bg-surface border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <Badge variant="default" className="mb-3 font-semibold">
            Platform Capabilities
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-text-primary tracking-tight">
            Engineered for Conceptual Retention & Exam Stamina
          </h2>
          <p className="mt-4 text-base sm:text-lg text-text-secondary leading-relaxed">
            Every feature in PakSeekers exists to solve a specific challenge in entrance exam
            preparation—from syllabus overwhelm to pacing anxiety.
          </p>
        </div>

        {/* Features 3x2 Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {SITE_CONFIG.features.map((feature) => (
            <div
              key={feature.id}
              className="p-7 rounded-2xl border border-border bg-background hover:border-primary/40 hover:shadow-xs transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    {iconMap[feature.id] || <Sparkles className="w-6 h-6" />}
                  </div>
                  <Badge variant="info" className="text-[10px] font-semibold py-0.5">
                    {feature.category}
                  </Badge>
                </div>

                <h3 className="text-lg font-bold text-text-primary mb-2">
                  {feature.title}
                </h3>
                <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                  {feature.description}
                </p>
              </div>

              <div className="pt-5 mt-5 border-t border-border flex items-center text-xs font-semibold text-primary">
                <span>Core Platform Feature</span>
              </div>
            </div>
          ))}
        </div>

        {/* Feature CTA Callout */}
        <div className="mt-16 text-center">
          <Link href="/exams">
            <Button
              size="md"
              variant="outline"
              className="font-semibold px-6"
            >
              Browse Active Exam Syllabi
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
