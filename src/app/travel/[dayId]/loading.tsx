import { CardSkeleton, Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div>
      <Skeleton className="h-[190px] w-full rounded-[12px] sm:h-[340px]" />
      <Skeleton className="mt-4 h-4 w-1/3" />
      <Skeleton className="mt-3 h-8 w-2/3" />
      <div className="mt-6">
        <CardSkeleton count={3} />
      </div>
    </div>
  );
}
