"use client";

import { RenderLLMOutput } from "@/app/components/render-llm-output";
import { Button } from "@/app/components/ui/button";
import ChatMessage from "@/app/components/ui/chat-message";
import { Input } from "@/app/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/app/components/ui/tooltip";
import { useApiKey } from "@/app/hooks/use-api-key";
import { useToast } from "@/app/hooks/use-toast";
import { useUser } from "@/app/hooks/use-user";
import { LLMPrompt, PdfLLMOutput, PDFMetadata } from "@/app/types";
import { LLMResponse } from "@/lib/openai";
import { getLLMOutputForPdf, savePdfLLMOutput } from "@/server/actions/studio/actions";
import { createMessages, getContextForPdf, processWithLLM } from "@/utils/explore-utils";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { ArrowUpRight, MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Card } from "./ui/card";

interface PdfChatProps {
  linkedPdfs: PDFMetadata[];
  pdfPrompts: LLMPrompt[];
  slicerId: string;
  isReadOnly?: boolean;
}

const PdfChat = ({ linkedPdfs, pdfPrompts, slicerId, isReadOnly }: PdfChatProps) => {
  const router = useRouter();
  const { apiKey } = useApiKey();
  const { toast } = useToast();
  const { user } = useUser();
  const [selectedPdfIndex, setSelectedPdfIndex] = useState<number>(0);
  const [llmOutputs, setLlmOutputs] = useState<PdfLLMOutput[] | null>(null);
  const [query, setQuery] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: string; content: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOutputCollapsed, setIsOutputCollapsed] = useState(false);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    setIsOutputCollapsed(chatHistory.length > 0);
  }, [chatHistory]);

  const fetchFreshLLmOutputs = useCallback(async (pdfId: string) => {
    if (!pdfPrompts || pdfPrompts.length === 0) return;

    if (!apiKey) {
      toast({
        title: "API Key Required",
        description: "Please configure your OpenAI API key in settings.",
        variant: "destructive",
      });
      return;
    }

    const newOutputs: PdfLLMOutput[] = [];
    for await (const prompt of pdfPrompts) {
      const context = await getContextForPdf(pdfId);
      const messages = await createMessages(context, prompt.prompt);
      const llmResponse = await processWithLLM(messages, apiKey);
      const newOutput: Omit<PdfLLMOutput, "id"> = {
        prompt_id: prompt.id,
        prompt: prompt.prompt,
        output: llmResponse as LLMResponse,
        pdf_id: pdfId,
        slicer_id: slicerId,
      };
      const { output, ...savedOutput } = await savePdfLLMOutput(pdfId, slicerId, newOutput);

      // parse the output
      newOutputs.push({ ...savedOutput, output: output as LLMResponse });
    }
    setLlmOutputs(newOutputs);
  }, [pdfPrompts, slicerId, apiKey]);

  useEffect(() => {
    const fetchLlmOutput = async (pdfId: string) => {
      setIsLoading(true);
      try {
        const existingOutputs = await getLLMOutputForPdf(pdfId, slicerId);
        if (existingOutputs && existingOutputs.length > 0) {
          setLlmOutputs(existingOutputs);
        } else {
          await fetchFreshLLmOutputs(pdfId);
        }
      } catch (error) {
        console.error("Error fetching LLM output:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (selectedPdfIndex !== null) {
      fetchLlmOutput(linkedPdfs[selectedPdfIndex].id);
    }
  }, [selectedPdfIndex, linkedPdfs, slicerId, pdfPrompts, fetchFreshLLmOutputs]);

  const handlePdfSelect = (index: number) => {
    setSelectedPdfIndex(index);
    setLlmOutputs(null);
  };

  const handlePdfNavigate = (pdfId: string) => {
    router.push(`/studio/pdfs/${pdfId}`);
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || selectedPdfIndex === null) return;

    const userMessage = { role: "user", content: query };
    setChatHistory(prev => [...prev, userMessage]);
    setQuery("");

    // Simulate bot response
    const botMessage = { role: "assistant", content: `Response for "${query}" on PDF: ${linkedPdfs[selectedPdfIndex].file_name}` };
    setChatHistory(prev => [...prev, botMessage]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const currentIndex = selectedPdfIndex;
      const newIndex = e.key === "ArrowUp"
        ? Math.max(0, currentIndex - 1)
        : Math.min(linkedPdfs.length - 1, currentIndex + 1);
      setSelectedPdfIndex(newIndex);

      const listItems = listRef.current?.children;
      if (listItems && listItems[newIndex]) {
        listItems[newIndex].scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  };

  const refreshOutput = async () => {
    if (selectedPdfIndex !== null) {
      setIsLoading(true);
      try {
        await fetchFreshLLmOutputs(linkedPdfs[selectedPdfIndex].id);
      } catch (error) {
        console.error("Error refreshing LLM output:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const EmptyState = ({ isReadOnly = false, user }: { isReadOnly?: boolean; user: any }) => (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="p-3 bg-muted rounded-full mb-4">
        <MessageSquare className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium mb-2">No Prompts Configured</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-4">
        {isReadOnly
          ? "This is a demo slicer. Create your own slicer to add prompts and analyze PDFs."
          : user
            ? "Add PDF prompts in the slicer settings to analyze PDFs and get AI-powered insights."
            : "Sign in to configure prompts and start analyzing your PDFs."}
      </p>
      {user && !isReadOnly && (
        <Button variant="outline" onClick={() => router.push(`/studio/slicers/${slicerId}/settings`)}>
          Configure Prompts
        </Button>
      )}
    </div>
  );

  return (
    <div className="flex h-full">
      <div className="border-r border-gray-200 dark:border-gray-700 p-4">
        <h2 className="text-lg text-gray-600 dark:text-gray-400 mb-2">
          Linked PDFs ({linkedPdfs.length})
        </h2>
        <ScrollArea className="h-[calc(100vh-10rem)]">
          <ul className="space-y-2" ref={listRef} onKeyDown={handleKeyDown}>
            {linkedPdfs.map((pdf, index) => (
              <li
                key={pdf.id}
                className={`p-2 rounded cursor-pointer transition-colors duration-200
                ${selectedPdfIndex === index
                    ? "bg-gray-200 dark:bg-gray-700"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800"} flex items-center justify-between`}
                onClick={() => handlePdfSelect(index)}
                tabIndex={0}
              >
                <div className="flex flex-col">
                  <span className="truncate font-medium">{pdf.file_name}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {pdf.file_processing_status === "processed" ? "Processed" : "Processing..."}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePdfNavigate(pdf.id);
                  }}
                >
                  View <ArrowUpRight className="w-4 h-4 ml-2" />
                </Button>
              </li>
            ))}
          </ul>
        </ScrollArea>
      </div>
      <div className="flex-1 p-4">
        {selectedPdfIndex !== null ? (
          <>
            <h2 className="text-lg font-semibold mb-4">{linkedPdfs[selectedPdfIndex].file_name}</h2>
            <div className="flex flex-col h-full">
              <form onSubmit={handleChatSubmit} className="flex space-x-2 my-2">
                <Input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={isReadOnly ? "Demo mode - Chat disabled" : user ? "Ask a question..." : "Please login to chat"}
                  className="flex-1"
                  disabled={!user || isReadOnly}
                />
                <Button type="submit" disabled={!user || isReadOnly}>Send</Button>
              </form>
              <div className="my-2">
                <div className="flex items-center mb-2 justify-between">
                  <h3 className="font-semibold text-md text-gray-500 mb-2 flex justify-between items-center">
                    Output
                  </h3>
                  <div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={refreshOutput}
                              className="mr-2"
                              disabled={!user || isReadOnly}
                            >
                              Refresh
                            </Button>
                          </div>
                        </TooltipTrigger>
                        {isReadOnly && (
                          <TooltipContent>
                            <p>This is a demo slicer. Create your own slicer to use this feature.</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                    {llmOutputs && llmOutputs.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsOutputCollapsed(!isOutputCollapsed)}
                      >
                        {isOutputCollapsed ? "Expand" : "Collapse"}
                      </Button>
                    )}
                  </div>
                </div>
                {isLoading ? "Loading..." : (
                  !isOutputCollapsed &&
                  <ScrollArea className="space-y-4 h-[200px]">
                    {llmOutputs ? (
                      llmOutputs.length > 0 ? (
                        llmOutputs.map(output => (
                          <Card key={output.id} className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                            <h4 className="font-medium text-sm text-gray-600 dark:text-gray-400 mb-2">Prompt:</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4" title={output.prompt}>{output.prompt.substring(0, 120)}...</p>
                            <h4 className="font-medium text-sm text-gray-600 dark:text-gray-400 mb-2">Output:</h4>
                            <RenderLLMOutput output={output.output} />
                          </Card>
                        ))
                      ) : (
                        <EmptyState isReadOnly={isReadOnly} user={user} />
                      )
                    ) : (
                      <EmptyState isReadOnly={isReadOnly} user={user} />
                    )}
                  </ScrollArea>
                )}
              </div>
              <div className="overflow-y-auto flex-1 py-2">
                {chatHistory.map((msg, index) => (
                  <ChatMessage key={index} role={msg.role} content={msg.content} />
                ))}
              </div>
            </div>
          </>
        ) : (
          <div>Select a PDF to view details.</div>
        )}
      </div>
    </div>
  );
};

export default PdfChat;