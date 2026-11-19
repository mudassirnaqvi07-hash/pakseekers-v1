import { CheckCircle2, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui";
import { SITE_CONFIG } from "@/lib/config/site";

export function WhyChooseSection() {
  return (
    <section id="why-us" className="py-16 md:py-24 bg-background border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <Badge variant="default" className="mb-3 font-semibold">
            Comparative Advantages
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-text-primary tracking-tight">
            Why Choose PakSeekers?
          </h2>
          <p className="mt-4 text-base sm:text-lg text-text-secondary leading-relaxed">
            Unlike commercial test academies that rely on rote memorization and high tuition,
            PakSeekers focuses on structured methodology, conceptual mastery, and transparency.
          </p>
        </div>

        {/* Advantages Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SITE_CONFIG.advantages.map((item, index) => (
            <div
              key={item.id}
              className={`p-7 rounded-2xl border border-border bg-surface hover:shadow-xs transition-shadow flex flex-col justify-between ${
                index === 0 ? "md:col-span-2 lg:col-span-1" : ""
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <Badge variant="info" className="text-[10px] font-bold">
                    {item.badge}
                  </Badge>
                  <span className="text-xs font-mono font-bold text-text-secondary">
                    0{index + 1}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-text-primary mb-2">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="pt-4 mt-6 border-t border-border flex items-center gap-2 text-xs font-semibold text-success">
                <CheckCircle2 className="w-4 h-4 text-success" />
                <span>Verified Pedagogical Standard</span>
              </div>
            </div>
          ))}
        </div>

        {/* Commitment Banner */}
        <div className="mt-12 p-6 rounded-2xl bg-surface border border-border flex flex-col sm:flex-row items-center justify-between gap-4 max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-success/10 text-success flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-text-primary">
                100% Authentic Academic Content
              </h4>
              <p className="text-xs text-text-secondary mt-0.5">
                Every MCQ is mapped to official curriculum criteria and includes full step-by-step rationales.
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-primary shrink-0">
            Pakistan Standards Aligned
          </span>
        </div>
      </div>
    </section>
  );
}
