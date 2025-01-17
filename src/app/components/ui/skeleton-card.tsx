import { Card, CardContent, CardHeader } from "@/app/components/ui/card";
import { Skeleton } from "@/app/components/ui/skeleton";

export function SkeletonCard() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-[200px]" />
        <Skeleton className="h-9 w-[70px]" />
      </CardHeader>
      <CardContent className="pb-6">
        <Skeleton className="h-16 w-full" />
      </CardContent>
    </Card>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="flex h-full">
      <div className="w-16 flex-shrink-0 h-full">
        <div className="flex flex-col items-center py-4 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-px w-8" />
          ))}
        </div>
      </div>
      <div className="flex-grow p-4">
        <div className="grid grid-cols-1 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    </div>
  );
} 