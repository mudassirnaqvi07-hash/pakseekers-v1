/**
 * Textarea — PakSeekers UI primitive.
 *
 * A multi-line text input field with label, helper text, and error state support.
 * Uses design tokens exclusively for focus, border, and error states.
 */

import { forwardRef, useId } from "react";
import { cn } from "@/lib/utils/cn";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Visible label rendered above the textarea. */
  label?: string;
  /** Helper text rendered below the textarea. */
  helperText?: string;
  /** Validation error message — replaces helperText and applies error styles. */
  errorMessage?: string;
  /** Marks the field as required with a visible indicator. */
  required?: boolean;
  /** Wrapper className for the entire field group. */
  wrapperClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    {
      label,
      helperText,
      errorMessage,
      required,
      wrapperClassName,
      className,
      id: externalId,
      disabled,
      rows = 3,
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
        {label && (
          <label
            htmlFor={id}
            className="text-xs font-semibold text-text-primary flex items-center gap-1 select-none"
          >
            <span>{label}</span>
            {required && (
              <span className="text-error" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}

        <textarea
          ref={ref}
          id={id}
          rows={rows}
          disabled={disabled}
          required={required}
          aria-invalid={hasError ? "true" : undefined}
          aria-describedby={
            hasError ? errorId : helperText ? helperId : undefined
          }
          className={cn(
            // Base layout
            "w-full px-3 py-2 rounded-md text-sm transition-colors duration-150 resize-y",
            // Typography & colors
            "bg-surface text-text-primary placeholder:text-text-secondary/50",
            // Border
            "border border-border",
            // Focus
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent",
            // Error
            hasError &&
              "border-error focus-visible:ring-error focus-visible:border-transparent",
            // Disabled
            disabled &&
              "bg-background text-disabled border-border cursor-not-allowed opacity-60",
            className
          )}
          {...props}
        />

        {hasError && (
          <p id={errorId} role="alert" className="text-xs text-error">
            {errorMessage}
          </p>
        )}

        {!hasError && helperText && (
          <p id={helperId} className="text-xs text-text-secondary">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
