/**
 * Badge — PakSeekers UI primitive.
 *
 * A compact status/label indicator using semantic colors from the design system.
 * Variants map directly to the status taxonomy in docs/DESIGN-SYSTEM.md.
 */

import { cn } from "@/lib/utils/cn";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BadgeVariant =
  | "default"
  | "success"
  | "error"
  | "warning"
  | "info"
  | "draft"
  | "archived";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  /** Renders a small dot indicator before the label. */
  dot?: boolean;
}

// ---------------------------------------------------------------------------
// Variant styles — semantic only, no arbitrary colors
// ---------------------------------------------------------------------------

const variantStyles: Record<BadgeVariant, string> = {
  // Neutral — default state
  default: "bg-background text-text-secondary border-border",
  // Draft — neutral, content not yet ready
  draft: "bg-background text-text-secondary border-border",
  // Success / Published / Correct
  success: "bg-green-50 text-success border-green-200",
  // Error / Critical / Incorrect
  error: "bg-red-50 text-error border-red-200",
  // Warning / Review / Needs improvement
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  // Info / Secondary
  info: "bg-blue-50 text-primary border-blue-200",
  // Archived — muted
  archived: "bg-background text-disabled border-border",
};

const dotStyles: Record<BadgeVariant, string> = {
  default: "bg-text-secondary",
  draft: "bg-text-secondary",
  success: "bg-success",
  error: "bg-error",
  warning: "bg-amber-500",
  info: "bg-primary",
  archived: "bg-disabled",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Badge({
  variant = "default",
  dot = false,
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5",
        "rounded-full border px-2.5 py-0.5",
        "text-xs font-medium leading-none",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotStyles[variant])}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}
