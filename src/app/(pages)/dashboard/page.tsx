"use client";

import { RenderLLMOutput } from "@/app/components/RenderLLMOutput";
import { SlicerNavigation } from "@/app/components/slicer-navigation";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Separator } from "@/app/components/ui/separator";
import { SlicerLLMOutput } from "@/app/types";
import { getAllSlicersLLMOutput } from "@/server/actions/dashboard/actions";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

function DashboardContent() {
  const [allSlicersOutput, setAllSlicersOutput] = useState<{ [slicerId: string]: { name: string; outputs: SlicerLLMOutput[]; lastProcessed: string } }>({});
  const [activeSlicer, setActiveSlicer] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const data = await getAllSlicersLLMOutput();
      setAllSlicersOutput(data);
      if (Object.keys(data).length > 0) {
        setActiveSlicer(Object.keys(data)[0]);
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
          {sortedSlicers.map(([slicerId, { name, outputs }]) => (
            <Card key={slicerId} className="w-full" id={slicerId}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">{name}</CardTitle>
                <Link href={`/studio/slicers/${slicerId}?tab=explore`} passHref>
                  <Button variant="outline" size="sm">
                    Explore
                  </Button>
                </Link>
              </CardHeader>
              <Separator className="mb-4" />
              <CardContent>
                {outputs.map((output: SlicerLLMOutput) => (
                  <div key={output.id} className="mb-4 w-full">
                    <h3 className="text-sm font-medium mb-2">{output.prompt}</h3>
                    <RenderLLMOutput output={output.output} />
                  </div>
                ))}
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
      <DashboardContent />
    </div>
  );
}