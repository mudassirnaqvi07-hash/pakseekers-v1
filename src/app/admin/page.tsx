/**
 * Admin Dashboard — /admin
 *
 * UI demonstration page to verify the application shell renders correctly.
 *
 * IMPORTANT: All content on this page is static UI demonstration only.
 * No statistics represent real database data — they are placeholders
 * to confirm the design system renders as intended.
 *
 * Real dashboard statistics will be implemented in Phase 4 after the
 * database and authentication are established (Phases 2–3).
 */

import type { Metadata } from "next";
import {
  ClipboardList,
  HelpCircle,
  LayoutDashboard,
  Users,
} from "lucide-react";
import { Card, CardHeader, Badge } from "@/components/ui";
import { PageHeader } from "@/components/shared";

export const metadata: Metadata = {
  title: "Dashboard",
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AdminDashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Dashboard"
        description="Welcome to the PakSeekers admin panel."
      />

      {/* ------------------------------------------------------------------ */}
      {/* UI Demonstration note */}
      {/* ------------------------------------------------------------------ */}
      <div className="rounded-md bg-amber-50 border border-amber-200 px-4 py-3">
        <p className="text-sm text-amber-800">
          <span className="font-semibold">UI Demonstration:</span> The cards
          below are static placeholders to verify the design system. Real
          statistics will appear here after Phases 2–3 (database +
          authentication) are complete.
        </p>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Summary cards — design system demonstration only */}
      {/* ------------------------------------------------------------------ */}
      <section aria-labelledby="summary-heading">
        <h2
          id="summary-heading"
          className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3"
        >
          Summary Cards
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {SUMMARY_CARDS.map((card) => (
            <SummaryCard key={card.label} {...card} />
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Bottom row: Quick Actions + Recent Activity */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card noPadding>
          <CardHeader
            title="Quick Actions"
            description="Shortcuts to common admin tasks."
          />
          <div className="px-6 pb-6 flex flex-col gap-2">
            {QUICK_ACTIONS.map((action) => (
              <div
                key={action.label}
                className="flex items-center justify-between py-2.5 border-b border-border last:border-0"
              >
                <div className="flex items-center gap-2.5 text-sm text-text-primary">
                  <action.icon
                    className="w-4 h-4 text-text-secondary shrink-0"
                    aria-hidden="true"
                  />
                  {action.label}
                </div>
                <Badge variant="info">Phase 5+</Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Activity */}
        <Card noPadding>
          <CardHeader
            title="Recent Activity"
            description="Latest changes in the system."
          />
          <div className="px-6 pb-6">
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <LayoutDashboard
                className="w-8 h-8 text-disabled"
                aria-hidden="true"
              />
              <div>
                <p className="text-sm font-medium text-text-primary">
                  No activity yet
                </p>
                <p className="text-xs text-text-secondary mt-1">
                  Activity will appear here once data management features are
                  active (Phase 5+).
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Static data — UI demonstration labels only, no business data
// ---------------------------------------------------------------------------

const SUMMARY_CARDS: Array<{
  label: string;
  displayValue: string;
  icon: React.ComponentType<{ className?: string }>;
  note: string;
}> = [
  {
    label: "Tests",
    displayValue: "—",
    icon: ClipboardList,
    note: "Available in Phase 5",
  },
  {
    label: "Questions",
    displayValue: "—",
    icon: HelpCircle,
    note: "Available in Phase 7",
  },
  {
    label: "Mock Tests",
    displayValue: "—",
    icon: ClipboardList,
    note: "Available in Phase 8",
  },
  {
    label: "Students",
    displayValue: "—",
    icon: Users,
    note: "Available in Phase 9",
  },
];

const QUICK_ACTIONS: Array<{
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { label: "Create a new test", icon: ClipboardList },
  { label: "Add a question", icon: HelpCircle },
  { label: "Manage students", icon: Users },
  { label: "View reports", icon: ClipboardList },
];

// ---------------------------------------------------------------------------
// Internal component
// ---------------------------------------------------------------------------

function SummaryCard({
  label,
  displayValue,
  icon: Icon,
  note,
}: {
  label: string;
  displayValue: string;
  icon: React.ComponentType<{ className?: string }>;
  note: string;
}) {
  return (
    <div className="bg-surface border border-border rounded-lg p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-text-secondary">{label}</span>
        <div className="w-8 h-8 rounded-md bg-primary/8 flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" aria-hidden="true" />
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold text-text-primary">{displayValue}</p>
        <p className="text-xs text-text-secondary mt-0.5">{note}</p>
      </div>
    </div>
  );
}
