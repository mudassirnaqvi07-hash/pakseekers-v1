import { Badge } from "@/components/ui";
import { SITE_CONFIG } from "@/lib/config/site";
import { ShieldCheck, Code, Award, GraduationCap } from "lucide-react";

export function TeamSection() {
  const { team } = SITE_CONFIG;

  return (
    <section id="team" className="py-16 md:py-24 bg-surface border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <Badge variant="default" className="mb-3 font-semibold">
            Leadership & Engineering
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-text-primary tracking-tight">
            The Team Behind PakSeekers
          </h2>
          <p className="mt-4 text-base sm:text-lg text-text-secondary leading-relaxed">
            Founded with a commitment to academic equity and software engineering excellence,
            PakSeekers is built to serve Pakistan’s aspiring university applicants.
          </p>
        </div>

        {/* Team Grid */}
        <div className="flex justify-center max-w-2xl mx-auto">
          {team.map((member) => (
            <div
              key={member.name}
              className="w-full p-5 sm:p-8 md:p-10 rounded-2xl border border-border bg-background shadow-xs hover:border-primary/40 transition-colors flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8"
            >
              {/* Profile Avatar / Visual */}
              <div className="relative shrink-0">
                <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-tr from-primary to-secondary text-white font-bold text-2xl sm:text-3xl flex items-center justify-center shadow-md">
                  {member.initials}
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-lg bg-surface border border-border shadow-xs flex items-center justify-center text-primary">
                  <Code className="w-4 h-4" />
                </div>
              </div>

              {/* Bio & Credentials */}
              <div className="flex flex-col text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1.5">
                  <h3 className="text-xl sm:text-2xl font-bold text-text-primary">
                    {member.name}
                  </h3>
                  <Badge variant="info" className="text-[10px] font-bold">
                    Founder
                  </Badge>
                </div>

                <p className="text-sm font-semibold text-primary mb-3">
                  {member.role}
                </p>

                <p className="text-xs sm:text-sm text-text-secondary leading-relaxed mb-6">
                  {member.bio}
                </p>

                <div className="pt-4 border-t border-border flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-text-secondary">
                  <span className="flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-accent" />
                    {member.specialization}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-success" />
                    Verified Contributor
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Academic Advisory Notice */}
        <div className="mt-12 text-center max-w-xl mx-auto">
          <p className="text-xs text-text-secondary flex items-center justify-center gap-1.5">
            <GraduationCap className="w-4 h-4 text-text-secondary shrink-0" />
            Curriculum content is verified against official PMDC, UET, and NUST examination guidelines.
          </p>
        </div>
      </div>
    </section>
  );
}
