"use client";

import { Input } from "@/app/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Textarea } from "@/app/components/ui/textarea";
import { useToast } from "@/app/hooks/use-toast";
import { ExtractedText, LLMPrompt, Slicer } from "@/app/types";
import { updateSlicer } from "@/server/actions/studio/actions";
import { Eye, EyeOff, Plus, X } from "lucide-react";
import { useState } from "react";

import { usePDFViewer } from "../contexts/pdf-viewer-context";
import ExtractedTextView from "./extracted-text-view";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Label } from "./ui/label";

interface SlicerRulesProps {
  slicerObject: Slicer;
  onUpdateSlicer: (slicer: Slicer) => void;
}

const GeneralSettings: React.FC<{
  slicerObject: Slicer;
  onUpdateSlicer: (slicer: Slicer) => void;
}> = ({
  slicerObject,
  onUpdateSlicer,
}) => {
    const [showPassword, setShowPassword] = useState(false);
    const [passwordChanged, setPasswordChanged] = useState(false);

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onUpdateSlicer({ ...slicerObject, pdf_password: e.target.value });
      setPasswordChanged(true);
    };

    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm text-gray-400">Name</Label>
          <Input
            id="name"
            value={slicerObject.name}
            onChange={(e) => onUpdateSlicer({ ...slicerObject, name: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm text-gray-400">Description</Label>
          <Textarea
            id="description"
            value={slicerObject.description || ""}
            onChange={(e) => onUpdateSlicer({ ...slicerObject, description: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pdf_password" className="text-sm text-gray-400">PDF Password</Label>
          <div className="relative">
            <Input
              id="pdf_password"
              type={showPassword ? "text" : "password"}
              value={slicerObject.pdf_password || ""}
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
          <Button onClick={() => {
            setPasswordChanged(false);
            updateSlicer(slicerObject.id, slicerObject);
          }} className="w-full">Save</Button>
        </div>
      </div>
    );
  };

const SlicerRules: React.FC<SlicerRulesProps> = ({ slicerObject, onUpdateSlicer }) => {
  const { toast } = useToast();
  const [newPrompt, setNewPrompt] = useState("");
  const { numPages, currentProcessingRules } = usePDFViewer();

  const saveSlicer = async () => {
    try {
      await updateSlicer(slicerObject.id, slicerObject);
      toast({
        title: "Slicer updated",
        description: "Your changes have been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update slicer. Please try again.",
        variant: "destructive",
      });
    }
  };

  const addLLMPrompt = () => {
    if (newPrompt.trim()) {
      const updatedPrompts: LLMPrompt[] = [
        ...(slicerObject.llm_prompts || []),
        { id: crypto.randomUUID(), prompt: newPrompt.trim() }
      ];
      onUpdateSlicer({ ...slicerObject, llm_prompts: updatedPrompts });
      setNewPrompt("");
    }
  };

  const removeLLMPrompt = (id: string) => {
    const updatedPrompts = slicerObject.llm_prompts.filter(prompt => prompt.id !== id);
    onUpdateSlicer({ ...slicerObject, llm_prompts: updatedPrompts });
  };

  if (!numPages) {
    throw new Error("No pages found");
  }

  const pageSelectionStrategy = currentProcessingRules.pageSelection.strategy;

  const pageSelectionLabel = () => {
    const { strategy, rules } = currentProcessingRules.pageSelection;
    if (rules.length === 1 && rules[0].type === "all") {
      return strategy === "include" ? "Include All Pages" : "Exclude All Pages";
    }
    const specificRule = rules.find(rule => rule.type === "specific") as { type: "specific"; pages: number[] } | undefined;
    if (specificRule) {
      return `${strategy === "include" ? "Include" : "Exclude"} ${specificRule.pages.length} Pages`;
    }
    return "Unknown Selection";
  };

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex-1 overflow-hidden">
        <Card className="h-full flex flex-col">
          <CardContent className="flex-1 overflow-y-auto">
            <div className="space-y-1 mt-2">
              <Label className="text-sm text-gray-400">Page Selection Strategy</Label>
              <p>{pageSelectionStrategy}</p>
            </div>
            <div className="space-y-1 mt-2">
              <Label className="text-sm text-gray-400">{pageSelectionLabel()}</Label>
              <div className="max-h-20 overflow-y-auto">
                {currentProcessingRules.pageSelection.rules.map((rule, index) => (
                  <div key={index}>
                    {rule.type === "all" && "All Pages"}
                    {rule.type === "specific" && `Pages ${rule.pages.join(", ")}`}
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-1 mt-2">
              <Label className="text-sm text-gray-400">Annotations</Label>
              <div className="max-h-40 overflow-y-auto">
                {currentProcessingRules.annotations.map((annotation, index) => (
                  <div key={index} className="flex items-center space-x-2 mb-2">
                    <span>{`page ${annotation.page}: `}</span>
                    <span>{annotation.rectangles.map(rect => `${rect.top},${rect.left},${rect.width},${rect.height}`).join(" ")}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-1 mt-2">
              <Label className="text-sm text-gray-400">LLM Prompts</Label>
              {slicerObject.llm_prompts?.map((prompt, index) => (
                <div key={prompt.id} className="flex items-center space-x-2">
                  <Textarea
                    value={prompt.prompt}
                    onChange={(e) => {
                      const updatedPrompts = [...slicerObject.llm_prompts];
                      updatedPrompts[index].prompt = e.target.value;
                      onUpdateSlicer({ ...slicerObject, llm_prompts: updatedPrompts });
                    }}
                    className="flex-grow"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeLLMPrompt(prompt.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <div className="flex items-center space-x-2">
                <Textarea
                  value={newPrompt}
                  onChange={(e) => setNewPrompt(e.target.value)}
                  placeholder="Enter a new LLM prompt"
                  className="flex-grow"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={addLLMPrompt}
                  disabled={!newPrompt.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <PDFPrompts slicerObject={slicerObject} onUpdateSlicer={onUpdateSlicer} />
            {/* <div className="space-y-1 mt-2">
              <Label htmlFor="output_mode" className="text-sm text-gray-400">Output Mode</Label>
              <Input
                id="output_mode"
                value={slicerObject.output_mode || ""}
                onChange={(e) => onUpdateSlicer({ ...slicerObject, output_mode: e.target.value })}
              />
            </div> */}
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

const PDFPrompts: React.FC<SlicerRulesProps> = ({ slicerObject, onUpdateSlicer }) => {
  const [newPDFPrompt, setNewPDFPrompt] = useState("");

  const addPDFPrompt = () => {
    if (newPDFPrompt.trim()) {
      const updatedPDFPrompts: LLMPrompt[] = [
        ...(slicerObject.pdf_prompts || []),
        { id: crypto.randomUUID(), prompt: newPDFPrompt.trim() }
      ];
      onUpdateSlicer({ ...slicerObject, pdf_prompts: updatedPDFPrompts });
      setNewPDFPrompt("");
    }
  };

  const removePDFPrompt = (id: string) => {
    const updatedPDFPrompts = slicerObject.pdf_prompts.filter(prompt => prompt.id !== id);
    onUpdateSlicer({ ...slicerObject, pdf_prompts: updatedPDFPrompts });
  };

  return (
    <div className="space-y-2 mt-2">
      <Label className="text-sm text-gray-400">PDF Prompts</Label>
      {slicerObject.pdf_prompts?.map((prompt) => (
        <div key={prompt.id} className="flex items-center space-x-2">
          <Textarea
            value={prompt.prompt}
            onChange={(e) => {
              const updatedPDFPrompts = [...slicerObject.pdf_prompts];
              updatedPDFPrompts.find(p => p.id === prompt.id)!.prompt = e.target.value;
              onUpdateSlicer({ ...slicerObject, pdf_prompts: updatedPDFPrompts });
            }}
            className="flex-grow"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => removePDFPrompt(prompt.id)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <div className="flex items-center space-x-2">
        <Textarea
          value={newPDFPrompt}
          onChange={(e) => setNewPDFPrompt(e.target.value)}
          placeholder="Enter a new PDF prompt"
          className="flex-grow"
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={addPDFPrompt}
          disabled={!newPDFPrompt.trim()}
        >
          <Plus className="h-4 w-4" />
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
    <Tabs defaultValue="extracted" className="flex flex-col h-full pt-2 px-2 items-start w-full">
      <TabsList className="flex-shrink-0 bg-transparent border-b border-gray-200 dark:border-gray-700 w-full">
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="extracted">Page Content</TabsTrigger>
        <TabsTrigger value="config">Processing Rules</TabsTrigger>
      </TabsList>
      <TabsContent value="extracted" className="flex-1 overflow-hidden w-full">
        <ExtractedTextView
          slicedTexts={transformedExtractedTexts}
          processingRules={slicerObject.processing_rules || {
            annotations: [],
            skipped_pages: []
          }}
        />
      </TabsContent>
      <TabsContent value="config" className="flex-1 overflow-hidden w-full">
        <SlicerRules slicerObject={slicerObject} onUpdateSlicer={onUpdateSlicer} />
      </TabsContent>
      <TabsContent value="general" className="flex-1 overflow-hidden w-full">
        <GeneralSettings
          slicerObject={slicerObject}
          onUpdateSlicer={onUpdateSlicer}
        />
      </TabsContent>
    </Tabs>
  );
};

export default SlicerSettings;