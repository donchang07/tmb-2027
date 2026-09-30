import { CardSkeleton, Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div>
      <Skeleton className="h-9 w-1/2 sm:h-11 sm:w-1/3" />
      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-6">
        <Skeleton className="aspect-[800/620] w-full rounded-[12px]" />
        <CardSkeleton count={2} />
      </div>
    </div>
  );
}
