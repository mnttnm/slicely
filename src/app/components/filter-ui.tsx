import React from "react";
import { Button } from "@/app/components/ui/button";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { X } from "lucide-react";
import { FilterCounts, ActiveFilters } from "@/app/types";

interface FilterUIProps {
  filterCounts: FilterCounts;
  activeFilters: ActiveFilters;
  applyFilter: (type: "pdf_title" | "page_number", value: string | number) => void;
  clearFilter: (type: "pdf_title" | "page_number") => void;
  clearAllFilters: () => void;
}

export function FilterUI({
  filterCounts,
  activeFilters,
  applyFilter,
  clearFilter,
  clearAllFilters,
}: FilterUIProps) {
  return (
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
                  onClick={() => applyFilter("pdf_title", title)}
                ></div>
                <span className="ml-2 text-sm">
                  {title} ({count})
                </span>
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
                  onClick={() => applyFilter("page_number", parseInt(page as string, 10))}
                ></div>
                <span className="ml-2 text-sm">
                  Page {page} ({count})
                </span>
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>
      {(activeFilters.pdf_title || activeFilters.page_number) && (
        <div className="flex items-center space-x-2 mb-4">
          <div className="flex flex-wrap gap-2">
            {activeFilters.pdf_title && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary text-primary-foreground">
                PDF: {activeFilters.pdf_title}
                <button onClick={() => clearFilter("pdf_title")} className="ml-1 focus:outline-none">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {activeFilters.page_number && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                Page: {activeFilters.page_number}
                <button onClick={() => clearFilter("page_number")} className="ml-1 focus:outline-none">
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
    </div>
  );
}