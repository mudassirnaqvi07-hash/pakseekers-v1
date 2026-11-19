import { Skeleton, SkeletonCard } from "@/components/ui";

export default function StudentAttemptsLoading() {
  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 flex flex-col gap-6 animate-in fade-in">
      <div className="flex flex-col gap-2 pb-6 border-b border-border">
        <Skeleton className="h-8 w-56 rounded-md" />
        <Skeleton className="h-4 w-72 rounded" />
      </div>

      <div className="flex flex-col gap-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}
