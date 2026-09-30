import { CardSkeleton, Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div>
      <Skeleton className="bleed -mt-3 h-[300px] rounded-none sm:-mt-10 sm:h-[420px]" />
      <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-8 sm:grid-cols-4 sm:gap-3">
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
