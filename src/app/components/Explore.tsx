"use client";

import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Spinner } from "@/app/components/ui/spinner";
import { FilterProvider } from "@/app/context/filter-context";
import { useToast } from "@/app/hooks/use-toast";
import { LLMPrompt, PDFMetadata, ProcessedOutputWithMetadata, Slicer } from "@/app/types";
import { getInitialOutputs, getSlicerDetails, searchOutputs } from "@/server/actions/studio/actions";
import { createMessages, getContextForQuery, getContextForSlicer, processWithLLM } from "@/utils/explore-utils";
import { Info, MessageSquare, Search } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

function ExploreContent({ slicerId }: { slicerId: string }) {
  const [mode, setMode] = useState<"search" | "chat">("search");
  const [query, setQuery] = useState("");
  const [showMetadata, setShowMetadata] = useState<string | null>(null);
  const [results, setResults] = useState<ProcessedOutputWithMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<{ role: string; content: string }[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalResults, setTotalResults] = useState<number>(0);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [processedOutput, setProcessedOutput] = useState<{ id: string; output: string }[] | null>(null);
  const [slicer, setSlicer] = useState<Slicer | null>(null);
  const [linkedPdfs, setLinkedPdfs] = useState<PDFMetadata[]>([]);

  const fetchResults = useCallback(async (searchQuery: string, pageNum: number) => {
    setIsLoading(true);
    try {
      const { results: searchResults, total } = await searchOutputs(slicerId, searchQuery, pageNum);
      setResults((prevResults) => {
        if (pageNum === 1) {
          return searchResults;
        }
        setHasMore(prevResults.length + searchResults.length < total);
        return [...prevResults, ...searchResults];
      });
      setPage(pageNum);
      setTotalResults(total);
    } catch (error) {
      console.error("Error fetching search results:", error);
      setHasMore(false); // Set hasMore to false if there's an error
      toast({
        title: "Error",
        description: "Failed to fetch search results. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [slicerId, toast]);

  const fetchInitialOutputs = useCallback(async (pageNum = 1) => {
    setIsLoading(true);
    try {
      const { results: initialResults, total } = await getInitialOutputs(slicerId, pageNum);
      setResults((prevResults) => {
        if (pageNum === 1) {
          return initialResults;
        }
        setHasMore(prevResults.length + initialResults.length < total);
        return [...prevResults, ...initialResults];
      });
      setPage(pageNum);
      setTotalResults(total);
    } catch (error) {
      console.error("Error fetching initial outputs:", error);
      setHasMore(false); // Set hasMore to false if there's an error
      toast({
        title: "Error",
        description: "Failed to fetch initial outputs. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [slicerId, toast]);

  const handleSearch = useCallback(() => {
    if (query.trim()) {
      fetchResults(query, 1);
    }
  }, [query, fetchResults]);

  const handleLoadMore = useCallback(() => {
    if (hasMore && !isLoading) {
      if (query.trim()) {
        fetchResults(query, page + 1);
      } else {
        fetchInitialOutputs(page + 1);
      }
    }
  }, [hasMore, isLoading, query, page, fetchResults, fetchInitialOutputs]);

  useEffect(() => {
    if (!query.trim() && mode === "search") {
      fetchInitialOutputs();
    }
  }, [query, mode, fetchInitialOutputs]);

  const processInitialOutputs = useCallback(async () => {
    if (!slicer) return;
    setIsLoading(true);
    try {
      console.log("Processing initial outputs for slicer:", slicerId);
      const context = await getContextForSlicer(slicerId);
      console.log("Context retrieved:", `${context.substring(0, 100)}...`);

      const processedOutputs = await Promise.all(slicer.llm_prompts.map(async (promptObj: LLMPrompt) => {
        const messages = await createMessages(context, promptObj.prompt);
        console.log("Messages created for prompt:", promptObj.id);
        const result = await processWithLLM(messages);
        return { id: promptObj.id, output: result };
      }));

      console.log("Processed results:", processedOutputs);
      setProcessedOutput(processedOutputs);
    } catch (error) {
      console.error("Error processing initial outputs:", error);
      toast({
        title: "Error",
        description: "Failed to process initial outputs. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [slicerId, slicer, toast]);

  const handleChat = async () => {
    if (!query.trim() || !slicer) return;

    const userMessage = { role: "user", content: query };
    setChatHistory(prev => [...prev, userMessage]);
    setQuery("");
    setIsLoading(true);

    try {
      console.log("Fetching context for query:", query, "slicerId:", slicerId);
      const context = await getContextForQuery(query, slicerId);
      console.log("Context received:", context);
      if (context === "No relevant information found.") {
        throw new Error("No relevant information found");
      }
      const messages = await createMessages(context, "Answer the following question based on the provided context:", query);
      console.log("Messages created:", JSON.stringify(messages, null, 2));
      const answer = await processWithLLM(messages);
      console.log("LLM answer received:", answer);
      const botMessage = { role: "assistant", content: answer };
      setChatHistory(prev => [...prev, botMessage]);
    } catch (error) {
      console.error("Error in chat:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      const botMessage = { role: "assistant", content: `I'm sorry, but an error occurred: ${errorMessage}` };
      setChatHistory(prev => [...prev, botMessage]);
      toast({
        title: "Error",
        description: "Failed to get a response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const fetchSlicerDetails = useCallback(async () => {
    try {
      const result = await getSlicerDetails(slicerId);
      if (result) {
        setSlicer(result.slicerDetails);
        setLinkedPdfs(result.linkedPdfs);
      } else {
        throw new Error("Failed to fetch slicer details");
      }
    } catch (error) {
      console.error("Error fetching slicer details:", error);
      toast({
        title: "Error",
        description: "Failed to fetch slicer details. Please try again.",
        variant: "destructive",
      });
    }
  }, [slicerId, toast]);

  useEffect(() => {
    fetchSlicerDetails();
  }, [fetchSlicerDetails]);

  useEffect(() => {
    if (slicer && mode === "chat") {
      processInitialOutputs();
    }
  }, [slicer, processInitialOutputs, mode]);

  useEffect(() => {
    console.log("Processed output updated:", processedOutput);
  }, [processedOutput]);

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      <header className="flex items-center justify-between w-full p-4">
        <div className="flex items-center space-x-2 w-full">
          <div className="flex-1 flex items-center border rounded-lg overflow-hidden">
            <div className="flex border-r">
              <Button
                variant="ghost"
                className={`rounded-none ${mode === "search" ? "bg-muted" : ""}`}
                onClick={() => {
                  setMode("search");
                }}
              >
                <Search className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                className={`rounded-none ${mode === "chat" ? "bg-muted" : ""}`}
                onClick={() => {
                  setMode("chat");
                }}
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
            </div>
            <Input
              type="text"
              placeholder={mode === "search" ? "Search PDFs..." : "Ask a question..."}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 border-none focus-visible:ring-0 focus-visible:ring-offset-0"
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  mode === "search" ? handleSearch() : handleChat();
                }
              }}
            />
          </div>
          <Button onClick={mode === "search" ? handleSearch : handleChat} disabled={!query.trim() || isLoading}>
            {mode === "search" ? "Search" : "Send"}
          </Button>
        </div>
      </header>
      <main className="flex-1 overflow-hidden flex">
        <div className="flex-1 flex flex-col">
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {isLoading && (
                <div className="flex justify-center items-center py-4">
                  <Spinner />
                  <span className="ml-2">Processing outputs...</span>
                </div>
              )}
              {processedOutput && (
                <div className="space-y-4">
                  {processedOutput.map((output) => (
                    <div key={output.id} className="p-4 border rounded-lg border-gray-300 dark:border-gray-700">
                      <h3 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-2">
                        Processed Output for Prompt {output.id}
                      </h3>
                      <p className="text-sm text-gray-800 dark:text-gray-200">{output.output}</p>
                    </div>
                  ))}
                </div>
              )}
              {mode === "chat" ? (
                // Render chat history
                <div className="space-y-4">
                  {chatHistory.map((message, index) => (
                    <div
                      key={index}
                      className={`p-2 rounded-lg ${message.role === "user" ? "bg-primary text-primary-foreground ml-auto" : "bg-muted"
                        }`}
                    >
                      {message.content}
                    </div>
                  ))}
                </div>
              ) : (
                // Render search results
                <>
                  {results.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      Showing {results.length} out of {totalResults} results
                    </p>
                  )}
                  {results.map((result) => (
                    <div key={result.id} className="p-4 border rounded-lg border-gray-300 dark:border-gray-700">
                      <div className="flex justify-between items-center">
                        <h3 className="text-md font-medium text-gray-900 dark:text-gray-100">
                          {result.pdfs.file_name} - Page {result.page_number}
                        </h3>
                        <Button
                          variant="ghost"
                          className="text-xs text-muted-foreground"
                          onClick={() => setShowMetadata(showMetadata === result.id ? null : result.id)}
                        >
                          <Info className="h-4 w-4" />
                        </Button>
                      </div>
                      {result.updated_at && (
                        <p className="text-xs text-muted-foreground mb-2">
                          Updated: {new Date(result.updated_at).toLocaleString()}
                        </p>
                      )}
                      {showMetadata === result.id && (
                        <div className="text-xs text-muted-foreground mb-2">
                          <p>Type: {result.section_info.type}</p>
                          {Object.entries(result.section_info.metadata).map(([key, value]) => (
                            <p key={key}>
                              {key}: {JSON.stringify(value)}
                            </p>
                          ))}
                        </div>
                      )}
                      <p className="text-sm mb-2 text-gray-800 dark:text-gray-200">{result.text_content}</p>
                    </div>
                  ))}
                  {hasMore && !isLoading && (
                    <div className="flex justify-center">
                      <Button onClick={handleLoadMore}>Load More</Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </ScrollArea>
        </div>
      </main>
    </div>
  );
}

export default function Explore({ slicerId }: { slicerId: string }) {
  if (!slicerId) {
    return <div>Error: No slicer ID provided</div>;
  }

  return (
    <FilterProvider slicerID={slicerId}>
      <ExploreContent slicerId={slicerId} />
    </FilterProvider>
  );
}