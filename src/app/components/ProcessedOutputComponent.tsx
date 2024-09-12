import React from 'react';
import { ScrollArea } from "@/app/components/ui/scroll-area";

interface ProcessedOutputComponentProps {
  content: string;
}

const ProcessedOutputComponent: React.FC<ProcessedOutputComponentProps> = ({ content }) => {
  return (
    <ScrollArea className="h-full p-4">
      <div className="whitespace-pre-wrap">{content}</div>
    </ScrollArea>
  );
};

export default ProcessedOutputComponent;
