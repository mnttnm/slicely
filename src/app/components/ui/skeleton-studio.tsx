import { Skeleton } from "@/app/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/app/components/ui/tabs";

export function StudioSkeleton() {
  return (
    <div className="p-4 h-full overflow-hidden flex flex-col">
      <div className="flex justify-between items-center py-1">
        <Skeleton className="h-8 w-[100px]" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-[100px]" />
          <Skeleton className="h-9 w-[100px]" />
        </div>
      </div>

      <div className="w-full flex-1 flex flex-col overflow-hidden mt-4">
        <Tabs className="flex flex-col h-full">
          <TabsList className="self-start">
            <TabsTrigger value="slicers" disabled>Slicers</TabsTrigger>
            <TabsTrigger value="pdfs" disabled>Files</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-4 border rounded-lg">
              <Skeleton className="h-4 w-3/4 mb-4" />
              <Skeleton className="h-20 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 