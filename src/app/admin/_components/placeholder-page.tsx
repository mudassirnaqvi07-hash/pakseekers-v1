/**
 * PlaceholderPage — internal utility for Phase 1 admin module pages.
 *
 * Renders a consistent "coming in a future phase" placeholder for admin
 * module routes that do not yet have business functionality implemented.
 *
 * This is NOT exported from the shared barrel — it is an app-layer helper
 * used only within /app/admin/* placeholder pages.
 */

import type { Metadata } from "next";
import { Clock } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/shared";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PlaceholderPageProps {
  title: string;
  description: string;
  phase: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PlaceholderPage({
  title,
  description,
  phase,
}: PlaceholderPageProps) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={title} description={description} />

      <div className="bg-surface border border-border rounded-lg">
        <EmptyState
          icon={<Clock className="w-7 h-7" aria-hidden="true" />}
          title="Coming in a Future Phase"
          description={`This module is planned for ${phase}. The navigation and routing structure have been established so the shell is ready when development begins.`}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// generateMetadata helper — called by each page module
// ---------------------------------------------------------------------------

export function buildMetadata(title: string): Metadata {
  return { title };
}
