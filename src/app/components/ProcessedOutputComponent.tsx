'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Button } from "@/app/components/ui/button";
import { getProcessedOutput } from '@/server/actions/studio/actions';
import { ProcessedPageOutput } from '@/app/types';
import { Tables } from '@/types/supabase-types/database.types';
import CreateSlicerDrawer from './CreateSlicerDrawer';

interface ProcessedOutputComponentProps {
  pdfDetails: Tables<'pdfs'>;
  slicerIds: string[];
}

const ProcessedOutputComponent: React.FC<ProcessedOutputComponentProps> = ({ pdfDetails, slicerIds }) => {
  const router = useRouter();
  const [output, setOutput] = useState<ProcessedPageOutput[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSlicerDrawerOpen, setIsSlicerDrawerOpen] = useState(false);

  useEffect(() => {
    const fetchOutput = async () => {
      try {
        const data = await getProcessedOutput(pdfDetails.id);
        setOutput(data);
      } catch (error) {
        console.error('Error fetching processed output:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOutput();
  }, [pdfDetails.id]);

  const handleProcessWithSlicer = async (slicerId: string) => {
    console.log(`Processing with slicer ID: ${slicerId}`);
    // Implement the actual processing logic here
  };

  const handleCreateSlicer = () => {
    if (slicerIds.length > 0) {
      // Navigate to the slicer details page
      router.push(`/studio/slicers/${slicerIds[0]}`);
    } else {
      setIsSlicerDrawerOpen(true);
    }
  };

  const handleProcessWithDefaultSlicer = async () => {
    console.log('Processing with default slicer');
  };

  const handleSlicerDrawerOpenChange = (open: boolean) => {
    setIsSlicerDrawerOpen(open);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="text-center flex flex-col items-center justify-center h-full">
      {!output ? (
        <>
          <p className="mb-4">Seems like the file is not processed yet. We need to process the file using Slicer.</p>
          <ul className="flex flex-col gap-2">
            <li className="w-full">
              <Button onClick={handleCreateSlicer} className="w-full">
                {slicerIds.length > 0 ? 'Configure Slicer' : 'Create Custom Slicer'}
              </Button>
            </li>
            <li className="w-full" >
              <Button
                onClick={() => handleProcessWithSlicer(slicerIds[0])}
                variant="secondary"
              >
                Process with Existing Slicer
              </Button>
            </li>
          </ul>
        </>
      ) : (
        // Render the output here
        <ScrollArea className="h-[300px] w-[350px] rounded-md border p-4">
          {output.map((page, index) => (
            <div key={index} className="mb-4">
              <h3 className="text-lg font-semibold">Page {page.page_number}</h3>
              <p>{page.content}</p>
            </div>
          ))}
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