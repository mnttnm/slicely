"use client";

import { RenderLLMOutput } from "@/app/components/render-llm-output";
import { SlicerNavigation } from "@/app/components/slicer-navigation";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { EmptyPlaceholder } from "@/app/components/ui/empty-placeholder";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { DashboardSkeleton } from "@/app/components/ui/skeleton-card";
import { SlicerLLMOutput } from "@/app/types";
import { getAllSlicersLLMOutput } from "@/server/actions/dashboard/actions";
import Link from "next/link";
import { Suspense, useCallback, useEffect, useState } from "react";

function DashboardContent() {
  const [allSlicersOutput, setAllSlicersOutput] = useState<{
    [slicerId: string]: {
      name: string;
      description?: string;
      outputs: SlicerLLMOutput[];
      lastProcessed: string
    }
  }>({});
  const [activeSlicer, setActiveSlicer] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getAllSlicersLLMOutput();
        setAllSlicersOutput(data);
        if (Object.keys(data).length > 0) {
          setActiveSlicer(Object.keys(data)[0]);
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSlicerSelect = useCallback((slicerId: string) => {
    setActiveSlicer(slicerId);
    const element = document.getElementById(slicerId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  const sortedSlicers = Object.entries(allSlicersOutput).sort((a, b) =>
    new Date(b[1].lastProcessed).getTime() - new Date(a[1].lastProcessed).getTime()
  );

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (sortedSlicers.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <EmptyPlaceholder
          title="No Processed Data Available"
          description="Your dashboard will display processed PDF data from your slicers. To get started, create a slicer and process your PDFs in the Studio."
          icon="📊"
        >
          <Link href="/studio" passHref>
            <Button>Go to Studio</Button>
          </Link>
        </EmptyPlaceholder>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <div className="w-16 flex-shrink-0 h-full">
        <SlicerNavigation
          slicers={sortedSlicers.map(([id, { name }]) => ({ id, name }))}
          activeSlicer={activeSlicer}
          onSlicerSelect={handleSlicerSelect}
        />
      </div>
      <ScrollArea className="flex-grow">
        <div className="grid grid-cols-1 gap-4 p-4">
          {sortedSlicers.map(([slicerId, { name, description, outputs }]) => (
            <Card key={slicerId} className="w-full shadow-sm hover:shadow-md transition-shadow" id={slicerId}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b">
                <CardTitle className="text-lg font-medium capitalize">{name}</CardTitle>
                <Link href={`/studio/slicers/${slicerId}?tab=explore`} passHref>
                  <Button variant="outline" size="sm">
                    Explore
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="pt-4">
                {description && (
                  <p className="text-sm text-muted-foreground mb-6">{description}</p>
                )}
                <div className="space-y-6">
                  {outputs.map((output: SlicerLLMOutput) => (
                    <div key={output.id} className="w-full bg-muted/30 rounded-lg p-4">
                      <h3 className="text-sm mb-3 text-muted-foreground font-medium">{output.prompt}</h3>
                      <RenderLLMOutput output={output.output} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="h-screen overflow-hidden">
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}