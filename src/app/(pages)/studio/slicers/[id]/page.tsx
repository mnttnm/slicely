"use client";

import Explore from "@/app/components/explore";
import { LinkedPdfs } from "@/app/components/linked-pdfs";
import PDFViewer from "@/app/components/pdf-viewer";
import SlicerSettings from "@/app/components/slicer-settings";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/app/components/ui/breadcrumb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { usePDFViewer } from "@/app/contexts/pdf-viewer-context";
import { useTextExtraction } from "@/app/hooks/use-text-extraction";
import { ExtractedText, FabricRect, PDFMetadata, ProcessingRules, Slicer } from "@/app/types";
import { serializeFabricRect } from "@/app/utils/fabric-helper";
import { getPageText } from "@/app/utils/pdf-utils"; // Update this import
import { getSignedPdfUrl, getSlicerDetails, linkPdfToSlicer } from "@/server/actions/studio/actions";
import { TablesInsert } from "@/types/supabase-types/database.types";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const SlicerPage = () => {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("slicerstudio");
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
    const tab = searchParams.get("tab") || "slicerstudio";
    setActiveTab(tab);
  }, [searchParams]);

  useEffect(() => {
    const extractTextFn = async (slicer: Slicer) => {
      if (!pdfDocument) return;

      const extractedTexts: ExtractedText[] = [];
      const totalPages = pdfDocument.numPages;

      for (let pageNumber = 1; pageNumber <= totalPages; pageNumber++) {
        const pageAnnotation = slicer.processing_rules.annotations.find(a => a.page === pageNumber);
        const isPageSkipped = slicer.processing_rules.skipped_pages.includes(pageNumber);

        if (pageAnnotation) {
          // Extract text for defined annotations
          for (const rect of pageAnnotation.rectangles) {
            const extractedText = await extractTextFromRectangle(rect, pageNumber);
            extractedTexts.push({
              id: rect.id,
              page_number: pageNumber,
              text: extractedText || "",
              rectangle_info: rect
            });
          }
        } else if (!isPageSkipped) {
          // Extract full page content for pages without annotations and not skipped
          const fullPageContent = await getPageText(pdfDocument, pageNumber);
          extractedTexts.push({
            id: `full-page-${pageNumber}`,
            page_number: pageNumber,
            text: fullPageContent || "",
            rectangle_info: null // No specific rectangle for full page extraction
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

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    router.push(`/studio/slicers/${id}?tab=${value}`);
  };

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
      <header className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 p-2 flex justify-between items-center">
        <div className="w-1/3"></div> {/* Placeholder for left side */}
        <Breadcrumb className="flex-1 flex justify-center">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => router.push("/studio")}>
                Studio
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => router.push("/studio?tab=slicers")}>
                Slicers
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{slicer?.name || "Slicer Details"}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="w-1/3"></div> {/* Placeholder for right side */}
      </header>
      <Tabs value={activeTab} onValueChange={handleTabChange} className="flex flex-col flex-grow overflow-hidden">
        <TabsList className="flex-shrink-0 justify-start w-full border-b border-gray-200 dark:border-gray-700">
          <TabsTrigger value="slicerstudio" className="px-4 py-2">Slicer Studio</TabsTrigger>
          <TabsTrigger value="linkedpdfs" className="px-4 py-2">Linked PDFs</TabsTrigger>
          <TabsTrigger value="explore" className="px-4 py-2">Explore</TabsTrigger>
        </TabsList>
        <TabsContent value="slicerstudio" className="flex-grow overflow-hidden">
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
        <TabsContent value="linkedpdfs" className="flex-grow overflow-hidden">
          <LinkedPdfs linkedPdfs={linkedPdfs} onUploadSuccess={onUploadSuccess} onRefresh={refreshLinkedPdfs} />
        </TabsContent>
        <TabsContent value="explore" className="flex-grow overflow-hidden">
          <Explore slicerId={slicer.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SlicerPage;