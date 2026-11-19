/**
 * Skeleton — PakSeekers UI primitive.
 *
 * Provides accessible, lightweight placeholder loading indicators
 * conforming to design system tokens.
 */

import { cn } from "@/lib/utils/cn";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-md bg-border/60", className)}
      {...props}
    />
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "p-5 rounded-xl border border-border bg-surface flex flex-col gap-3 animate-pulse shadow-xs",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-20 rounded" />
        <Skeleton className="h-4 w-16 rounded" />
      </div>
      <Skeleton className="h-6 w-3/4 rounded" />
      <Skeleton className="h-4 w-full rounded" />
      <Skeleton className="h-4 w-2/3 rounded" />
      <div className="pt-3 border-t border-border flex items-center justify-between">
        <Skeleton className="h-4 w-24 rounded" />
        <Skeleton className="h-8 w-20 rounded-md" />
      </div>
    </div>
  );
}

export function SkeletonStatCard({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "p-4 rounded-xl border border-border bg-surface flex items-center gap-4 animate-pulse shadow-xs",
        className
      )}
    >
      <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
      <div className="flex flex-col gap-2 w-full">
        <Skeleton className="h-3.5 w-20 rounded" />
        <Skeleton className="h-6 w-16 rounded" />
      </div>
    </div>
  );
}
