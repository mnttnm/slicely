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
import { serializeFabricRect } from '@/app/utils/fabricHelper';

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

  const { extractTextFromRectangle } = useTextExtraction(pdfDocument);

  const updateSlicerDetails = useCallback((updatedSlicer: Partial<Slicer>) => {
    setSlicer(prev => {
      if (!prev) return null;
      return {
        ...prev,
        ...updatedSlicer,
        processing_rules: {
          annotations: processingRules?.annotations || [],
          skipped_pages: processingRules?.skipped_pages || []
        }
      };
    });
  }, [processingRules]);

  const onRectangleUpdate = useCallback(async (operation: "add" | "remove", payload: { id: string, rect?: FabricRect, pageNumber?: number }) => {
    console.log("onRectangleUpdate # ", operation, payload);
    if (operation === "add") {
      if (!payload.pageNumber || !payload.rect) return;
      const serializedRect = serializeFabricRect(payload.rect);
      setProcessingRules((prev) => {
        if (!prev) {
          return {
            annotations: [
              {
                page: payload.pageNumber!,
                rectangles: [serializedRect]
              }
            ],
            skipped_pages: []
          };
        } else {
          const pageAnnotation = prev.annotations.find(annotation => annotation.page === payload.pageNumber);
          if (pageAnnotation) {
            const updatedRectangles = [...pageAnnotation.rectangles, serializedRect];
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
                rectangles: [serializedRect]
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
    } else if (operation === "remove") {
      if (!payload.pageNumber || !payload.id) return;
      
      setProcessingRules(prev => {
        if (!prev) return { annotations: [], skipped_pages: [] };
        return {
          ...prev,
          annotations: prev.annotations.map(annotation => 
            annotation.page === payload.pageNumber 
              ? {
                  ...annotation,
                  rectangles: annotation.rectangles.filter(rect => rect.id !== payload.id)
                }
              : annotation
          )
        };
      });

      // Remove only the specific extracted text
      setExtractedTexts(prev => prev.filter(text => text.id !== payload.id));
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
    setProcessingRules(prev => {
      return {
        ...prev,
        skipped_pages: [...prev.skipped_pages, pageNumber]
      };
    });
  }, [pdfDocument]);

  const onPageInclude = useCallback((pageNumber: number) => {
    if (!pdfDocument) return;
    setProcessingRules(prev => {
      return {
        ...prev,
        skipped_pages: prev.skipped_pages.filter(page => page !== pageNumber)
      };
    });
  }, [pdfDocument]);

  const onPageExcludeAll = useCallback(() => {
    if (!pdfDocument) return;
    const allPages = Array.from({ length: pdfDocument?.numPages }, (_, i) => i + 1);
    setProcessingRules(prev => {
      return {
        ...prev,
        skipped_pages: allPages
      };
    });
  }, [pdfDocument]);

  const onPageIncludeAll = useCallback(() => {
    setProcessingRules(prev => {
      return {
        ...prev,
        skipped_pages: []
      };
    });
  }, []);

  // Add this effect to update slicer when processingRules changes
  useEffect(() => {
    setSlicer(prev => {
      if (!prev) return null;
      return {
        ...prev,
        processing_rules: {
          annotations: processingRules?.annotations || [],
          skipped_pages: processingRules?.skipped_pages || []
        }
      };
    });
  }, [processingRules]);

  // Update this useEffect to extract text when pdfDocument is available
  const extractTexts = useCallback(async () => {
    if (!pdfDocument) return;
    const updatedTexts = await Promise.all(
      extractedTexts.map(async (text) => ({
        ...text,
        text: await extractTextFromRectangle(text.rectangleInfo, text.pageNumber) || '',
      }))
    );
    setExtractedTexts(updatedTexts);

    //todo: fix this dependency array warning, currently
    // if we include extractTexts in the dependency array, it will cause
    // an infinite re-rendering loop
  }, [pdfDocument, extractTextFromRectangle]);

  useEffect(() => {
    extractTexts();
  }, [extractTexts]);

  useEffect(() => {
    const fetchSlicerDetails = async () => {
      if (!id || typeof id !== 'string') return;

      setIsLoading(true);
      setError(null);

      try {
        const result = await getSlicerDetails(id);
        if (result) {
          const { slicerDetails, linkedPdfs } = result;
          console.log(linkedPdfs);

          const pdfUrl = linkedPdfs[0].file_path ?? null;
          setSlicer(slicerDetails);
          setPdfUrl(pdfUrl);
          setProcessingRules(slicerDetails.processing_rules);

          // Initialize extractedTexts based on the fetched slicer details
          const initialExtractedTexts: ExtractedText[] = slicerDetails.processing_rules.annotations.flatMap(
            (annotation) =>
              annotation.rectangles.map((rect) => ({
                id: rect.id,
                pageNumber: annotation.page,
                text: '', // We'll need to extract the text later
                rectangleInfo: rect,
              }))
          );
          setExtractedTexts(initialExtractedTexts);
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