"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { MessageSquare, Search, X } from "lucide-react";
import { ProcessedOutput } from "@/app/types";
type FilterCounts = {
  pdf_title: { [key: string]: number };
  page_number: { [key: number]: number };
};

export default function Explore() {
  const [mode, setMode] = useState<"search" | "chat">("search")
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<ProcessedOutput[]>([])
  const [filterCounts, setFilterCounts] = useState<FilterCounts>({ pdf_title: {}, page_number: {} })
  const [activeFilters, setActiveFilters] = useState<{ pdf_title?: string; page_number?: number }>({})

  useEffect(() => {
    // Simulated initial data
    const initialData: ProcessedOutput[] = [
      {
        id: "initial1",
        pdf_id: "pdf001",
        pdf_title: "Introduction to AI",
        slicer_id: "slicer001",
        page_number: 1,
        section_info: {
          type: "full_page",
          metadata: {
            title: "Welcome to PDF Search",
            author: "System",
          },
        },
        text_content: "Welcome to the PDF Search Interface. This tool allows you to search through multiple PDFs quickly and efficiently. Use the search bar above to get started.",
      },
    ]
    setResults(initialData)
    updateFilterCounts(initialData)
  }, [])

  const handleSearch = () => {
    // Simulated search results
    const searchResults: ProcessedOutput[] = [
      {
        id: "result1",
        pdf_id: "pdf002",
        pdf_title: "Machine Learning Basics",
        slicer_id: "slicer002",
        page_number: 5,
        section_info: {
          type: "llm_output",
          metadata: {
            confidence: 0.95,
            model: "GPT-4",
          },
        },
        text_content: "Machine learning is a subset of artificial intelligence that focuses on the development of algorithms and statistical models that enable computer systems to improve their performance on a specific task through experience.",
        created_at: "2023-09-15T10:30:00Z",
      },
      {
        id: "result2",
        pdf_id: "pdf003",
        pdf_title: "Deep Learning Fundamentals",
        slicer_id: "slicer003",
        page_number: 12,
        section_info: {
          type: "annotation_output",
          metadata: {
            annotator: "Jane Smith",
            category: "Definition",
          },
        },
        text_content: "Deep learning is part of a broader family of machine learning methods based on artificial neural networks with representation learning.",
        updated_at: "2023-09-20T14:45:00Z",
      },
      {
        id: "result3",
        pdf_id: "pdf002",
        pdf_title: "Machine Learning Basics",
        slicer_id: "slicer004",
        page_number: 8,
        section_info: {
          type: "llm_output",
          metadata: {
            confidence: 0.92,
            model: "GPT-4",
          },
        },
        text_content: "Supervised learning is a type of machine learning where the algorithm learns from labeled training data, making predictions or decisions without being explicitly programmed to do so.",
        created_at: "2023-09-16T11:20:00Z",
      },
    ]
    setResults(searchResults)
    updateFilterCounts(searchResults)
  }

  const updateFilterCounts = (data: ProcessedOutput[]) => {
    const counts: FilterCounts = { pdf_title: {}, page_number: {} }
    data.forEach((item) => {
      counts.pdf_title[item.pdf_title] = (counts.pdf_title[item.pdf_title] || 0) + 1
      counts.page_number[item.page_number] = (counts.page_number[item.page_number] || 0) + 1
    })
    setFilterCounts(counts)
  }

  const applyFilter = (type: 'pdf_title' | 'page_number', value: string | number) => {
    setActiveFilters(prev => ({ ...prev, [type]: value }))
  }

  const clearFilter = (type: 'pdf_title' | 'page_number') => {
    setActiveFilters(prev => {
      const newFilters = { ...prev }
      delete newFilters[type]
      return newFilters
    })
  }

  const clearAllFilters = () => {
    setActiveFilters({})
  }

  const filteredResults = results.filter(result =>
    (!activeFilters.pdf_title || result.pdf_title === activeFilters.pdf_title) &&
    (!activeFilters.page_number || result.page_number === activeFilters.page_number)
  )

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <header className="flex items-center justify-between p-4 border-b">
        <h1 className="text-2xl font-bold">PDF Search Interface</h1>
      </header>
      <main className="flex-1 p-4 flex flex-col">
        <div className="flex items-center space-x-2 mb-4">
          <div className="flex-1 flex items-center border rounded-lg overflow-hidden">
            <div className="flex border-r">
              <Button
                variant="ghost"
                className={`rounded-none ${mode === 'search' ? 'bg-muted' : ''}`}
                onClick={() => setMode("search")}
              >
                <Search className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                className={`rounded-none ${mode === 'chat' ? 'bg-muted' : ''}`}
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
        {(activeFilters.pdf_title || activeFilters.page_number) && (
          <div className="flex items-center space-x-2 mb-4">
            <div className="flex flex-wrap gap-2">
              {activeFilters.pdf_title && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary text-primary-foreground">
                  PDF: {activeFilters.pdf_title}
                  <button onClick={() => clearFilter('pdf_title')} className="ml-1 focus:outline-none">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {activeFilters.page_number && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                  Page: {activeFilters.page_number}
                  <button onClick={() => clearFilter('page_number')} className="ml-1 focus:outline-none">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={clearAllFilters}>
              Clear All Filters
            </Button>
          </div>
        )}
        <div className="flex-1 flex space-x-4">
          <div className="w-1/3 border rounded-lg p-4 flex flex-col">
            <h2 className="text-lg font-semibold mb-2">Filters & Metadata</h2>
            <ScrollArea className="flex-1">
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">PDF Title</h3>
                  {Object.entries(filterCounts.pdf_title).map(([title, count]) => (
                    <div key={title} className="flex items-center mb-1">
                      <div
                        className="h-4 bg-primary cursor-pointer"
                        style={{ width: `${(count / Math.max(...Object.values(filterCounts.pdf_title))) * 100}%` }}
                        onClick={() => applyFilter('pdf_title', title)}
                      ></div>
                      <span className="ml-2 text-sm">{title} ({count})</span>
                    </div>
                  ))}
                </div>
                <div>
                  <h3 className="font-medium mb-2">Page Number</h3>
                  {Object.entries(filterCounts.page_number).map(([page, count]) => (
                    <div key={page} className="flex items-center mb-1">
                      <div
                        className="h-4 bg-secondary cursor-pointer"
                        style={{ width: `${(count / Math.max(...Object.values(filterCounts.page_number))) * 100}%` }}
                        onClick={() => applyFilter('page_number', Number(page))}
                      ></div>
                      <span className="ml-2 text-sm">Page {page} ({count})</span>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollArea>
          </div>
          <div className="flex-1 border rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-2">Search Results</h2>
            <ScrollArea className="h-[calc(100vh-200px)]">
              {filteredResults.map((result) => (
                <div key={result.id} className="mb-4 p-4 border rounded">
                  <h3 className="text-lg font-medium mb-2">{result.pdf_title} - Page {result.page_number}</h3>
                  <p className="text-sm mb-2">{result.text_content}</p>
                  <div className="text-xs text-muted-foreground">
                    <p>Type: {result.section_info.type}</p>
                    {Object.entries(result.section_info.metadata).map(([key, value]) => (
                      <p key={key}>{key}: {value}</p>
                    ))}
                    {result.created_at && <p>Created: {new Date(result.created_at).toLocaleString()}</p>}
                    {result.updated_at && <p>Updated: {new Date(result.updated_at).toLocaleString()}</p>}
                  </div>
                </div>
              ))}
            </ScrollArea>
          </div>
        </div>
      </main>
    </div>
  )
}