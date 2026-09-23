import { CardSkeleton, Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div>
      <Skeleton className="h-8 w-1/3" />
      <div className="mt-4">
        <CardSkeleton count={4} />
      </div>
    </div>
  );
}
