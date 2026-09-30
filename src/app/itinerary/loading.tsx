import { CardSkeleton, Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div>
      <Skeleton className="h-9 w-40" />
      <Skeleton className="mt-3 h-4 w-64 max-w-full" />
      <Skeleton className="mb-4 mt-4 h-[52px] w-full rounded-[12px] sm:w-64" />
      <CardSkeleton count={5} />
    </div>
  );
}
