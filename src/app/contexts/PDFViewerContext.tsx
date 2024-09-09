import { createContext, useContext, useState, ReactNode, useMemo, useCallback } from 'react';
import { pdfjs } from 'react-pdf';
import { createSlicer, getSignedPdfUrl } from '@/server/actions/studio/actions';
import { PageAnnotation, Rectangle, Slicer } from '../types';

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
  updatePageAnnotations: (rectangles: Rectangle[]) => void;
  onDocumentLoadSuccess: (data: { numPages: number }) => void;
  onPageRenderSuccess: (page: any) => void;
  previousPage: () => void;
  nextPage: () => void;
  toggleRectangleMode: () => void;
  fetchSignedPdfUrl: (url: string) => void;
  saveSlicer: () => void;
  slicer: Slicer;
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
  const [pageAnnotations, setPageAnnotations] = useState<PageAnnotation[]>([]);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
    if (pdfUrl) {
      pdfjs.getDocument(pdfUrl).promise.then(setPdfDocument);
    }
  }, [pdfUrl]);

  const slicerObject = useMemo(() => ({
    processing_rules: {
      annotations: pageAnnotations,
      skipped_pages: skippedPages
    },
    description: "Slicer for PDF",
    name: `Slicer: ${pdfUrl}`,
    user_id: "",
    output_mode: "text",
    llm_prompt: "Extract all text from the PDF.",
    webhook_url: "https://example.com/webhook",
  }), [pageAnnotations, skippedPages, pdfUrl]);

  const saveSlicer = useCallback(() => {
    console.log('Saving slicer:', slicerObject);
    createSlicer({
      ...slicerObject,
    });
  }, [slicerObject]);

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

  const updatePageAnnotations = useCallback((rectangles: Rectangle[]) => {
    console.log('rectangles', rectangles);
    // remove the annotation object if rectangles is empty
    if (rectangles.length === 0) {
      setPageAnnotations(prevAnnotations => {
        return prevAnnotations.filter(annotation => annotation.page !== pageNumber);
      });
    } else {
      setPageAnnotations(prevAnnotations => {
        const currentAnnotation = prevAnnotations.find(annotation => annotation.page === pageNumber);

        if (currentAnnotation) {
          return prevAnnotations.map(annotation => {
            if (annotation.page === pageNumber) {
              return {
                ...annotation,
                rectangles: rectangles
              };
            }
            return annotation;
          });
        }
        return [...prevAnnotations, {
          page: pageNumber,
          rectangles: rectangles
        }];
      });
    }
  }, [pageNumber]);

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
    saveSlicer,
    updatePageAnnotations,
    slicer: slicerObject
  }), [
    numPages, pageNumber, pageDimensions, isRectangleMode,
    pdfDocument, pdfUrl, skippedPages, togglePageSkip, onDocumentLoadSuccess,
    onPageRenderSuccess, previousPage, nextPage,
    toggleRectangleMode, fetchSignedPdfUrl, saveSlicer, updatePageAnnotations, slicerObject
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