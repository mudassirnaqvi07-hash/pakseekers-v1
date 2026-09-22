/**
 * Select — PakSeekers UI primitive.
 *
 * A dropdown select component aligned with the PakSeekers Design System.
 * Uses design tokens exclusively for focus, border, and error states.
 */

import { forwardRef, useId } from "react";
import { cn } from "@/lib/utils/cn";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  /** Visible label rendered above the select. */
  label?: string;
  /** Helper text rendered below the select. */
  helperText?: string;
  /** Validation error message — replaces helperText and applies error styles. */
  errorMessage?: string;
  /** Marks the field as required. */
  required?: boolean;
  /** Options list */
  options?: SelectOption[];
  /** Placeholder option shown when no value is selected */
  placeholder?: string;
  /** Wrapper className for the field group. */
  wrapperClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {
    label,
    helperText,
    errorMessage,
    required,
    options,
    placeholder,
    wrapperClassName,
    className,
    id: externalId,
    disabled,
    children,
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

      <div className="relative">
        <select
          ref={ref}
          id={id}
          disabled={disabled}
          required={required}
          aria-invalid={hasError ? "true" : undefined}
          aria-describedby={
            hasError ? errorId : helperText ? helperId : undefined
          }
          className={cn(
            // Base layout
            "w-full h-10 px-3 py-2 pr-8 rounded-md text-sm transition-colors duration-150 appearance-none cursor-pointer",
            // Typography & colors
            "bg-surface text-text-primary border border-border",
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
        >
          {placeholder && (
            <option value="" disabled={required}>
              {placeholder}
            </option>
          )}
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>

        {/* Custom chevron dropdown icon */}
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-text-secondary">
          <svg
            className="w-4 h-4"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>

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
});
