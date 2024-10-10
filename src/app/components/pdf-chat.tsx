"use client";

import { Button } from "@/app/components/ui/button";
import ChatMessage from "@/app/components/ui/chat-message";
import { Input } from "@/app/components/ui/input";
import { LLMPrompt, PdfLLMOutput, PDFMetadata } from "@/app/types";
import { LLMResponse } from "@/lib/openai";
import { getLLMOutputForPdf, savePdfLLMOutput } from "@/server/actions/studio/actions";
import { createMessages, getContextForPdf, processWithLLM } from "@/utils/explore-utils";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { ArrowUpRight } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { RenderLLMOutput } from "./RenderLLMOutput";

interface PdfChatProps {
  linkedPdfs: PDFMetadata[];
  pdfPrompts: LLMPrompt[];
  slicerId: string;
}

const PdfChat = ({ linkedPdfs, pdfPrompts, slicerId }: PdfChatProps) => {
  const router = useRouter();
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
    const newOutputs: PdfLLMOutput[] = [];
    for await (const prompt of pdfPrompts) {
      const context = await getContextForPdf(pdfId);
      const messages = await createMessages(context, prompt.prompt);
      const llmResponse = await processWithLLM(messages);
      const newOutput: Omit<PdfLLMOutput, "id"> = {
        prompt_id: prompt.id,
        prompt: prompt.prompt,
        output: llmResponse as LLMResponse,
        pdf_id: pdfId,
        slicer_id: slicerId
      };
      const { output, ...savedOutput } = await savePdfLLMOutput(pdfId, slicerId, newOutput);

      // parse the output
      newOutputs.push({ ...savedOutput, output: output as LLMResponse });
    }
    setLlmOutputs(newOutputs);
  }, [pdfPrompts, slicerId]);

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
                  placeholder="Ask a question..."
                  className="flex-1"
                />
                <Button type="submit">Send</Button>
              </form>
              <div className="my-2">
                <div className="flex items-center mb-2 justify-between">
                  <h3 className="font-semibold text-md text-gray-500 mb-2 flex justify-between items-center">
                    Output
                  </h3>
                  <div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={refreshOutput}
                      className="mr-2"
                    >
                      Refresh
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsOutputCollapsed(!isOutputCollapsed)}
                    >
                      {isOutputCollapsed ? "Expand" : "Collapse"}
                    </Button>
                  </div>
                </div>
                {isLoading ? "Loading..." : (
                  !isOutputCollapsed &&
                  <ScrollArea className="space-y-4 h-[200px]">
                    {llmOutputs ? llmOutputs.map(output => (
                      <div key={output.id} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                        <h4 className="font-medium text-sm text-gray-600 dark:text-gray-400 mb-2">Prompt:</h4>
                        <p className="text-sm mb-4">{output.prompt}</p>
                        <h4 className="font-medium text-sm text-gray-600 dark:text-gray-400 mb-2">Output:</h4>
                        <RenderLLMOutput output={output.output} />
                      </div>
                    )) : "No output available."}
                  </ScrollArea  >
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