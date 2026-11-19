import { Skeleton, SkeletonCard, SkeletonStatCard } from "@/components/ui";

export default function StudentDashboardLoading() {
  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 flex flex-col gap-8 animate-in fade-in">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-64 rounded-md" />
          <Skeleton className="h-4 w-96 rounded" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-44 rounded-md" />
          <Skeleton className="h-10 w-28 rounded-md" />
        </div>
      </div>

      {/* Metrics Overview Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
      </div>

      {/* Main sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-6 w-48 rounded" />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className="flex flex-col gap-4">
          <Skeleton className="h-6 w-48 rounded" />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    </div>
  );
}
