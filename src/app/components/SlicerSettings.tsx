'use client';

import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import ExtractedTextView from './ExtractedTextView';
import { ProcessingRules, RectangleText, Slicer } from '@/app/types';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";

interface SlicerRulesProps {
  slicerObject: Slicer;
  onUpdateSlicer: (slicer: Slicer) => void;
  saveSlicer: () => void;
}

import { Label } from "@/app/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card";

const SlicerRules: React.FC<SlicerRulesProps> = ({ slicerObject, onUpdateSlicer, saveSlicer }) => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-hidden">
        <Card className="h-full flex flex-col">
          <CardHeader className="flex-shrink-0">
            <CardTitle className="text-lg font-medium">Processing Rules</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={slicerObject.name}
                  onChange={(e) => onUpdateSlicer({ ...slicerObject, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Skipped Pages</Label>
                <p className="max-h-20 overflow-y-auto">
                  {slicerObject.processing_rules?.skipped_pages?.join(', ')}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Annotations</Label>
                <div className="max-h-40 overflow-y-auto">
                  {slicerObject.processing_rules?.annotations.map((annotation, index) => (
                    <div key={index} className="flex items-center space-x-2 mb-2">
                      <span>{`page ${annotation.page}: `}</span>
                      <span>{annotation.rectangles.map(rect => `${rect.top},${rect.left},${rect.width},${rect.height}`).join(' ')}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={slicerObject.description || ''}
                  onChange={(e) => onUpdateSlicer({ ...slicerObject, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="llm_prompt">LLM Prompt</Label>
                <Textarea
                  id="llm_prompt"
                  value={slicerObject.llm_prompt || ''}
                  onChange={(e) => onUpdateSlicer({ ...slicerObject, llm_prompt: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="output_mode">Output Mode</Label>
                <Input
                  id="output_mode"
                  value={slicerObject.output_mode || ''}
                  onChange={(e) => onUpdateSlicer({ ...slicerObject, output_mode: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="mt-2 bg-background border-t">
        <Button onClick={saveSlicer} className="w-full">
          Save
        </Button>
      </div>
    </div>
  );
};

interface SlicerConfigProps {
  extractedTexts: RectangleText[];
  slicerObject: Slicer;
  onUpdateSlicer: (slicer: Slicer) => void;
}

const SlicerSettings: React.FC<SlicerConfigProps> = ({ extractedTexts, slicerObject, onUpdateSlicer }) => {
  const saveSlicer = () => {
    onUpdateSlicer(slicerObject);
  };

  if (!slicerObject) {
    return <div>No data available</div>;
  }

  return (
    <div className="flex-1 w-1/2 bg-gray-200 dark:bg-gray-900 border-l border-gray-600">
      <Tabs defaultValue="extracted" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="extracted">Extracted Text</TabsTrigger>
          <TabsTrigger value="config">Page Processing Rules</TabsTrigger>
        </TabsList>
        <TabsContent value="extracted" className="px-2">
          <ExtractedTextView slicedTexts={extractedTexts} processingRules={slicerObject.processing_rules ?? null} />
        </TabsContent>
        <TabsContent value="config" className="px-2 space-y-4">
          <SlicerRules slicerObject={slicerObject} onUpdateSlicer={onUpdateSlicer} saveSlicer={saveSlicer} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SlicerSettings;