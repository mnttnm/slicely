"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { MessageSquare, Search, Info } from "lucide-react";
import { FilterProvider } from "@/app/context/filter-context";
import { searchOutputs, getInitialOutputs } from "@/server/actions/studio/actions";
import { ProcessedOutputWithMetadata } from "@/app/types";
import { Spinner } from "@/app/components/ui/spinner";
import { useToast } from "@/app/hooks/use-toast";

function ExploreContent({ slicerId }: { slicerId: string }) {
  const [mode, setMode] = useState<"search" | "chat">("chat");
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

  const handleChat = async () => {
    if (!query.trim()) return;

    const userMessage = { role: "user", content: query };
    setChatHistory(prev => [...prev, userMessage]);
    setQuery("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: query, slicerId }),
      });

      if (!response.ok) {
        throw new Error("Failed to get chat response");
      }

      const data = await response.json();
      const botMessage = { role: "assistant", content: data.answer };
      setChatHistory(prev => [...prev, botMessage]);
    } catch (error) {
      console.error("Error in chat:", error);
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

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      <header className="flex items-center justify-between w-full p-4">
        <div className="flex items-center space-x-2 w-full">
          <div className="flex-1 flex items-center border rounded-lg overflow-hidden">
            <div className="flex border-r">
              <Button
                variant="ghost"
                className={`rounded-none ${mode === "search" ? "bg-muted" : ""}`}
                onClick={() => setMode("search")}
              >
                <Search className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                className={`rounded-none ${mode === "chat" ? "bg-muted" : ""}`}
                onClick={() => setMode("chat")}
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
        {mode === "chat" ? (
          <div className="flex-1 flex flex-col">
            <ScrollArea className="flex-1" ref={chatContainerRef}>
              <div className="p-4 space-y-4">
                {chatHistory.map((message, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded-lg ${message.role === "user" ? "bg-primary text-primary-foreground ml-auto" : "bg-muted"
                    }`}
                  >
                    {message.content}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-center items-center py-4">
                    <Spinner />
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-4">
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
                  {isLoading && (
                    <div className="flex justify-center items-center py-4">
                      <Spinner />
                    </div>
                  )}
                  {hasMore && !isLoading && (
                    <div className="flex justify-center">
                      <Button onClick={handleLoadMore}>Load More</Button>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
        )}
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