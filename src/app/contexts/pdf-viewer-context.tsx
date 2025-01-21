"use client";
import { PageAnnotation, PageSelectionRule, ProcessingRules } from "@/app/types";
import { getSignedPdfUrl } from "@/server/actions/studio/actions";
import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";
import { pdfjs } from "react-pdf";

// pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerContextType {
  numPages: number | null;
  pageNumber: number;
  pageDimensions: { width: number; height: number } | null;
  isRectangleMode: boolean;
  pdfDocument: pdfjs.PDFDocumentProxy | null;
  pdfUrl: string | null;
  skippedPages: number[];
  togglePageSkip: (pageNumber: number) => void;
  onDocumentLoadSuccess: (document: pdfjs.PDFDocumentProxy) => void;
  onPageRenderSuccess: (page: any) => void;
  previousPage: () => void;
  nextPage: () => void;
  toggleRectangleMode: () => void;
  fetchSignedPdfUrl: (url: string) => void;
  clearAllPages: () => void;
  includeAllPages: () => void;
  excludeAllPages: () => void;
  jumpToPage: (page: number) => void;
  currentProcessingRules: ProcessingRules;
  updateProcessingRules: (newRules: Partial<ProcessingRules>) => void;
  addAnnotation: (annotation: PageAnnotation) => void;
  removeAnnotation: (page: number, rectId: string) => void;
}

export const PDFViewerContext = createContext<PDFViewerContextType | undefined>(undefined);

