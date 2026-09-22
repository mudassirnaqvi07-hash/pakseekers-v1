/**
 * EmptyState — PakSeekers shared component.
 *
 * Displayed when a module or list has no content — or when a feature
 * is planned for a future development phase.
 *
 * Usage:
 *   <EmptyState
 *     icon={<Clock className="w-8 h-8" />}
 *     title="Coming in a Future Phase"
 *     description="This module will be available once the feature is implemented."
 *   />
 */

import { cn } from "@/lib/utils/cn";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EmptyStateProps {
  /** Icon element — recommend a Lucide icon at w-8 h-8. */
  icon?: React.ReactNode;
  /** Primary message. */
  title: string;
  /** Supporting detail text. */
  description?: string;
  /** Optional action element (e.g., a Button). */
  action?: React.ReactNode;
  /** Additional className for the wrapper element. */
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-16 px-6 text-center",
        className
      )}
    >
      {icon && (
        <div className="w-14 h-14 rounded-full bg-background border border-border flex items-center justify-center text-text-secondary">
          {icon}
        </div>
      )}

      <div className="flex flex-col gap-1.5 max-w-xs">
        <p className="text-sm font-semibold text-text-primary">{title}</p>
        {description && (
          <p className="text-sm text-text-secondary leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
