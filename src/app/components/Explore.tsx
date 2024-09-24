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
import { useToast } from "@/app/hooks/use-toast"

function ExploreContent({ slicerId }: { slicerId: string }) {
  const [mode, setMode] = useState<"search" | "chat">("search");
  const [query, setQuery] = useState("");
  const [showMetadata, setShowMetadata] = useState<string | null>(null);
  const [results, setResults] = useState<ProcessedOutputWithMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<{ role: string; content: string }[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const fetchResults = useCallback(async (searchQuery: string) => {
    setIsLoading(true);
    try {
      const { results: searchResults } = await searchOutputs(slicerId, searchQuery);
      setResults(searchResults);
    } catch (error) {
      console.error("Error fetching search results:", error);
    } finally {
      setIsLoading(false);
    }
  }, [slicerId]);

  const handleSearch = () => {
    if (query.trim()) {
      fetchResults(query);
    }
  };

  useEffect(() => {
    if (!query.trim()) {
      const fetchInitialOutputs = async () => {
        setIsLoading(true);
        try {
          const initialResults = await getInitialOutputs(slicerId);
          setResults(initialResults);
        } catch (error) {
          console.error("Error fetching initial outputs:", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchInitialOutputs();
    }
  }, [query, slicerId]);

  const handleChat = async () => {
    if (!query.trim()) return;

    const userMessage = { role: "user", content: query };
    setChatHistory((prev) => [...prev, userMessage]);
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
      setChatHistory((prev) => [...prev, botMessage]);

      // Update results with sources
      setResults(data.sources);
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
            />
          </div>
          <Button onClick={mode === "search" ? handleSearch : handleChat} disabled={!query.trim() || isLoading}>
            {mode === "search" ? "Search" : "Send"}
          </Button>
        </div>
      </header>
      <main className="flex-1 overflow-hidden flex">
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
          <div className="p-4 border-t">
            <div className="flex items-center space-x-2">
              <Input
                type="text"
                placeholder={mode === "search" ? "Search PDFs..." : "Ask a question..."}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1"
              />
              <Button onClick={mode === "search" ? handleSearch : handleChat} disabled={!query.trim() || isLoading}>
                {mode === "search" ? "Search" : "Send"}
              </Button>
            </div>
          </div>
        </div>
        <div className="w-1/3 border-l p-4">
          <h2 className="text-sm font-semibold mb-4">Related Documents ({results.length})</h2>
          <ScrollArea className="h-full">
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