export const PDFViewerProvider = ({ children }: { children: ReactNode }) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageDimensions, setPageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [isRectangleMode, setIsRectangleMode] = useState(false);
  const [pdfDocument, setPdfDocument] = useState<pdfjs.PDFDocumentProxy | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [skippedPages, setSkippedPages] = useState<number[]>([]);
  const [currentProcessingRules, setCurrentProcessingRules] = useState<ProcessingRules>({
    annotations: [],
    pageSelection: {
      strategy: "include",
      rules: [{ type: "all" }],
    },
  });

  const onDocumentLoadSuccess = useCallback((document: pdfjs.PDFDocumentProxy) => {
    setPdfDocument(document);
    setNumPages(document.numPages);
    setPageNumber(1);
  }, []);

  const togglePageSkip = useCallback((pageNumber: number) => {
    setCurrentProcessingRules(prevRules => {
      const { strategy, rules } = prevRules.pageSelection;
      let newRules: PageSelectionRule[];
      let newStrategy = strategy;

      if (rules.length === 1 && rules[0].type === "all") {
        newRules = [{ type: "specific", pages: [pageNumber] }];
        newStrategy = strategy === "include" ? "exclude" : "include";
      } else {
        const specificRule = rules.find(rule => rule.type === "specific") as { type: "specific"; pages: number[] } | undefined;

        if (specificRule) {
          const newPages = specificRule.pages.includes(pageNumber)
            ? specificRule.pages.filter(p => p !== pageNumber)
            : [...specificRule.pages, pageNumber];

          if (newPages.length === 0) {
            newRules = [{ type: "all" }];
            newStrategy = strategy === "include" ? "exclude" : "include";
          } else {
            newRules = [{ type: "specific", pages: newPages }];
          }
        } else {
          newRules = [{ type: "specific", pages: [pageNumber] }];
        }
      }


      return {
        ...prevRules,
        pageSelection: {
          strategy: newStrategy,
          rules: newRules,
        },
      };
    });
  }, []);

  const onPageRenderSuccess = useCallback((page: any) => {
    const { width, height } = page.getViewport({ scale: 1 });
    setPageDimensions({ width, height });
  }, []);

  const changePage = useCallback((offset: number) => {
    setPageNumber((prevPageNumber) => prevPageNumber + offset);
  }, []);

  const previousPage = useCallback(() => changePage(-1), [changePage]);
  const nextPage = useCallback(() => changePage(1), [changePage]);

  const toggleRectangleMode = useCallback(() => {
    setIsRectangleMode((prevMode) => !prevMode);
  }, []);

  const fetchSignedPdfUrl = useCallback(async (url: string) => {
    try {
      const signedUrl = await getSignedPdfUrl(url);
      setPdfUrl(signedUrl);
    } catch (error) {
      console.error("Error fetching signed PDF URL:", error);
    }
  }, []);

  const updateProcessingRules = useCallback((newRules: Partial<ProcessingRules>) => {
    setCurrentProcessingRules(prevRules => ({ ...prevRules, ...newRules }));
  }, []);

  const addAnnotation = useCallback((annotation: PageAnnotation) => {
    setCurrentProcessingRules(prevRules => ({
      ...prevRules,
      annotations: [...prevRules.annotations, annotation],
    }));
  }, []);

  const removeAnnotation = useCallback((page: number, rectId: string) => {
    setCurrentProcessingRules(prevRules => ({
      ...prevRules,
      annotations: prevRules.annotations.map(ann =>
        ann.page === page
          ? { ...ann, rectangles: ann.rectangles.filter(rect => rect.id !== rectId) }
          : ann
      ).filter(ann => ann.rectangles.length > 0)
    }));
  }, []);

  const clearAllPages = useCallback(() => {
    updateProcessingRules({
      pageSelection: {
        strategy: "include",
        rules: [{ type: "all" }],
      },
    });
  }, [updateProcessingRules]);

  const includeAllPages = useCallback(() => {
    updateProcessingRules({
      pageSelection: {
        strategy: "include",
        rules: [{ type: "all" }],
      },
    });
  }, [updateProcessingRules]);

  const excludeAllPages = useCallback(() => {
    updateProcessingRules({
      pageSelection: {
        strategy: "exclude",
        rules: [{ type: "all" }],
      },
    });
  }, [updateProcessingRules]);

  const jumpToPage = useCallback((page: number) => {
    if (page > 0 && page <= (numPages || 0)) {
      setPageNumber(page);
    }
  }, [numPages]);

  const slicerObject = useMemo(() => ({
    numPages,
    pageNumber,
    pageDimensions,
    isRectangleMode,
    pdfDocument,
    pdfUrl,
    skippedPages,
  }), [numPages, pageNumber, pageDimensions, isRectangleMode, pdfDocument, pdfUrl, skippedPages]);

  const contextValue = useMemo(() => ({
    numPages,
    pageNumber,
    pageDimensions,
    isRectangleMode,
    pdfDocument,
    pdfUrl,
    skippedPages,
    togglePageSkip,
    onDocumentLoadSuccess,
    onPageRenderSuccess,
    previousPage,
    nextPage,
    toggleRectangleMode,
    fetchSignedPdfUrl,
    clearAllPages,
    includeAllPages,
    excludeAllPages,
    jumpToPage,
    currentProcessingRules,
    updateProcessingRules,
    addAnnotation,
    removeAnnotation,
    slicerObject
  }), [
    numPages, pageNumber, pageDimensions, isRectangleMode,
    pdfDocument, pdfUrl, skippedPages, togglePageSkip, onDocumentLoadSuccess,
    onPageRenderSuccess, previousPage, nextPage,
    toggleRectangleMode, fetchSignedPdfUrl,
    clearAllPages,
    includeAllPages,
    excludeAllPages,
    jumpToPage,
    currentProcessingRules,
    updateProcessingRules,
    addAnnotation,
    removeAnnotation,
    slicerObject
  ]);

  return (
    <PDFViewerContext.Provider value={contextValue}>
      {children}
    </PDFViewerContext.Provider>
  );
};

export const usePDFViewer = () => {
  const context = useContext(PDFViewerContext);
  if (context === undefined) {
    throw new Error("usePDFViewer must be used within a PDFViewerProvider");
  }
  return context;
};
