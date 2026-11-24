/**
 * Test Peer Statistics Component — PakSeekers Testing Module.
 *
 * Displays aggregated performance insights based on other students'
 * completed attempts of the exact test:
 *   - Average Score (% arithmetic mean)
 *   - Average Time Taken (formatted duration)
 *   - Total Valid Attempts
 *
 * Enforces strict data privacy: zero exposure of individual student identities.
 * Displays a clean, graceful fallback state when insufficient attempts exist.
 */

import React from "react";
import { Users, Clock, Target, ShieldCheck, BarChart2, Sparkles } from "lucide-react";
import type { TestPerformanceInsights } from "@/types";
import { Card, CardContent, Badge } from "@/components/ui";

interface TestPeerStatisticsCardProps {
  stats: TestPerformanceInsights;
  studentScore?: number | null;
  className?: string;
}

export function TestPeerStatisticsCard({
  stats,
  studentScore,
  className = "",
}: TestPeerStatisticsCardProps) {
  const hasData = stats.hasSufficientData && stats.totalAttempts > 0 && stats.averageScore !== null;

  return (
    <Card className={`border-border bg-surface shadow-2xs overflow-hidden ${className}`}>
      <CardContent className="p-4 sm:p-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-text-primary tracking-tight">
                  Peer Performance Insights
                </h3>
              </div>
              <p className="text-xs text-text-secondary mt-0.5">
                Aggregated statistics from other students who completed this exact test.
              </p>
            </div>
          </div>

          <div className="self-start sm:self-center">
            {hasData ? (
              <Badge variant="success" className="font-semibold text-xs flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Benchmark
              </Badge>
            ) : (
              <Badge variant="default" className="text-xs text-text-secondary">
                Awaiting Data
              </Badge>
            )}
          </div>
        </div>

        {/* Content Section */}
        {hasData ? (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {/* Metric 1: Average Score */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-background border border-border flex flex-col justify-between">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-text-secondary">Average Score</span>
                  <div className="w-7 h-7 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Target className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">
                      {stats.averageScore}%
                    </span>
                    <span className="text-xs text-text-secondary font-medium">peer mean</span>
                  </div>

                  {/* Optional student comparative badge */}
                  {typeof studentScore === "number" && (
                    <div className="mt-2">
                      {studentScore >= (stats.averageScore ?? 0) ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                          <Sparkles className="w-3 h-3 text-emerald-700" />
                          +{studentScore - (stats.averageScore ?? 0)}% above peer average
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-500/10 px-2 py-0.5 rounded-full">
                          {(stats.averageScore ?? 0) - studentScore}% below peer average
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-text-secondary mt-2">
                  Arithmetic mean of completed attempts
                </p>
              </div>

              {/* Metric 2: Average Time Taken */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-background border border-border flex flex-col justify-between">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-text-secondary">Average Time Taken</span>
                  <div className="w-7 h-7 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
                    {stats.formattedAverageTime ?? "—"}
                  </span>
                </div>
                <p className="text-[11px] text-text-secondary mt-2">
                  Typical completion duration of test-takers
                </p>
              </div>

              {/* Metric 3: Total Valid Attempts */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-background border border-border flex flex-col justify-between">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-text-secondary">Total Attempts</span>
                  <div className="w-7 h-7 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
                    {stats.totalAttempts}
                  </span>
                  <span className="text-xs text-text-secondary font-medium">
                    {stats.totalAttempts === 1 ? "completed attempt" : "completed attempts"}
                  </span>
                </div>
                <p className="text-[11px] text-text-secondary mt-2">
                  Verified student submissions included
                </p>
              </div>
            </div>

            {/* Strict Data Privacy Footnote */}
            <div className="mt-4 pt-3 border-t border-border/70 flex items-center gap-1.5 text-[11px] text-text-secondary">
              <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>
                <strong>Privacy Protected:</strong> Performance data is strictly aggregated and anonymized across student cohorts.
              </span>
            </div>
          </div>
        ) : (
          /* Graceful Fallback State (Insufficient Data) */
          <div className="py-6 px-4 rounded-xl bg-background border border-dashed border-border text-center flex flex-col items-center justify-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-1">
              <BarChart2 className="w-5 h-5" />
            </div>
            <p className="text-sm font-semibold text-text-primary">
              Not enough attempts yet to generate performance insights.
            </p>
            <p className="text-xs text-text-secondary max-w-md leading-relaxed">
              Be one of the first students to complete this test and establish the performance benchmark for fellow candidates!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
