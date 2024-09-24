"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { MessageSquare, Search, Info } from "lucide-react";
import { FilterProvider } from "@/app/context/filter-context";
import { searchOutputs, getInitialOutputs } from "@/server/actions/studio/actions";
import { ProcessedOutputWithMetadata } from "@/app/types";
import { Spinner } from "@/app/components/ui/spinner";

function ExploreContent({ slicerId }: { slicerId: string }) {
  const [mode, setMode] = useState<"search" | "chat">("search");
  const [query, setQuery] = useState("");
  const [showMetadata, setShowMetadata] = useState<string | null>(null);
  const [results, setResults] = useState<ProcessedOutputWithMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  const fetchResults = useCallback(async (searchQuery: string, pageNum: number) => {
    setIsLoading(true);
    try {
      const { results: searchResults, total } = await searchOutputs(slicerId, searchQuery, pageNum);
      setResults(prevResults => pageNum === 1 ? searchResults : [...prevResults, ...searchResults]);
      setTotalResults(total);
    } catch (error) {
      console.error("Error fetching search results:", error);
    } finally {
      setIsLoading(false);
    }
  }, [slicerId]);

  const handleSearch = () => {
    if (query.trim()) {
      setPage(1);
      fetchResults(query, 1);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      handleSearch();
    }
  };

  useEffect(() => {
    if (!query.trim()) {
      const fetchInitialOutputs = async () => {
        setIsLoading(true);
        try {
          const initialResults = await getInitialOutputs(slicerId);
          setResults(initialResults);
          setTotalResults(initialResults.length);
        } catch (error) {
          console.error("Error fetching initial outputs:", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchInitialOutputs();
    }
  }, [query, slicerId]);

  const handleLoadMore = () => {
    if (!isLoading && results.length < totalResults) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchResults(query, nextPage);
    }
  };

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
              onKeyDown={handleKeyDown}
              className="flex-1 border-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          <Button onClick={handleSearch} disabled={!query.trim()}>
            {mode === "search" ? "Search" : "Ask"}
          </Button>
        </div>
      </header>
      <main className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-4">
            <h2 className="text-sm font-semibold">Search Results ({totalResults})</h2>
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
            {!isLoading && results.length < totalResults && (
              <Button onClick={handleLoadMore} className="w-full">
                Load More
              </Button>
            )}
          </div>
        </ScrollArea>
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