/**
 * Card — PakSeekers UI primitive.
 *
 * A surface container with optional header, body, and footer sections.
 * Design: white background, subtle border, moderate radius, minimal shadow.
 */

import { cn } from "@/lib/utils/cn";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Remove default padding from the card body. */
  noPadding?: boolean;
}

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Card title — rendered as an h2. */
  title?: string;
  /** Optional description rendered below the title. */
  description?: string;
  /** Content rendered on the right side of the header (e.g., actions). */
  actions?: React.ReactNode;
}

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Alignment of footer content. */
  align?: "left" | "right" | "between";
}

// ---------------------------------------------------------------------------
// Card root
// ---------------------------------------------------------------------------

export function Card({ noPadding, className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "bg-surface border border-border rounded-lg shadow-sm",
        !noPadding && "p-6",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Card.Header
// ---------------------------------------------------------------------------

export function CardHeader({
  title,
  description,
  actions,
  className,
  children,
  ...props
}: CardHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 pb-4 border-b border-border mb-4",
        className
      )}
      {...props}
    >
      <div className="flex flex-col gap-1 min-w-0">
        {title && (
          <h2 className="text-base font-semibold text-text-primary truncate">
            {title}
          </h2>
        )}
        {description && (
          <p className="text-sm text-text-secondary">{description}</p>
        )}
        {children}
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0">{actions}</div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Card.Footer
// ---------------------------------------------------------------------------

export function CardFooter({
  align = "right",
  className,
  children,
  ...props
}: CardFooterProps) {
  const alignStyles = {
    left: "justify-start",
    right: "justify-end",
    between: "justify-between",
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 pt-4 border-t border-border mt-4",
        alignStyles[align],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Card.Content
// ---------------------------------------------------------------------------

export function CardContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-0", className)} {...props}>
      {children}
    </div>
  );
}

