import { CardSkeleton, Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div>
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="mt-3 h-8 w-3/4" />
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </div>
      <div className="mt-6">
        <CardSkeleton count={3} />
      </div>
    </div>
  );
}
