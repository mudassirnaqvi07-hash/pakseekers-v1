import { Skeleton, SkeletonCard } from "@/components/ui";

export default function ExamsLoading() {
  return (
    <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8 flex flex-col gap-8 animate-in fade-in">
      <div className="flex flex-col gap-2 pb-6 border-b border-border">
        <Skeleton className="h-8 w-64 rounded-md" />
        <Skeleton className="h-4 w-96 rounded" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}
