/**
 * PageHeader — PakSeekers shared component.
 *
 * Renders a consistent page-level heading with an optional description
 * and an optional actions slot (e.g., a primary action button).
 *
 * Usage:
 *   <PageHeader
 *     title="Dashboard"
 *     description="Overview of the PakSeekers admin panel."
 *     actions={<Button>Create</Button>}
 *   />
 */

import { cn } from "@/lib/utils/cn";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PageHeaderProps {
  /** Page title — rendered as the primary h1. */
  title: string;
  /** Optional supporting description rendered below the title. */
  description?: string;
  /** Optional content rendered on the right side (e.g., action buttons). */
  actions?: React.ReactNode;
  /** Additional className for the wrapper element. */
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PageHeader({
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border mb-6",
        className
      )}
    >
      <div className="flex flex-col gap-1 min-w-0">
        <h1 className="text-xl sm:text-2xl font-semibold text-text-primary tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">{description}</p>
        )}
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto">{actions}</div>
      )}
    </div>
  );
}
