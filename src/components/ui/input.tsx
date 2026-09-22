/**
 * Input — PakSeekers UI primitive.
 *
 * A form input field with label, helper text, and error state support.
 * All styling uses design tokens. No arbitrary color values.
 */

import { forwardRef, useId } from "react";
import { cn } from "@/lib/utils/cn";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Visible label rendered above the input. */
  label?: string;
  /** Helper text rendered below the input (hidden when errorMessage is set). */
  helperText?: string;
  /** Validation error message — replaces helperText and applies error styles. */
  errorMessage?: string;
  /** Marks the field as required with a visible indicator. */
  required?: boolean;
  /** Element rendered inside the input on the left (e.g., icon). */
  leftElement?: React.ReactNode;
  /** Element rendered inside the input on the right (e.g., icon, button). */
  rightElement?: React.ReactNode;
  /** Wrapper className for the entire field group. */
  wrapperClassName?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    helperText,
    errorMessage,
    required,
    leftElement,
    rightElement,
    wrapperClassName,
    className,
    id: externalId,
    disabled,
    ...props
  },
  ref
) {
  const generatedId = useId();
  const id = externalId ?? generatedId;
  const hasError = Boolean(errorMessage);
  const errorId = `${id}-error`;
  const helperId = `${id}-helper`;

  return (
    <div className={cn("flex flex-col gap-1.5", wrapperClassName)}>
      {/* Label */}
      {label && (
        <label
          htmlFor={id}
          className="text-sm font-medium text-text-primary leading-none"
        >
          {label}
          {required && (
            <span
              className="ml-1 text-error"
              aria-label="required"
              aria-hidden="true"
            >
              *
            </span>
          )}
        </label>
      )}

      {/* Input wrapper */}
      <div className="relative flex items-center">
        {leftElement && (
          <div className="absolute left-3 flex items-center text-text-secondary pointer-events-none">
            {leftElement}
          </div>
        )}

        <input
          ref={ref}
          id={id}
          disabled={disabled}
          required={required}
          aria-invalid={hasError}
          aria-describedby={
            hasError ? errorId : helperText ? helperId : undefined
          }
          className={cn(
            // Base
            "w-full h-10 rounded-md border bg-surface px-3 py-2",
            "text-sm text-text-primary placeholder:text-text-secondary",
            "transition-colors duration-150",
            // Focus
            "focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary",
            // Error
            hasError
              ? "border-error focus:ring-error/40 focus:border-error"
              : "border-border",
            // Disabled
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-background",
            // Icon padding adjustments
            leftElement ? "pl-10" : false,
            rightElement ? "pr-10" : false,
            className
          )}
          {...props}
        />

        {rightElement && (
          <div className="absolute right-3 flex items-center text-text-secondary">
            {rightElement}
          </div>
        )}
      </div>

      {/* Helper / Error text */}
      {hasError ? (
        <p id={errorId} role="alert" className="text-xs text-error">
          {errorMessage}
        </p>
      ) : helperText ? (
        <p id={helperId} className="text-xs text-text-secondary">
          {helperText}
        </p>
      ) : null}
    </div>
  );
});
