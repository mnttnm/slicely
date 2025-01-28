"use client";

import { Button } from "@/app/components/ui/button";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { getSlicedPdfContent } from "@/server/actions/studio/actions";
import { handlePDFProcessing } from "@/services/pdf-processing-service";
import { Tables } from "@/types/supabase-types/database.types";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";
import { useApiKey } from "../hooks/use-api-key";
import { SlicedPdfContent } from "../types";
import CreateSlicerDrawer from "./create-slicer-drawer";
import ExtractedTextView from "./extracted-text-view";

interface PdfSlicedContentViewerProps {
  pdfDetails: Tables<"pdfs">;
  slicerIds: string[];
}

const PdfSlicedContentViewer: React.FC<PdfSlicedContentViewerProps> = ({ pdfDetails, slicerIds }) => {
  const router = useRouter();
  const [slicedContent, setSlicedContent] = useState<SlicedPdfContent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSlicerDrawerOpen, setIsSlicerDrawerOpen] = useState(false);
  const { apiKey } = useApiKey();

  const fetchSlicedContent = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getSlicedPdfContent(pdfDetails.id);
      if (data) {
        setSlicedContent(data);
      }
    } catch (error) {
      console.error("Error fetching sliced PDF content:", error);
    } finally {
      setIsLoading(false);
    }
  }, [pdfDetails.id]);

  useEffect(() => {
    fetchSlicedContent();
  }, [fetchSlicedContent]);

  const handleCreateSlicer = () => {
    if (slicerIds.length > 0) {
      router.push(`/studio/slicers/${slicerIds[0]}`);
    } else {
      setIsSlicerDrawerOpen(true);
    }
  };

  const handleSlicerDrawerOpenChange = (open: boolean) => {
    setIsSlicerDrawerOpen(open);
  };

  const handleProcessPdf = async () => {
    setIsLoading(true);

    try {
      await handlePDFProcessing(pdfDetails, slicerIds[0], apiKey);

      setTimeout(async () => {
        await fetchSlicedContent();
        router.refresh();
      }, 1000);
    } catch (error) {
      console.error("Error processing PDF:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col items-center h-full">
      {slicedContent.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full">
          <p className="mb-4">This file hasn&apos;t been processed yet. We need to slice the file using a Slicer.</p>
          <ul className="flex flex-col gap-2">
            {slicerIds.length > 0 ? (
              <li className="w-full">
                <Button onClick={handleProcessPdf} className="w-full">
                  Process with Existing Slicer
                </Button>
              </li>
            ) : (
              <li className="w-full">
                <Button onClick={handleCreateSlicer} className="w-full">
                  Create Custom Slicer
                </Button>
              </li>
            )}
          </ul>
        </div>
      ) : (
        <ScrollArea className="h-full w-full rounded-md border p-4">
          <ExtractedTextView
            slicedTexts={slicedContent.map(pageContent => ({
              id: pageContent.section_info.metadata.id ?? pageContent.id,
              page_number: pageContent.page_number,
              text: pageContent.text_content,
              rectangle_info: pageContent.section_info.metadata.rectangle_info
            }))}
            processingRules={null}
          />
        </ScrollArea>
      )}
      <CreateSlicerDrawer
        open={isSlicerDrawerOpen}
        onOpenChange={handleSlicerDrawerOpenChange}
        defaultName={`Slicer: ${pdfDetails.file_name}`}
        defaultDescription={`Slicer for ${pdfDetails.file_name}`}
        defaultFileId={pdfDetails.id.toString()}
      />
    </div>
  );
};

export default PdfSlicedContentViewer;