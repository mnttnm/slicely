"use client";

import { Button } from "@/app/components/ui/button";
import { ChartDisplay } from "@/app/components/ui/chart-display";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/app/components/ui/collapsible";
import { SingleValueDisplay } from "@/app/components/ui/single-value-display";
import { TableDisplay } from "@/app/components/ui/table-display";
import { TextDisplay } from "@/app/components/ui/text-display";
import { LLMResponse } from "@/lib/openai";
import { FileText } from "lucide-react";
import { useState } from "react";

export const RenderLLMOutput = ({ output }: { output: LLMResponse }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!output || !output.formatted_response) {
    return <TextDisplay content={{ text: "Invalid or empty response" }} />;
  }

  const renderFormattedOutput = (formattedResponse: any) => {
    switch (formattedResponse.response_type) {
      case "single_value":
        return <SingleValueDisplay content={formattedResponse.content} />;
      case "chart":
        return <ChartDisplay content={formattedResponse.content} />;
      case "table":
        return <TableDisplay content={formattedResponse.content} />;
      case "text":
        return <TextDisplay content={formattedResponse.content} />;
      default:
        return <TextDisplay content={{ text: `Unsupported response type: ${formattedResponse.response_type}` }} />;
    }
  };

  return (
    <div className="relative w-full">
      <div className="w-full">
        {renderFormattedOutput(output.formatted_response)}
      </div>
      {output.raw_response && (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="absolute top-0 right-0"
            >
              <FileText className="h-4 w-4" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded w-full">
              <h4 className="text-sm font-semibold mb-2">Raw Response:</h4>
              <p className="text-xs">{output.raw_response}</p>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
};