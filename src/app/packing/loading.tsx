import { CardSkeleton, Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="grid gap-3.5 lg:grid-cols-[360px_minmax(0,1fr)] lg:items-start lg:gap-6">
      <div>
        <Skeleton className="h-[140px] w-full rounded-[12px] sm:h-[200px]" />
        <Skeleton className="mt-4 h-9 w-1/3" />
      </div>
      <CardSkeleton count={4} />
    </div>
  );
}
