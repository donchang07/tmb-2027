import { CardSkeleton, Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div>
      <Skeleton className="h-9 w-2/3 sm:h-11 sm:w-1/2" />
      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] lg:gap-5">
        <Skeleton className="h-96 w-full rounded-[12px]" />
        <CardSkeleton count={2} />
      </div>
    </div>
  );
}
