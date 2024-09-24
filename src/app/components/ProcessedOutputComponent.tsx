'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Button } from "@/app/components/ui/button";
import { Tables } from '@/types/supabase-types/database.types';
import CreateSlicerDrawer from './CreateSlicerDrawer';
import { ProcessPdf } from "@/services/pdfProcessingService";
import ExtractedTextView from './ExtractedTextView';
import { getProcessedOutput } from '@/server/actions/studio/actions';
import { ProcessedOutput } from '@/app/types';

interface ProcessedOutputComponentProps {
  pdfDetails: Tables<'pdfs'>;
  slicerIds: string[];
}

const ProcessedOutputComponent: React.FC<ProcessedOutputComponentProps> = ({ pdfDetails, slicerIds }) => {
  const router = useRouter();
  const [output, setOutput] = useState<ProcessedOutput[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSlicerDrawerOpen, setIsSlicerDrawerOpen] = useState(false);

  useEffect(() => {
    const fetchOutput = async () => {
      try {
        const data = await getProcessedOutput(pdfDetails.id);
        if (data) {
          setOutput(data);
        }
      } catch (error) {
        console.error('Error fetching processed output:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOutput();
  }, [pdfDetails.id]);

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

  async function handlePDFProcessing() {
    try {
      const result = await ProcessPdf(pdfDetails, slicerIds[0]);
      setOutput(result);
    } catch (error) {
      console.error("Error processing PDF:", error);
      throw error;
    }
  }

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
                <Button onClick={handlePDFProcessing} className="w-full">
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
                  id: pageOutput.id,
                  page_number: pageOutput.page_number,
                  text: pageOutput.text_content,
                  rectangle_info: pageOutput.section_info.metadata.rectangleInfo
                }
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