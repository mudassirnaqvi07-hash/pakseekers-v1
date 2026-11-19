import {
  Layers,
  HelpCircle,
  Clock,
  BarChart3,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui";

const studyWorkflow = [
  {
    num: "1",
    title: "Select Target Examination",
    desc: "Choose MDCAT, ECAT, or NUST NET to access dedicated, PMDC- and UET-aligned subject tracks and syllabi.",
  },
  {
    num: "2",
    title: "Master Subject Topics",
    desc: "Drill topic-specific question banks graduated across difficulty levels with step-by-step verified explanations.",
  },
  {
    num: "3",
    title: "Simulate Timed Assessments",
    desc: "Take full-length mock exams under official countdown conditions to build mental stamina and eliminate exam anxiety.",
  },
  {
    num: "4",
    title: "Diagnose & Revise Weak Areas",
    desc: "Review your performance dashboard where topics scoring below 60% are flagged for priority revision.",
  },
];

export function PlatformCapabilitiesSection() {
  return (
    <section id="features" className="py-16 md:py-24 bg-surface border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <Badge variant="default" className="mb-3 font-semibold">
            In-Depth Platform Architecture
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-text-primary tracking-tight">
            How PakSeekers Accelerates Preparation
          </h2>
          <p className="mt-4 text-base sm:text-lg text-text-secondary leading-relaxed">
            Every layer of the PakSeekers platform is engineered around proven cognitive learning strategies: structured taxonomy, immediate pedagogical feedback, and timed retrieval practice.
          </p>
        </div>

        {/* 4 Feature Deep Dives */}
        <div className="space-y-8 sm:space-y-12">
          {/* Capability 1: Subjects and Topics */}
          <div className="p-5 sm:p-8 md:p-10 rounded-2xl border border-border bg-background shadow-2xs">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center">
              <div className="lg:col-span-7">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Layers className="w-5 h-5" />
                  </div>
                  <Badge variant="info" className="text-xs font-bold">
                    Curriculum Architecture
                  </Badge>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-text-primary mb-3">
                  Hierarchical Subjects & Topics
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed mb-4">
                  PakSeekers strictly organizes study material through a 4-tier pedagogical hierarchy:
                  <strong className="text-text-primary font-semibold"> Examination &rarr; Subject &rarr; Topic &rarr; Questions</strong>.
                  Students can systematically progress through Biology, Chemistry, Physics, Mathematics, and English without syllabus ambiguity or gaps.
                </p>
                <div className="space-y-2 text-xs text-text-secondary">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                    <span>Mapped to official PMDC, UET, NUST, and FAST-NU syllabus outlines</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                    <span>Clear topic-wise question distributions and syllabus coverage indicators</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 bg-surface p-4 sm:p-6 rounded-xl border border-border">
                <span className="text-xs font-bold text-text-secondary uppercase tracking-wider block mb-3">
                  Curriculum Distribution Example
                </span>
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-lg border border-border bg-background flex flex-col xs:flex-row xs:items-center justify-between gap-1">
                    <span className="font-semibold text-text-primary">MDCAT Biology</span>
                    <Badge variant="default" className="text-[10px] w-fit">Cell Biology, Genetics, Enzymes</Badge>
                  </div>
                  <div className="p-2.5 rounded-lg border border-border bg-background flex flex-col xs:flex-row xs:items-center justify-between gap-1">
                    <span className="font-semibold text-text-primary">ECAT Physics</span>
                    <Badge variant="default" className="text-[10px] w-fit">Mechanics, Electromagnetism, Optics</Badge>
                  </div>
                  <div className="p-2.5 rounded-lg border border-border bg-background flex flex-col xs:flex-row xs:items-center justify-between gap-1">
                    <span className="font-semibold text-text-primary">NET Mathematics</span>
                    <Badge variant="default" className="text-[10px] w-fit">Calculus, Vectors, Trigonometry</Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Capability 2: Question Bank & MCQ Practice */}
          <div className="p-5 sm:p-8 md:p-10 rounded-2xl border border-border bg-background shadow-2xs">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center">
              <div className="lg:col-span-7">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                    <HelpCircle className="w-5 h-5" />
                  </div>
                  <Badge variant="info" className="text-xs font-bold">
                    Pedagogical Rigor
                  </Badge>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-text-primary mb-3">
                  Curated Question Bank & Step-by-Step Rationales
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed mb-4">
                  Practice questions are graduated across Easy, Medium, and Hard difficulty levels.
                  Unlike standard answer keys that only state the correct letter, every question on PakSeekers contains an authoritative explanation detailing the underlying formula, concept, and common misconceptions.
                </p>
                <div className="space-y-2 text-xs text-text-secondary">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                    <span>Step-by-step scientific and mathematical reasoning for every question</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                    <span>Distractor breakdown explaining why deceptive options are incorrect</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 bg-surface p-4 sm:p-6 rounded-xl border border-border">
                <div className="flex items-center gap-1.5 text-xs font-bold text-primary mb-2">
                  <Sparkles className="w-4 h-4 text-accent shrink-0" />
                  <span>Verified Pedagogical Explanation</span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed bg-primary/5 p-3.5 rounded-lg border border-primary/20">
                  &ldquo;Mitochondria synthesize ATP through oxidative phosphorylation across the inner membrane cristae, where the electron transport chain maintains a proton gradient.&rdquo;
                </p>
                <span className="text-[10px] text-text-secondary mt-2 block font-medium">
                  Authoritative explanations reinforce understanding on every completed attempt.
                </span>
              </div>
            </div>
          </div>

          {/* Capability 3: Practice Tests & Mock Tests */}
          <div className="p-5 sm:p-8 md:p-10 rounded-2xl border border-border bg-background shadow-2xs">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center">
              <div className="lg:col-span-7">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/15 text-accent flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <Badge variant="warning" className="text-xs font-bold">
                    Exam Stamina
                  </Badge>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-text-primary mb-3">
                  Timed Practice Tests & Grand Mocks
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed mb-4">
                  Entrance exams require answering complex analytical questions under extreme time pressure (often under 60 seconds per question).
                  Our testing engine reproduces this environment with synchronized countdown timers, question navigation palettes, and automatic submission upon time expiry.
                </p>
                <div className="space-y-2 text-xs text-text-secondary">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                    <span>Realistic time constraints matching PMDC and UET standards</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                    <span>Support for standard scoring and negative marking configuration</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 bg-surface p-4 sm:p-6 rounded-xl border border-border flex flex-col justify-between">
                <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
                  <span className="text-xs font-bold text-text-primary">Mock Test Engine</span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 font-mono text-xs font-bold">
                    ⏱ Auto-Submit Timer
                  </span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Students can attempt both quick 10-minute topic drills and 200-question full-length grand mock tests to build speed, composure, and endurance.
                </p>
              </div>
            </div>
          </div>

          {/* Capability 4: Performance Tracking & Results */}
          <div className="p-5 sm:p-8 md:p-10 rounded-2xl border border-border bg-background shadow-2xs">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center">
              <div className="lg:col-span-7">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-success/10 text-success flex items-center justify-center shrink-0">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <Badge variant="success" className="text-xs font-bold">
                    Actionable Diagnostics
                  </Badge>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-text-primary mb-3">
                  Performance Tracking & Weak-Area Detection
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed mb-4">
                  Every submitted attempt is evaluated authoritatively on the server and permanently recorded in MongoDB Atlas.
                  Students receive an instant score summary, question-by-question review, and automated identification of low-scoring topics (&lt; 60% accuracy) for targeted remediation.
                </p>
                <div className="space-y-2 text-xs text-text-secondary">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                    <span>Instant score breakdown: correct, incorrect, unattempted, and percentage</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                    <span>Personalized weak-area list flagging priority revision targets</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 bg-surface p-4 sm:p-6 rounded-xl border border-border">
                <span className="text-xs font-bold text-text-secondary uppercase tracking-wider block mb-3">
                  Diagnostic Metrics Tracked
                </span>
                <div className="grid grid-cols-2 gap-2.5 sm:gap-3 text-center text-xs">
                  <div className="p-2.5 sm:p-3 rounded-lg bg-background border border-border">
                    <span className="block font-extrabold text-primary text-sm sm:text-base">Tests Attempted</span>
                    <span className="text-[10px] sm:text-[11px] text-text-secondary mt-0.5">Session Count</span>
                  </div>
                  <div className="p-2.5 sm:p-3 rounded-lg bg-background border border-border">
                    <span className="block font-extrabold text-secondary text-sm sm:text-base">Average Accuracy</span>
                    <span className="text-[10px] sm:text-[11px] text-text-secondary mt-0.5">Overall Percentage</span>
                  </div>
                  <div className="p-2.5 sm:p-3 rounded-lg bg-background border border-border">
                    <span className="block font-extrabold text-success text-sm sm:text-base">Best Score</span>
                    <span className="text-[10px] sm:text-[11px] text-text-secondary mt-0.5">Peak Performance</span>
                  </div>
                  <div className="p-2.5 sm:p-3 rounded-lg bg-background border border-border">
                    <span className="block font-extrabold text-error text-sm sm:text-base">Weak Areas</span>
                    <span className="text-[10px] sm:text-[11px] text-text-secondary mt-0.5">&lt; 60% Accuracy</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 6: How Students Can Use the Platform (Study Guide) */}
        <div className="mt-20 pt-16 border-t border-border">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <Badge variant="default" className="mb-3 font-semibold">
              Student Preparation Guide
            </Badge>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
              A 4-Step Methodology for Entry Test Success
            </h3>
            <p className="mt-3 text-sm sm:text-base text-text-secondary leading-relaxed">
              Follow this battle-tested preparation framework to maximize your score on entrance test day.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {studyWorkflow.map((step) => (
              <div
                key={step.num}
                className="p-6 rounded-2xl border border-border bg-background flex flex-col justify-between shadow-2xs"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-primary text-white font-extrabold flex items-center justify-center mb-4 text-sm shadow-xs">
                    {step.num}
                  </div>
                  <h4 className="text-base font-bold text-text-primary mb-2">
                    {step.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                    {step.desc}
                  </p>
                </div>
                <div className="pt-4 mt-6 border-t border-border flex items-center text-xs font-semibold text-primary">
                  <span>Phase {step.num} of 4</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
