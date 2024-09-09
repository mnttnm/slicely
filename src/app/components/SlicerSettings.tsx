'use client';

import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import ExtractedTextList from './ExtractedTextList';
import { Slicer, SlicerConfigProps } from '@/app/types';
import { Button } from './ui/button';
import { usePDFViewer } from '../contexts/PDFViewerContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";

interface SlicerRulesProps {
  slicerObject: Slicer;
  onUpdateSlicer: (slicer: Slicer) => void;
  saveSlicer: () => void;
}

const SlicerRules: React.FC<SlicerRulesProps> = ({ slicerObject, onUpdateSlicer, saveSlicer }) => {
  return (
    <div>
      <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
      <Input
        id="name"
        value={slicerObject.name}
        onChange={(e) => onUpdateSlicer({ ...slicerObject, name: e.target.value })}
      />
      <div className="border p-4 rounded-md">
        <h3 className="text-lg font-semibold mb-2">Processing Rules</h3>
        <div className="space-y-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">Skipped Pages</label>
            {slicerObject.processing_rules?.skipped_pages?.join(', ')}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Annotations</label>
            {slicerObject.processing_rules?.annotations.map((annotation, index) => (
              <div key={index} className="flex items-center space-x-2">
                <span>{`page ${annotation.page}: `}</span>
                <span>{annotation.rectangles.map(rect => `${rect.top},${rect.left},${rect.width},${rect.height}`).join(' ')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
        <Textarea
          id="description"
          value={slicerObject.description || ''}
          onChange={(e) => onUpdateSlicer({ ...slicerObject, description: e.target.value })}
        />
      </div>
      <div>
        <label htmlFor="llm_prompt" className="block text-sm font-medium text-gray-700">LLM Prompt</label>
        <Textarea
          id="llm_prompt"
          value={slicerObject.llm_prompt || ''}
          onChange={(e) => onUpdateSlicer({ ...slicerObject, llm_prompt: e.target.value })}
        />
      </div>
      <div>
        <label htmlFor="output_mode" className="block text-sm font-medium text-gray-700">Output Mode</label>
        <Input
          id="output_mode"
          value={slicerObject.output_mode || ''}
          onChange={(e) => onUpdateSlicer({ ...slicerObject, output_mode: e.target.value })}
        />
      </div>
      <div className="flex justify-end">
        <Button onClick={() => saveSlicer()}>Save</Button>
      </div>
    </div >
  );
};

const SlicerSettings: React.FC<SlicerConfigProps> = ({ extractedTexts, onUpdateSlicer }) => {
  const { slicer: slicerObject, saveSlicer } = usePDFViewer();
  return (
    <div className="flex-1 w-1/2 h-full bg-gray-200 border-l border-gray-800">
      <Tabs defaultValue="extracted" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="extracted">Extracted Text</TabsTrigger>
          <TabsTrigger value="config">Page Processing Rules</TabsTrigger>
        </TabsList>
        <TabsContent value="extracted" className="px-2">
          <ExtractedTextList extractedTexts={extractedTexts} />
        </TabsContent>
        <TabsContent value="config" className="px-2 space-y-4">
          <SlicerRules slicerObject={slicerObject} onUpdateSlicer={onUpdateSlicer} saveSlicer={saveSlicer} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SlicerSettings;
