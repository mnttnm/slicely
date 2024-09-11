import { createContext, useContext, useState, ReactNode, useMemo, useCallback } from 'react';
import { pdfjs } from 'react-pdf';
import { getSignedPdfUrl } from '@/server/actions/studio/actions';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerContextType {
  numPages: number | null;
  pageNumber: number;
  pageDimensions: { width: number; height: number } | null;
  isRectangleMode: boolean;
  pdfDocument: pdfjs.PDFDocumentProxy | null;
  pdfUrl: string | null;
  skippedPages: number[];
  togglePageSkip: (pageNumber: number) => void;
  onDocumentLoadSuccess: (data: { numPages: number }) => void;
  onPageRenderSuccess: (page: any) => void;
  previousPage: () => void;
  nextPage: () => void;
  toggleRectangleMode: () => void;
  fetchSignedPdfUrl: (url: string) => void;
}

const PDFViewerContext = createContext<PDFViewerContextType | null>(null);

export const PDFViewerProvider = ({ children }: { children: ReactNode }) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageDimensions, setPageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [isRectangleMode, setIsRectangleMode] = useState(false);
  const [pdfDocument, setPdfDocument] = useState<pdfjs.PDFDocumentProxy | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [skippedPages, setSkippedPages] = useState<number[]>([]);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
    if (pdfUrl) {
      pdfjs.getDocument(pdfUrl).promise.then(setPdfDocument);
    }
  }, [pdfUrl]);

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
  }), [
    numPages, pageNumber, pageDimensions, isRectangleMode,
    pdfDocument, pdfUrl, skippedPages, togglePageSkip, onDocumentLoadSuccess,
    onPageRenderSuccess, previousPage, nextPage,
    toggleRectangleMode, fetchSignedPdfUrl
  ]);

  return (
    <PDFViewerContext.Provider value={contextValue}>
      {children}
    </PDFViewerContext.Provider>
  );
};

export const usePDFViewer = () => {
  const context = useContext(PDFViewerContext);
  if (!context) {
    throw new Error('usePDFViewer must be used within a PDFViewerProvider');
  }
  return context;
};