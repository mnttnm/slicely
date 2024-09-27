"use client";

import Explore from "@/app/components/Explore";
import { LinkedPdfs } from "@/app/components/linked-pdfs";
import PDFViewer from "@/app/components/pdf-viewer";
import SlicerSettings from "@/app/components/slicer-settings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { usePDFViewer } from "@/app/contexts/pdf-viewer-context";
import { useTextExtraction } from "@/app/hooks/use-text-extraction";
import { ExtractedText, FabricRect, PDFMetadata, ProcessingRules, Slicer } from "@/app/types";
import { serializeFabricRect } from "@/app/utils/fabric-helper";
import { getSignedPdfUrl, getSlicerDetails, linkPdfToSlicer } from "@/server/actions/studio/actions";
import { TablesInsert } from "@/types/supabase-types/database.types";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const SlicerPage = () => {
  const { id } = useParams();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [slicer, setSlicer] = useState<Slicer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [extractedTexts, setExtractedTexts] = useState<ExtractedText[]>([]);
  const [linkedPdfs, setLinkedPdfs] = useState<PDFMetadata[]>([]);
  const [processingRules, setProcessingRules] = useState<ProcessingRules>({
    annotations: [],
    skipped_pages: []
  });

  const { pdfDocument } = usePDFViewer();
  const { extractTextFromRectangle } = useTextExtraction(pdfDocument);

  useEffect(() => {
    // once slicer detail are fetched and the pdfdocument is loaded
    // pdfviewer, extract text for the initial annotations
    // and set the extracted texts in the state
    const extractTextFn = async (slicer: Slicer) => {
      const extractedTexts: ExtractedText[] = [];
      for (const annotation of slicer.processing_rules.annotations) {
        for (const rect of annotation.rectangles) {
          const extractedText = await extractTextFromRectangle(rect, annotation.page);
          extractedTexts.push({
            id: rect.id,
            page_number: annotation.page,
            text: extractedText || "",
            rectangle_info: rect
          });
        }
      }

      setExtractedTexts(extractedTexts);
    };

    if (pdfDocument && slicer && slicer?.processing_rules) {
      extractTextFn(slicer);
    }
  }, [pdfDocument, slicer, extractTextFromRectangle]);

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

  const fetchLinkedPdfs = useCallback(async () => {
    if (!id || typeof id !== "string") return;
    try {
      const result = await getSlicerDetails(id);
      if (result) {
        const { linkedPdfs } = result;
        setLinkedPdfs(linkedPdfs);
      }
    } catch (err) {
      console.error("Error fetching linked PDFs:", err);
    }
  }, [id]);

  const fetchSlicerDetails = useCallback(async () => {
    if (!id || typeof id !== "string") return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await getSlicerDetails(id);
      if (result) {
        const { slicerDetails, linkedPdfs } = result;
        const pdfUrl = linkedPdfs[0].file_path ?? null;
        setSlicer(slicerDetails);
        const signedPdfUrl = await getSignedPdfUrl(pdfUrl);
        setPdfUrl(signedPdfUrl);
        setProcessingRules(slicerDetails.processing_rules);
        setLinkedPdfs(linkedPdfs);
      }
    } catch (err) {
      console.error("Error fetching slicer:", err);
      setError("Failed to fetch slicer details. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSlicerDetails();
  }, [fetchSlicerDetails]);

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
    if (operation === "add") {
      if (!payload.pageNumber || !payload.rect) return;
      const serializedRect = serializeFabricRect(payload.rect);
      setProcessingRules((prev) => {
        if (!prev) {
          return {
            annotations: [
              {
                page: payload.pageNumber,
                rectangles: [serializedRect]
              }
            ],
            skipped_pages: []
          };
        }

        const pageAnnotation = prev.annotations.find(annotation => annotation.page === payload.pageNumber);
        if (pageAnnotation) {
          return {
            ...prev,
            annotations: prev.annotations.map(annotation =>
              annotation.page === payload.pageNumber
                ? {
                  ...annotation,
                  rectangles: [...annotation.rectangles, serializedRect]
                }
                : annotation
            )
          };
        }

        return {
          ...prev,
          annotations: [
            ...prev.annotations,
            {
              page: payload.pageNumber,
              rectangles: [serializedRect]
            }
          ]
        };
      });

      // set the extracted text for the page
      const extractedText = await extractTextFromRectangle(payload.rect, payload.pageNumber);

      const newExtractedText: ExtractedText = {
        id: payload.id,
        page_number: payload.pageNumber,
        text: extractedText || "",
        rectangle_info: payload.rect
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
                  rectangles: annotation.rectangles.filter(rect => rect.id !== payload.id) as FabricRect[]
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
    setExtractedTexts(prev => prev.filter(text => text.page_number !== pageNumber));
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
    setProcessingRules(prev => {
      return {
        ...prev,
        skipped_pages: [...prev.skipped_pages, pageNumber]
      };
    });
  }, []);

  const onPageInclude = useCallback((pageNumber: number) => {
    setProcessingRules(prev => {
      return {
        ...prev,
        skipped_pages: prev.skipped_pages.filter(page => page !== pageNumber)
      };
    });
  }, []);

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

  const onUploadSuccess = async (pdf: TablesInsert<"pdfs">) => {
    if (!slicer || !pdf.id) return;
    try {
      await linkPdfToSlicer(slicer.id, pdf.id);
      await fetchLinkedPdfs();
    } catch (error) {
      console.error("Error linking PDF to slicer:", error);
    }
  };

  const refreshLinkedPdfs = useCallback(async () => {
    await fetchLinkedPdfs();
  }, [fetchLinkedPdfs]);

  if (isLoading) {
    return <div className="h-full flex items-center justify-center">Loading...</div>;
  }

  if (error) {
    return <div className="h-full flex items-center justify-center">Error: {error}</div>;
  }

  if (!pdfUrl || !slicer) {
    return <div className="h-full flex items-center justify-center">No data available</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <Tabs defaultValue="slicerStudio" className="flex flex-col h-full">
        <TabsList className="flex-shrink-0 justify-start w-full border-b border-gray-200 dark:border-gray-700">
          <TabsTrigger value="slicerStudio" className="px-4 py-2">Slicer Studio</TabsTrigger>
          <TabsTrigger value="linkedPdfs" className="px-4 py-2">Linked PDFs</TabsTrigger>
          <TabsTrigger value="explore" className="px-4 py-2">Explore</TabsTrigger>
        </TabsList>
        <TabsContent value="slicerStudio" className="flex-1 overflow-hidden">
            <div className="flex h-full">
              <div className="flex-1">
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
                pdf_password={slicer.pdf_password ?? undefined}
                />
              </div>
              <div className="flex-1 border-l border-gray-200 dark:border-gray-700">
                <SlicerSettings
                  slicerObject={slicer}
                  extractedTexts={extractedTexts}
                  onUpdateSlicer={updateSlicerDetails}
                />
              </div>
          </div>
        </TabsContent>
        <TabsContent value="linkedPdfs" className="flex-1 overflow-hidden">
          <LinkedPdfs linkedPdfs={linkedPdfs} onUploadSuccess={onUploadSuccess} onRefresh={refreshLinkedPdfs} />
        </TabsContent>
        <TabsContent value="explore" className="flex-1 overflow-hidden">
          <Explore slicerId={slicer.id} />
        </TabsContent>
      </Tabs >
    </div >
  );
};

export default SlicerPage;