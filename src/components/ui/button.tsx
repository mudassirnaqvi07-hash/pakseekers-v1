/**
 * Button — PakSeekers UI primitive.
 *
 * Uses design tokens exclusively. No arbitrary color values.
 * All variants align with the PakSeekers Design System (docs/DESIGN-SYSTEM.md).
 */

import { forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "danger"
  | "ghost"
  | "outline";

export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a loading spinner and disables the button. */
  isLoading?: boolean;
  /** Left-side icon element. */
  leftIcon?: React.ReactNode;
  /** Right-side icon element. */
  rightIcon?: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Variant styles — all use design tokens via Tailwind utilities
// ---------------------------------------------------------------------------

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-white hover:bg-primary-hover focus-visible:ring-primary/40 border-transparent",
  secondary:
    "bg-secondary text-white hover:bg-secondary-hover focus-visible:ring-secondary/40 border-transparent",
  danger:
    "bg-error text-white hover:bg-red-700 focus-visible:ring-error/40 border-transparent",
  outline:
    "bg-transparent text-primary border-border hover:bg-background focus-visible:ring-primary/40",
  ghost:
    "bg-transparent text-text-primary border-transparent hover:bg-background focus-visible:ring-primary/40",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-11 px-6 text-base gap-2",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      className,
      disabled,
      ...props
    },
    ref
  ) {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        className={cn(
          // Base
          "inline-flex items-center justify-center font-medium rounded-md border",
          "transition-colors duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
          // Disabled
          "disabled:opacity-50 disabled:cursor-not-allowed",
          // Variant
          variantStyles[variant],
          // Size
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <>
            <Spinner size={size} />
            {children && <span>{children}</span>}
          </>
        ) : (
          <>
            {leftIcon && <span className="shrink-0">{leftIcon}</span>}
            {children && <span>{children}</span>}
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

// ---------------------------------------------------------------------------
// Spinner — internal, not exported separately
// ---------------------------------------------------------------------------

function Spinner({ size }: { size: ButtonSize }) {
  const spinnerSize = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";
  return (
    <svg
      className={cn("animate-spin shrink-0", spinnerSize)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
