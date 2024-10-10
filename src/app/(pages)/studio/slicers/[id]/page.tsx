"use client";

import Explore from "@/app/components/explore";
import { LinkedPdfs } from "@/app/components/linked-pdfs";
import PdfChat from "@/app/components/pdf-chat";
import PDFViewer from "@/app/components/pdf-viewer";
import SlicerSettings from "@/app/components/slicer-settings";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/app/components/ui/breadcrumb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { usePDFViewer } from "@/app/contexts/pdf-viewer-context";
import { useTextExtraction } from "@/app/hooks/use-text-extraction";
import { ExtractedText, FabricRect, PageSelectionRule, PDFMetadata, ProcessingRules, Slicer } from "@/app/types";
import { serializeFabricRect } from "@/app/utils/fabric-helper";
import { extractPdfContent } from "@/server/actions/pdf-actions";
import { getSignedPdfUrl, getSlicerDetails, linkPdfToSlicer } from "@/server/actions/studio/actions";
import { TablesInsert } from "@/types/supabase-types/database.types";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const selectAllPages: PageSelectionRule = { type: "all" };

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
    pageSelection: {
      strategy: "include",
      rules: [selectAllPages]
    }
  });

  const { pdfDocument, currentProcessingRules } = usePDFViewer();
  const { extractTextFromRectangle } = useTextExtraction(pdfDocument);

  useEffect(() => {
    const tab = searchParams.get("tab") || "slicerstudio";
    setActiveTab(tab);
  }, [searchParams]);

  useEffect(() => {
    setSlicer(prev => {
      if (!prev) return null;
      return {
        ...prev,
        processing_rules: currentProcessingRules
      };
    });
  }, [currentProcessingRules]);

  useEffect(() => {
    const extractTextFn = async (slicer: Slicer) => {
      if (!pdfUrl || !slicer?.processing_rules) return;

      try {
        const extractedTexts = await extractPdfContent(pdfUrl, slicer.processing_rules, slicer.pdf_password ?? undefined);
        setExtractedTexts(extractedTexts);
      } catch (error) {
        console.error("Error extracting PDF content:", error);
        setError("Failed to extract PDF content. Please try again.");
      }
    };

    if (pdfUrl && slicer && slicer?.processing_rules) {
      extractTextFn(slicer);
    }
  }, [pdfUrl, slicer]);

  // Add this effect to update slicer when processingRules changes
  useEffect(() => {
    setSlicer(prev => {
      if (!prev) return null;
      return {
        ...prev,
        processing_rules: {
          annotations: processingRules?.annotations || [],
          pageSelection: processingRules?.pageSelection || {
            strategy: "include",
            rules: [selectAllPages]
          }
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
          pageSelection: processingRules?.pageSelection || {
            strategy: "include",
            rules: [selectAllPages]
          }
        }
      };
    });
  }, [processingRules]);

  const onRectangleUpdate = useCallback(async (operation: "add" | "remove", payload: { id: string, rect?: FabricRect, pageNumber?: number }) => {
    if (operation === "add") {
      if (!payload.pageNumber || !payload.rect) return;
      const serializedRect = serializeFabricRect(payload.rect);
      setProcessingRules((prev) => {
        const existingAnnotation = prev.annotations.find(a => a.page === payload.pageNumber);
        if (existingAnnotation) {
          return {
            ...prev,
            annotations: prev.annotations.map(a =>
              a.page === payload.pageNumber
                ? { ...a, rectangles: [...a.rectangles, serializedRect] }
                : a
            )
          };
        } else {
          return {
            ...prev,
            annotations: [...prev.annotations, { page: payload.pageNumber!, rectangles: [serializedRect] }]
          };
        }
      });

      // Extract and set the text for the new rectangle
      const extractedText = await extractTextFromRectangle(payload.rect, payload.pageNumber);
      setExtractedTexts(prev => [
        ...prev,
        {
          id: payload.id,
          page_number: payload.pageNumber!,
          text: extractedText || "",
          rectangle_info: payload.rect ?? null
        }
      ]);
    } else if (operation === "remove") {
      if (!payload.pageNumber || !payload.id) return;

      setProcessingRules(prev => ({
        ...prev,
        annotations: prev.annotations.map(annotation =>
          annotation.page === payload.pageNumber
            ? {
              ...annotation,
              rectangles: annotation.rectangles.filter(rect => rect.id !== payload.id)
            }
            : annotation
        ).filter(annotation => annotation.rectangles.length > 0)
      }));

      setExtractedTexts(prev => prev.filter(text => text.id !== payload.id));
    }
  }, [extractTextFromRectangle]);

  const onClearPage = useCallback((pageNumber: number) => {
    setProcessingRules(prev => ({
      ...prev,
      annotations: prev.annotations.filter(annotation => annotation.page !== pageNumber)
    }));
    setExtractedTexts(prev => prev.filter(text => text.page_number !== pageNumber));
  }, []);

  const onClearAllPages = useCallback(() => {
    setExtractedTexts([]);
    setProcessingRules({
      annotations: [],
      pageSelection: {
        strategy: "include",
        rules: [selectAllPages]
      }
    });
  }, []);

  const onUploadSuccess = async (pdfs: TablesInsert<"pdfs">[]) => {
    if (!slicer || pdfs.length === 0) return;

    try {
      for (const pdf of pdfs) {
        if (!pdf.id) continue;
        await linkPdfToSlicer(slicer.id, pdf.id);
      }
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
          <TabsTrigger value="pdfchat" className="px-4 py-2">PDF Chat</TabsTrigger> {/* New Tab */}
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
        <TabsContent value="pdfchat" className="flex-grow overflow-hidden"> {/* New Tab Content */}
          <PdfChat linkedPdfs={linkedPdfs} pdf_prompts={slicer.pdf_prompts} />
        </TabsContent>
        <TabsContent value="explore" className="flex-grow overflow-hidden">
          <Explore slicerId={slicer.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SlicerPage;