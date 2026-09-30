import { CardSkeleton, Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div>
      <Skeleton className="h-[220px] w-full rounded-[12px] sm:h-[340px]" />
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </div>
      <div className="mt-6">
        <CardSkeleton count={1} />
      </div>
    </div>
  );
}
