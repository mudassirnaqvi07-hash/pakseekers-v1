/**
 * Class name utility — merges Tailwind class strings.
 *
 * A minimal implementation that handles the common cases:
 * - Filters out falsy values (undefined, null, false, "")
 * - Joins the remaining strings with a space
 *
 * This avoids adding `clsx` or `tailwind-merge` as dependencies for now.
 * If class-merge conflicts become a real problem (e.g., conditional variants
 * overriding base classes), replace with `clsx` + `tailwind-merge` at that point.
 *
 * Usage:
 *   cn("px-4 py-2", isActive && "bg-primary", className)
 */
export function cn(
  ...classes: Array<string | undefined | null | false>
): string {
  return classes.filter(Boolean).join(" ");
}
