"use client";

import { Input } from "@/app/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Textarea } from "@/app/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/app/components/ui/tooltip";
import { toast, useToast } from "@/app/hooks/use-toast";
import { ExtractedText, LLMPrompt, Slicer } from "@/app/types";
import { updateSlicer } from "@/server/actions/studio/actions";
import { Eye, EyeOff, HelpCircle, Plus, X } from "lucide-react";
import { useState } from "react";

import { useAuth } from "@/app/hooks/use-auth";
import { usePDFViewer } from "../contexts/pdf-viewer-context";
import ExtractedTextView from "./extracted-text-view";
import { Alert, AlertDescription } from "./ui/alert";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Label } from "./ui/label";

interface SlicerRulesProps {
  slicerObject: Slicer;
  onUpdateSlicer: (slicer: Slicer) => void;
}

const LabelWithTooltip = ({ label, tooltip }: { label: string; tooltip: string }) => (
  <div className="flex items-center gap-1">
    <Label className="text-sm text-gray-400">{label}</Label>
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <HelpCircle className="h-4 w-4 text-gray-400" />
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs">{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </div>
);

const GeneralSettings: React.FC<{
  slicerObject: Slicer;
  onUpdateSlicer: (slicer: Slicer) => void;
}> = ({
  slicerObject,
  onUpdateSlicer,
}) => {
    const [showPassword, setShowPassword] = useState(false);
    const [passwordChanged, setPasswordChanged] = useState(false);
    const { isAuthenticated } = useAuth();

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!isAuthenticated) {
        toast({
          title: "Login Required",
          description: "Please login to change password.",
          variant: "destructive",
        });
        return;
      }
      onUpdateSlicer({ ...slicerObject, pdf_password: e.target.value });
      setPasswordChanged(true);
    };

    return (
      <div className="space-y-6">
        {!isAuthenticated && (
          <Alert variant="default" className="mb-4 bg-muted/50">
            <AlertDescription className="text-sm text-muted-foreground">
              You are in view-only mode. Sign in to make changes.
            </AlertDescription>
          </Alert>
        )}
        <div className="space-y-2">
          <LabelWithTooltip
            label="Name"
            tooltip="A unique name to identify your slicer"
          />
          <Input
            id="name"
            value={slicerObject.name}
            onChange={(e) => onUpdateSlicer({ ...slicerObject, name: e.target.value })}
            disabled={!isAuthenticated}
          />
        </div>
        <div className="space-y-2">
          <LabelWithTooltip
            label="Description"
            tooltip="A brief description of what this slicer does and what kind of data it processes"
          />
          <Textarea
            id="description"
            value={slicerObject.description || ""}
            onChange={(e) => onUpdateSlicer({ ...slicerObject, description: e.target.value })}
            disabled={!isAuthenticated}
          />
        </div>
        <div className="space-y-2">
          <LabelWithTooltip
            label="PDF Password"
            tooltip="If your PDF is password protected, enter the password here"
          />
          <div className="relative">
            <Input
              id="pdf_password"
              type={showPassword ? "text" : "password"}
              value={slicerObject.pdf_password || ""}
              onChange={handlePasswordChange}
              className="pr-10"
              disabled={!isAuthenticated}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
              disabled={!isAuthenticated}
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
        {isAuthenticated && (
          <Button onClick={() => {
            setPasswordChanged(false);
            updateSlicer(slicerObject.id, slicerObject);
          }} className="w-full">Save</Button>
        )}
      </div>
    );
  };

const SlicerRules: React.FC<SlicerRulesProps> = ({ slicerObject, onUpdateSlicer }) => {
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [newPrompt, setNewPrompt] = useState("");
  const { numPages, currentProcessingRules } = usePDFViewer();

  const saveSlicer = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please login to save changes.",
        variant: "destructive",
      });
      return;
    }

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
      {!isAuthenticated && (
        <Alert variant="default" className="mb-4 bg-muted/50">
          <AlertDescription className="text-sm text-muted-foreground">
            You are in view-only mode. Sign in to make changes.
          </AlertDescription>
        </Alert>
      )}
      <div className="flex-1 overflow-hidden">
        <Card className="h-full flex flex-col">
          <CardContent className="flex-1 overflow-y-auto">
            <div className="space-y-1 mt-2">
              <LabelWithTooltip
                label="Page Selection Strategy"
                tooltip="Choose whether to include or exclude specific pages from processing"
              />
              <p>{pageSelectionStrategy}</p>
            </div>
            <div className="space-y-1 mt-2">
              <LabelWithTooltip
                label={pageSelectionLabel()}
                tooltip="Selected pages that will be processed based on your strategy"
              />
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
              <LabelWithTooltip
                label="Annotations"
                tooltip="Areas of interest marked on the PDF pages for data extraction"
              />
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
              <LabelWithTooltip
                label="LLM Prompts"
                tooltip="Instructions for the AI to process the extracted text from annotations"
              />
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
                    disabled={!isAuthenticated}
                  />
                  {isAuthenticated && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLLMPrompt(prompt.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              {isAuthenticated && (
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
              )}
            </div>
            <PDFPrompts slicerObject={slicerObject} onUpdateSlicer={onUpdateSlicer} />
          </CardContent>
        </Card>
      </div>
      {isAuthenticated && (
        <div className="mt-2 bg-background border-t">
          <Button onClick={saveSlicer} className="w-full">
            Save
          </Button>
        </div>
      )}
    </div>
  );
};

const PDFPrompts: React.FC<SlicerRulesProps> = ({ slicerObject, onUpdateSlicer }) => {
  const [newPDFPrompt, setNewPDFPrompt] = useState("");
  const { isAuthenticated } = useAuth();

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
      <LabelWithTooltip
        label="PDF Prompts"
        tooltip="LLM instructions to be run on the content of each PDF page"
      />
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
            disabled={!isAuthenticated}
          />
          {isAuthenticated && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removePDFPrompt(prompt.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}
      {isAuthenticated && (
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
      )}
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