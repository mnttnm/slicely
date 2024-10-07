"use client";

import { Button } from "@/app/components/ui/button";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { getProcessedOutput } from "@/server/actions/studio/actions";
import { handlePDFProcessing } from "@/services/pdf-processing-service";
import { Tables } from "@/types/supabase-types/database.types";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";
import { ProcessedOutput } from "../types";
import CreateSlicerDrawer from "./create-slicer-drawer";
import ExtractedTextView from "./extracted-text-view";

interface ProcessedOutputComponentProps {
  pdfDetails: Tables<"pdfs">;
  slicerIds: string[];
}

const ProcessedOutputComponent: React.FC<ProcessedOutputComponentProps> = ({ pdfDetails, slicerIds }) => {
  const router = useRouter();
  const [output, setOutput] = useState<ProcessedOutput[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSlicerDrawerOpen, setIsSlicerDrawerOpen] = useState(false);

  const fetchOutput = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getProcessedOutput(pdfDetails.id);
      if (data) {
        setOutput(data);
      }
    } catch (error) {
      console.error("Error fetching processed output:", error);
    } finally {
      setLoading(false);
    }
  }, [pdfDetails.id]);

  useEffect(() => {
    fetchOutput();
  }, [fetchOutput]);

  const handleCreateSlicer = () => {
    if (slicerIds.length > 0) {
      // Navigate to the slicer details page
      router.push(`/studio/slicers/${slicerIds[0]}`);
    } else {
      setIsSlicerDrawerOpen(true);
    }
  };

  const handleSlicerDrawerOpenChange = (open: boolean) => {
    setIsSlicerDrawerOpen(open);
  };

  const handleProcessPdf = async () => {
    setLoading(true);
    try {
      await handlePDFProcessing(pdfDetails, slicerIds[0]);

      // todo: this is a temporary solution to refresh the page after processing
      // current db insert operation inside handlepdfprocessing is taking time
      // to update entry in db (because of a trigger function in outputs table)
      // we need to find a better solution
      setTimeout(async () => {
        await fetchOutput();
        router.refresh();
      }, 1000);
    } catch (error) {
      console.error("Error processing PDF:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col items-center h-full">
      {output.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full">
          <p className="mb-4">Seems like the file is not processed yet. We need to process the file using Slicer.</p>
          <ul className="flex flex-col gap-2">
            {slicerIds.length > 0 ? (
              <li className="w-full">
                <Button onClick={handleProcessPdf} className="w-full">
                  Process with Existing Slicer
                </Button>
              </li>
            ) : <li className="w-full">
              <Button onClick={handleCreateSlicer} className="w-full">
                Create Custom Slicer
              </Button>
            </li>}
          </ul>
        </div>
      ) : (
        // Render the output here
        <ScrollArea className="h-full w-full rounded-md border p-4">
          <ExtractedTextView
            slicedTexts={output.map(pageOutput => {
              return {
                id: pageOutput.section_info.metadata.id ?? pageOutput.id, // legacy entries will not have section_info.metadata.id
                page_number: pageOutput.page_number,
                text: pageOutput.text_content,
                rectangle_info: pageOutput.section_info.metadata.rectangle_info
              };
            })}
            processingRules={null} // You might want to pass the actual processing rules here if available
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

export default ProcessedOutputComponent;