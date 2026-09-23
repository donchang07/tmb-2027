import { CardSkeleton, Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div>
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="mt-6 h-96 w-full" />
      <div className="mt-6">
        <CardSkeleton count={2} />
      </div>
    </div>
  );
}
