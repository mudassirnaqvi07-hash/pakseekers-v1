import {
  Compass,
  Target,
  Sparkles,
  Users,
  CheckCircle2,
  GraduationCap,
} from "lucide-react";
import { Badge, Card, CardContent } from "@/components/ui";
import { SITE_CONFIG } from "@/lib/config/site";

export function AboutSection() {
  const { about, vision, mission } = SITE_CONFIG;

  return (
    <section id="about" className="py-16 md:py-24 bg-surface border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <Badge variant="default" className="mb-3 font-semibold">
            About the Platform
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-text-primary tracking-tight">
            Built for Pakistan’s Future Leaders
          </h2>
          <p className="mt-4 text-base sm:text-lg text-text-secondary leading-relaxed">
            {about.overview}
          </p>
        </div>

        {/* 2-Column: Who We Serve & The Problem We Solve */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-16">
          {/* Who It Serves */}
          <div className="p-5 sm:p-8 rounded-2xl border border-border bg-background flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-3">
                Who PakSeekers Serves
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed mb-6">
                {about.targetAudience}
              </p>
            </div>

            <div className="pt-4 border-t border-border flex items-center gap-2 text-xs font-semibold text-primary">
              <GraduationCap className="w-4 h-4 shrink-0" />
              <span>Targeting Top Pakistani Universities</span>
            </div>
          </div>

          {/* Problem Solved */}
          <div className="p-5 sm:p-8 rounded-2xl border border-border bg-background flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center mb-6">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-3">
                The Problem We Solve
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed mb-6">
                {about.problemSolved}
              </p>
            </div>

            <div className="pt-4 border-t border-border flex items-center gap-2 text-xs font-semibold text-secondary">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Moving Beyond Rote Memorization</span>
            </div>
          </div>
        </div>

        {/* Benefit Summary Strip */}
        <div className="p-4 sm:p-6 rounded-xl bg-primary/5 border border-primary/20 text-center max-w-4xl mx-auto mb-16 sm:mb-20">
          <p className="text-sm sm:text-base font-medium text-text-primary leading-relaxed">
            <span className="font-bold text-primary">The Student Advantage: </span>
            {about.benefitStatement}
          </p>
        </div>

        {/* Vision & Mission Subsections */}
        <div id="vision" className="pt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {/* Vision Card */}
            <Card className="p-5 sm:p-8 bg-surface border-border flex flex-col justify-between shadow-2xs hover:border-primary/40 transition-colors">
              <CardContent>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-accent/15 text-accent flex items-center justify-center shrink-0">
                    <Compass className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <Badge variant="warning" className="text-[10px] font-bold uppercase tracking-wider mb-0.5">
                      North Star
                    </Badge>
                    <h3 className="text-xl sm:text-2xl font-bold text-text-primary">
                      {vision.title}
                    </h3>
                  </div>
                </div>

                <p className="text-sm text-text-secondary leading-relaxed mb-8">
                  {vision.statement}
                </p>

                <div className="space-y-4 pt-6 border-t border-border">
                  {vision.pillars.map((pillar, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-xs">
                      <div className="w-5 h-5 rounded-full bg-accent/10 text-accent font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <div>
                        <h4 className="font-bold text-text-primary">{pillar.title}</h4>
                        <p className="text-text-secondary mt-0.5 leading-normal">
                          {pillar.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Mission Card */}
            <Card className="p-5 sm:p-8 bg-surface border-border flex flex-col justify-between shadow-2xs hover:border-primary/40 transition-colors">
              <CardContent>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <Badge variant="info" className="text-[10px] font-bold uppercase tracking-wider mb-0.5">
                      Execution
                    </Badge>
                    <h3 className="text-xl sm:text-2xl font-bold text-text-primary">
                      {mission.title}
                    </h3>
                  </div>
                </div>

                <p className="text-sm text-text-secondary leading-relaxed mb-8">
                  {mission.statement}
                </p>

                <div className="space-y-4 pt-6 border-t border-border">
                  {mission.commitments.map((commitment, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-xs">
                      <div className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <div>
                        <h4 className="font-bold text-text-primary">{commitment.title}</h4>
                        <p className="text-text-secondary mt-0.5 leading-normal">
                          {commitment.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
