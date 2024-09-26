'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import ExtractedTextView from './ExtractedTextView';
import { ExtractedText, Slicer } from '@/app/types';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { updateSlicer } from "@/server/actions/studio/actions";
import { useToast } from "@/app/hooks/use-toast";
import { Label } from './ui/label';
import { CardContent, CardHeader, CardTitle, Card } from './ui/card';

interface SlicerRulesProps {
  slicerObject: Slicer;
  onUpdateSlicer: (slicer: Slicer) => void;
}

const SlicerRules: React.FC<SlicerRulesProps> = ({ slicerObject, onUpdateSlicer }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [passwordChanged, setPasswordChanged] = useState(false);
  const { toast } = useToast();

  const saveSlicer = async () => {
    try {
      await updateSlicer(slicerObject.id, slicerObject);
      toast({
        title: "Slicer updated",
        description: "Your changes have been saved successfully.",
      });
      setPasswordChanged(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update slicer. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateSlicer({ ...slicerObject, pdf_password: e.target.value });
    setPasswordChanged(true);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-hidden">
        <Card className="h-full flex flex-col">
          <CardHeader className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700">
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
              <div className="space-y-2">
                <Label htmlFor="pdf_password">PDF Password</Label>
                <div className="relative">
                  <Input
                    id="pdf_password"
                    type={showPassword ? "text" : "password"}
                    value={slicerObject.pdf_password || ''}
                    onChange={handlePasswordChange}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {passwordChanged && (
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">
                    Password changed. Remember to save your changes.
                  </p>
                )}
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
  extractedTexts: ExtractedText[];
  slicerObject: Slicer;
  onUpdateSlicer: (slicer: Slicer) => void;
}

const SlicerSettings: React.FC<SlicerConfigProps> = ({ extractedTexts, slicerObject, onUpdateSlicer }) => {
  if (!slicerObject) {
    return <div>No data available</div>;
  }

  const transformedExtractedTexts: ExtractedText[] = extractedTexts.map(text => ({
    ...text,
    page_number: text.page_number,
    rectangle_info: text.rectangle_info
  }));

  return (
    <Tabs defaultValue="extracted" className="flex flex-col h-full pt-2 px-2">
      <TabsList className="flex-shrink-0 bg-transparent border-b border-gray-200 dark:border-gray-700">
        <TabsTrigger value="extracted">Extracted Text</TabsTrigger>
        <TabsTrigger value="config">Page Processing Rules</TabsTrigger>
      </TabsList>
      <TabsContent value="extracted" className="flex-1 overflow-hidden">
        <ExtractedTextView
          slicedTexts={transformedExtractedTexts}
          processingRules={slicerObject.processing_rules || {
            annotations: [],
            skipped_pages: []
          }}
        />
      </TabsContent>
      <TabsContent value="config" className="flex-1 overflow-hidden">
        <SlicerRules slicerObject={slicerObject} onUpdateSlicer={onUpdateSlicer} />
      </TabsContent>
    </Tabs>
  );
};

export default SlicerSettings;