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
    "bg-primary text-white hover:bg-primary-hover focus-visible:ring-primary/40 border-transparent shadow-xs",
  secondary:
    "bg-secondary text-white hover:bg-secondary-hover focus-visible:ring-secondary/40 border-transparent shadow-xs",
  danger:
    "bg-error text-white hover:bg-red-700 focus-visible:ring-error/40 border-transparent shadow-xs",
  outline:
    "bg-transparent text-primary border-border hover:bg-background hover:border-primary/40 focus-visible:ring-primary/40",
  ghost:
    "bg-transparent text-text-primary border-transparent hover:bg-background focus-visible:ring-primary/40",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "min-h-[38px] sm:min-h-[32px] h-auto sm:h-8 px-3 py-1.5 sm:py-0 text-xs sm:text-sm gap-1.5",
  md: "min-h-[44px] sm:min-h-[40px] h-auto sm:h-10 px-4 py-2 sm:py-0 text-sm gap-2",
  lg: "min-h-[48px] sm:min-h-[44px] h-auto sm:h-11 px-6 py-2.5 sm:py-0 text-sm sm:text-base gap-2.5",
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
      style,
      ...props
    },
    ref
  ) {
    const isDisabled = disabled || isLoading;
    const isMultiline =
      Boolean(className?.includes("whitespace-normal")) ||
      style?.whiteSpace === "normal";
    const resolvedWhiteSpace = isMultiline ? "normal" : (style?.whiteSpace ?? "nowrap");

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        style={{
          display: "inline-flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          whiteSpace: resolvedWhiteSpace,
          ...style,
        }}
        className={cn(
          // Base: flex-row, items-center, responsive touch targets
          "inline-flex flex-row items-center justify-center font-medium rounded-md border max-w-full",
          !isMultiline && "whitespace-nowrap select-none",
          "transition-colors duration-150 leading-snug sm:leading-none",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
          // SVG containment: ensures icons inside buttons are inline-block flex items that never wrap
          "[&_svg]:inline-block [&_svg]:shrink-0 [&_svg]:align-middle [&_svg]:pointer-events-none",
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
        <span
          className={cn(
            "inline-flex flex-row items-center justify-center gap-2 max-w-full min-w-0",
            !isMultiline && "leading-none"
          )}
          style={{
            display: "inline-flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            whiteSpace: resolvedWhiteSpace,
          }}
        >
          {isLoading ? (
            <>
              <Spinner size={size} />
              {children && <span className="truncate">{children}</span>}
            </>
          ) : (
            <>
              {leftIcon && (
                <span className="inline-flex shrink-0 items-center justify-center">
                  {leftIcon}
                </span>
              )}
              {children && (
                <span
                  className={cn(
                    "inline-flex flex-row items-center justify-center gap-1.5 min-w-0",
                    !isMultiline && "whitespace-nowrap"
                  )}
                  style={{ whiteSpace: resolvedWhiteSpace }}
                >
                  {children}
                </span>
              )}
              {rightIcon && (
                <span className="inline-flex shrink-0 items-center justify-center">
                  {rightIcon}
                </span>
              )}
            </>
          )}
        </span>
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
