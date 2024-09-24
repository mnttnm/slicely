"use client";

import React, { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { MessageSquare, Search, Info } from "lucide-react";
import { FilterProvider, useFilter } from "@/app/context/filter-context";

function ExploreContent() {
  const [mode, setMode] = useState<"search" | "chat">("search");
  const [query, setQuery] = useState("");
  const [showMetadata, setShowMetadata] = useState<string | null>(null);
  const { results } = useFilter();

  const handleSearch = () => {
    // Implement search functionality here
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
              className="flex-1 border-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          <Button onClick={handleSearch}>{mode === "search" ? "Search" : "Ask"}</Button>
        </div>
      </header>
      <main className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-4">
            <h2 className="text-sm font-semibold">Search Results ({results.length})</h2>
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
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}

export default function Explore({ slicerID }: { slicerID: string }) {
  return (
    <FilterProvider slicerID={slicerID}>
      <ExploreContent />
    </FilterProvider>
  );
}