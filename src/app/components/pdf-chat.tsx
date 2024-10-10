"use client";

import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { LLMPrompt, PDFMetadata, SlicerLLMOutput } from "@/app/types";
import { createMessages, getContextForPdf, processWithLLM } from "@/utils/explore-utils";
import { useEffect, useState } from "react";
import { RenderLLMOutput } from "./RenderLLMOutput";
import ChatMessage from "./ui/chat-message";

interface PdfChatProps {
  linkedPdfs: PDFMetadata[];
  pdf_prompts: LLMPrompt[];
}

const PdfChat = ({ linkedPdfs, pdf_prompts }: PdfChatProps) => {
  const [selectedPdfIndex, setSelectedPdfIndex] = useState<number>(0);
  const [llmOutputs, setLlmOutputs] = useState<SlicerLLMOutput[] | null>(null);
  const [query, setQuery] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: string; content: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchLlmOutput = async (pdfId: string) => {
      setIsLoading(true);
      try {
        for await (const prompt of pdf_prompts) {
          // const output = await getLLMOutputForPdf(pdfId, prompt);
          console.log("Processing initial outputs for pdf: ", pdfId);
          const context = await getContextForPdf(pdfId);
          const messages = await createMessages(context, prompt.prompt);
          console.log("Messages created for pdf: ", JSON.stringify(messages, null, 2));
          const result = await processWithLLM(messages);
          setLlmOutputs(prev => [...(prev || []), { id: prompt.id, prompt_id: prompt.id, prompt: prompt.prompt, output: result }]);
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
  }, [selectedPdfIndex, pdf_prompts, linkedPdfs]);


  const handlePdfSelect = (index: number) => {
    setSelectedPdfIndex(index);
    setLlmOutputs(null);
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

  return (
    <div className="flex h-full">
      <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 p-4">
        <h2 className="text-lg font-semibold">Linked PDFs</h2>
        <ul className="space-y-2">
          {linkedPdfs.map((pdf, index) => (
            <li
              key={pdf.id}
              className={`p-2 rounded hover:bg-gray-200 cursor-pointer ${selectedPdfIndex === index ? "bg-gray-300" : ""}`}
              onClick={() => handlePdfSelect(index)}
            >
              <div className="flex justify-between">
                <span>{pdf.file_name}</span>
                <span>{pdf.file_processing_status === "processed" ? "✅" : "⏳"}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex-1 p-4">
        {selectedPdfIndex !== null ? (
          <>
            <h2 className="text-lg font-semibold">{linkedPdfs[selectedPdfIndex].file_name}</h2>
            {isLoading ? (
              <div>Loading LLM output...</div>
            ) : (
              <div>
                <form onSubmit={handleChatSubmit} className="flex space-x-2 my-4">
                  <Input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask a question..."
                    className="flex-1"
                  />
                  <Button type="submit">Send</Button>
                </form>
                <div className="mt-4">
                  {chatHistory.map((msg, index) => (
                    <ChatMessage key={index} role={msg.role} content={msg.content} />
                  ))}
                </div>
                <div className="my-4">
                  <h3 className="font-semibold text-md text-gray-500">LLM Output:</h3>
                  <div className="space-y-4">{llmOutputs ? llmOutputs.map(output => {
                    return <RenderLLMOutput key={output.id} output={output.output} />;
                  }) : "No output available."}</div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div>Select a PDF to view details.</div>
        )}
      </div>
    </div>
  );
};

export default PdfChat;