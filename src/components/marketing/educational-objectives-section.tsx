import { BookCheck, GraduationCap, Clock, BarChart3, Check } from "lucide-react";
import { Badge } from "@/components/ui";
import { SITE_CONFIG } from "@/lib/config/site";

const icons = [
  <BookCheck key="1" className="w-6 h-6 text-primary" />,
  <GraduationCap key="2" className="w-6 h-6 text-secondary" />,
  <Clock key="3" className="w-6 h-6 text-accent" />,
  <BarChart3 key="4" className="w-6 h-6 text-success" />,
];

export function EducationalObjectivesSection() {
  const { educationalObjectives } = SITE_CONFIG;

  return (
    <section className="py-16 md:py-20 bg-background border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-14">
          <Badge variant="default" className="mb-3 font-semibold">
            Academic Framework
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-text-primary tracking-tight">
            Our Educational Objectives
          </h2>
          <p className="mt-4 text-base text-text-secondary leading-relaxed">
            PakSeekers is engineered around 4 core pedagogical goals designed to elevate student competence from basic memorization to analytical mastery.
          </p>
        </div>

        {/* 4 Objectives Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {educationalObjectives.map((obj, index) => (
            <div
              key={obj.title}
              className="p-8 rounded-2xl border border-border bg-surface hover:border-primary/40 transition-colors shadow-2xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-xl bg-background border border-border flex items-center justify-center">
                    {icons[index % icons.length]}
                  </div>
                  <span className="text-xs font-mono font-bold text-text-secondary">
                    Objective 0{index + 1}
                  </span>
                </div>

                <h3 className="text-lg sm:text-xl font-bold text-text-primary mb-3">
                  {obj.title}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {obj.description}
                </p>
              </div>

              <div className="pt-4 mt-6 border-t border-border flex items-center gap-2 text-xs font-semibold text-text-secondary">
                <Check className="w-4 h-4 text-success shrink-0" />
                <span>Verified Curriculum Standard</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
