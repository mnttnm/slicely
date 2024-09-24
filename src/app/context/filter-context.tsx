import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { ProcessedOutputWithMetadata } from "@/app/types";
import { getProcessedOutputForSlicer } from "@/server/actions/studio/actions";

interface FilterCounts {
  pdf_title: Record<string, number>;
  page_number: Record<number, number>;
}

interface ActiveFilters {
  pdf_title?: string;
  page_number?: number;
}

interface FilterContextProps {
  results: ProcessedOutputWithMetadata[];
  filterCounts: FilterCounts;
  activeFilters: ActiveFilters;
  setActiveFilters: React.Dispatch<React.SetStateAction<ActiveFilters>>;
  applyFilter: (type: "pdf_title" | "page_number", value: string | number) => void;
  clearFilter: (type: "pdf_title" | "page_number") => void;
  clearAllFilters: () => void;
}

const FilterContext = createContext<FilterContextProps | undefined>(undefined);

export function FilterProvider({ slicerID, children }: { slicerID: string; children: ReactNode }) {
  const [results, setResults] = useState<ProcessedOutputWithMetadata[]>([]);
  const [filterCounts, setFilterCounts] = useState<FilterCounts>({ pdf_title: {}, page_number: {} });
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({});

  useEffect(() => {
    const fetchData = async () => {
      const data = await getProcessedOutputForSlicer(slicerID);
      setResults(data);
      updateFilterCounts(data);
    };

    fetchData();
  }, [slicerID]);

  const updateFilterCounts = (data: ProcessedOutputWithMetadata[]) => {
    const counts: FilterCounts = { pdf_title: {}, page_number: {} };
    data.forEach((item) => {
      counts.pdf_title[item.pdfs.file_name] = (counts.pdf_title[item.pdfs.file_name] || 0) + 1;
      counts.page_number[item.page_number] = (counts.page_number[item.page_number] || 0) + 1;
    });
    setFilterCounts(counts);
  };

  const applyFilter = (type: "pdf_title" | "page_number", value: string | number) => {
    setActiveFilters((prev) => ({ ...prev, [type]: value }));
  };

  const clearFilter = (type: "pdf_title" | "page_number") => {
    setActiveFilters((prev) => {
      const newFilters = { ...prev };
      delete newFilters[type];
      return newFilters;
    });
  };

  const clearAllFilters = () => {
    setActiveFilters({});
  };

  return (
    <FilterContext.Provider
      value={{ results, filterCounts, activeFilters, setActiveFilters, applyFilter, clearFilter, clearAllFilters }}
    >
      {children}
    </FilterContext.Provider>
  );
}

export function useFilter() {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error("useFilter must be used within a FilterProvider");
  }
  return context;
}