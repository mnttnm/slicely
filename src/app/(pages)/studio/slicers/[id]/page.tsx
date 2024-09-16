'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import PDFViewer from '@/app/components/PDFViewer';
import { PDFViewerProvider } from '@/app/contexts/PDFViewerContext';
import SlicerSettings from '@/app/components/SlicerSettings';
import { Slicer, ProcessingRules, ExtractedText, FabricRect } from '@/app/types';
import { getSlicerDetails } from '@/server/actions/studio/actions';
import { useTextExtraction } from '@/app/hooks/useTextExtraction';
import { pdfjs } from "react-pdf";

const SlicerPage = () => {
  const { id } = useParams();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [slicer, setSlicer] = useState<Slicer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [extractedTexts, setExtractedTexts] = useState<ExtractedText[]>([]);
  const [processingRules, setProcessingRules] = useState<ProcessingRules>({
    annotations: [],
    skipped_pages: []
  });
  const [pdfDocument, setPdfDocument] = useState<pdfjs.PDFDocumentProxy | null>(null);
  const [skippedPages, setSkippedPages] = useState<number[]>([]);
  const transformSlicerDetails = (slicerDetails: any): Slicer => {
    return {
      ...slicerDetails,
      processing_rules: slicerDetails.processing_rules as ProcessingRules,
      skipped_pages: slicerDetails.processing_rules?.skipped_pages || []
    };
  };

  const { extractTextFromRectangle } = useTextExtraction(pdfDocument);

  useEffect(() => {
    const fetchSlicerDetails = async () => {
      if (!id || typeof id !== 'string') return;

      setIsLoading(true);
      setError(null);

      try {
        const result = await getSlicerDetails(id);
        if (result) {
          const { slicerDetails, pdfUrl } = result;
          setSlicer(transformSlicerDetails(slicerDetails));
          setPdfUrl(pdfUrl);
        }
      } catch (err) {
        console.error('Error fetching slicer:', err);
        setError('Failed to fetch slicer details. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSlicerDetails();
  }, [id]);

  const updateSlicerDetails = useCallback((updatedSlicer: Partial<Slicer>) => {
    setSlicer(prev => {
      if (!prev) return null;
      return {
        ...prev,
        ...updatedSlicer,
        processing_rules: {
          annotations: processingRules?.annotations || [],
          skipped_pages: skippedPages
        }
      };
    });
  }, [processingRules, skippedPages]);

  const onRectangleUpdate = useCallback(async (operation: "add" | "remove", payload: { id: string, rect?: FabricRect, pageNumber?: number }) => {
    if (operation === "add") {
      if (!payload.pageNumber || !payload.rect) return;
      // Correctly search for page annotations and add the new rectangle to the existing one
      setProcessingRules((prev) => {
        if (!prev) {
          return {
            annotations: [
              {
                page: payload.pageNumber!,
                rectangles: [payload.rect!]
              }
            ],
            skipped_pages: []
          };
        } else {
          const pageAnnotation = prev.annotations.find(annotation => annotation.page === payload.pageNumber);
          if (pageAnnotation) {
            const updatedRectangles = [...pageAnnotation.rectangles, payload.rect!];
            return {
              ...prev,
              annotations: prev.annotations.map(annotation => annotation.page === payload.pageNumber ? {
                ...annotation,
                rectangles: updatedRectangles
              } : annotation)
            };
          } else {
            return {
              ...prev,
              annotations: [...prev.annotations, {
                page: payload.pageNumber!,
                rectangles: [payload.rect!]
              }]
            };
          }
        }

      });

      // set the extracted text for the page
      const extractedText = await extractTextFromRectangle(payload.rect, payload.pageNumber);

      const newExtractedText: ExtractedText = {
        id: payload.id,
        pageNumber: payload.pageNumber,
        text: extractedText || '',
        rectangleInfo: payload.rect
      };

      setExtractedTexts(prev => {
        if (!prev) return [];
        return [...prev, newExtractedText];
      });

      // After updating processingRules and extractedTexts
      // Remove this line: updateSlicerDetails({});
    } else if (operation === "remove") {
      if (!payload.pageNumber || !payload.id) return;
      // Correctly search for and remove the annotation with the specified id
      setProcessingRules(prev => {
        if (!prev) {
          return {
            annotations: [],
            skipped_pages: []
          };
        } else {
          return {
            ...prev,
            annotations: prev.annotations.map(annotation => annotation.page === payload.pageNumber ? {
              ...annotation,
              rectangles: annotation.rectangles.filter(rect => rect.id !== payload.id)
            } : annotation)
          };
        }
      });

      // remove the extracted text for the page
      setExtractedTexts(prev => prev.filter(text => text.id !== payload.id && text.pageNumber !== payload.pageNumber));
    }
  }, [extractTextFromRectangle]);

  const onClearPage = useCallback((pageNumber: number) => {
    // check if the annotation for the page number exists in processing rules
    setProcessingRules(prev => {
      return {
        ...prev,
        annotations: prev.annotations.filter(annotation => annotation.page !== pageNumber)
      };
    });
    setExtractedTexts(prev => prev.filter(text => text.pageNumber !== pageNumber));

    // Remove this line: updateSlicerDetails({});
  }, []);

  const onClearAllPages = useCallback(() => {
    setExtractedTexts([]);
    setProcessingRules(
      {
        annotations: [],
        skipped_pages: []
      }
    );
    setSlicer(prev => prev ? {
      ...prev, processing_rules: {
        annotations: [],
        skipped_pages: prev.processing_rules?.skipped_pages || []
      }
    } : null);
  }, []);

  const onPageExclude = useCallback((pageNumber: number) => {
    if (!pdfDocument) return;
    setSkippedPages(prev => {
      const newSkippedPages = [...prev, pageNumber];
      return newSkippedPages;
    });
  }, [pdfDocument]);

  const onPageInclude = useCallback((pageNumber: number) => {
    if (!pdfDocument) return;
    setSkippedPages(prev => {
      const newSkippedPages = prev.filter(page => page !== pageNumber);
      return newSkippedPages;
    });
  }, [pdfDocument]);

  const onPageExcludeAll = useCallback(() => {
    if (!pdfDocument) return;
    const allPages = Array.from({ length: pdfDocument?.numPages }, (_, i) => i + 1);
    setSkippedPages(allPages);
  }, [pdfDocument]);

  const onPageIncludeAll = useCallback(() => {
    setSkippedPages([]);
  }, []);

  // Add this effect to update slicer when processingRules or skippedPages change
  useEffect(() => {
    setSlicer(prev => {
      if (!prev) return null;
      return {
        ...prev,
        processing_rules: {
          annotations: processingRules?.annotations || [],
          skipped_pages: skippedPages
        }
      };
    });
  }, [processingRules, skippedPages]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!pdfUrl || !slicer) {
    return <div>No data available</div>;
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <PDFViewerProvider>
        <div className="flex h-full">
          <PDFViewer
            url={pdfUrl}
            processingRules={processingRules}
            onRectangleUpdate={onRectangleUpdate}
            onClearPage={onClearPage}
            onClearAllPages={onClearAllPages}
            onPageExclude={onPageExclude}
            onPageInclude={onPageInclude}
            onPageExcludeAll={onPageExcludeAll}
            onPageIncludeAll={onPageIncludeAll}
            onPdfDocumentUpdate={setPdfDocument}
          />
          <SlicerSettings
            slicerObject={slicer}
            extractedTexts={extractedTexts}
            onUpdateSlicer={updateSlicerDetails}
          />
        </div>
      </PDFViewerProvider>
    </div>
  );
};

export default SlicerPage;