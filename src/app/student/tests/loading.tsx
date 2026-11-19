import { Skeleton, SkeletonCard } from "@/components/ui";

export default function StudentTestsLoading() {
  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 flex flex-col gap-6 animate-in fade-in">
      <div className="flex flex-col gap-2 pb-6 border-b border-border">
        <Skeleton className="h-8 w-60 rounded-md" />
        <Skeleton className="h-4 w-80 rounded" />
      </div>

      <div className="flex items-center gap-2">
        <Skeleton className="h-9 w-24 rounded-md" />
        <Skeleton className="h-9 w-24 rounded-md" />
        <Skeleton className="h-9 w-24 rounded-md" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}
