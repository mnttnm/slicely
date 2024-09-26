'use client'
import { createContext, useContext, useState, ReactNode, useMemo, useCallback } from 'react';
import { pdfjs } from 'react-pdf';
import { getSignedPdfUrl } from '@/server/actions/studio/actions';

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

  const onDocumentLoadSuccess = useCallback((document: pdfjs.PDFDocumentProxy) => {
    setPdfDocument(document);
    setNumPages(document.numPages);
    setPageNumber(1);
  }, []);

  const togglePageSkip = useCallback((pageNumber: number) => {
    setSkippedPages(prevSkippedPages => {
      if (prevSkippedPages.includes(pageNumber)) {
        return prevSkippedPages.filter(page => page !== pageNumber);
      } else {
        return [...prevSkippedPages, pageNumber];
      }
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
      console.error('Error fetching signed PDF URL:', error);
    }
  }, []);

  const clearAllPages = useCallback(() => {
    // Implement clear all pages logic
  }, []);

  const includeAllPages = useCallback(() => {
    setSkippedPages([]);
  }, []);

  const excludeAllPages = useCallback(() => {
    if (numPages) {
      setSkippedPages(Array.from({ length: numPages }, (_, i) => i + 1));
    }
  }, [numPages]);

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
    throw new Error('usePDFViewer must be used within a PDFViewerProvider');
  }
  return context;
};
