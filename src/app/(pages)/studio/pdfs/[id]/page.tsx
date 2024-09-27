'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { usePDFViewer } from '@/app/contexts/PDFViewerContext';
import { getPdfDetails, getSlicerDetails } from '@/server/actions/studio/actions';
import { Tables } from '@/types/supabase-types/database.types';
import PDFLab from '@/app/components/PDFLab';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/app/components/ui/dropdown-menu';
import { Button } from '@/app/components/ui/button';
import { MoreVertical, Settings, Download, Database } from 'lucide-react';
import PDFViewer from '@/app/components/PDFViewer';
import PDFNavigation from '@/app/components/PDFNavigation';

const PDFDetails = () => {
  const { id } = useParams();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfDetails, setPdfDetails] = useState<Tables<'pdfs'> | null>(null);
  const [slicerIds, setSlicerIds] = useState<string[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfPassword, setPdfPassword] = useState<string | undefined>(undefined);

  useEffect(() => {
    const fetchPdfDetails = async () => {
      if (!id || typeof id !== 'string') return;

      setIsLoading(true);
      setError(null);

      try {
        const result = await getPdfDetails(id);
        if (result) {
          const { pdfDetails, pdfUrl, slicer_ids } = result;
          setPdfDetails(pdfDetails);
          setPdfUrl(pdfUrl);
          setSlicerIds(slicer_ids);

          // fetch password from attached slicer
          const slicerData = await getSlicerDetails(slicer_ids[0]);
          if (slicerData) {
            setPdfPassword(slicerData.slicerDetails?.pdf_password ?? undefined);
          }
        }
      } catch (err) {
        console.error('Error fetching slicer:', err);
        setError('Failed to fetch slicer details. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPdfDetails();
  }, [id]);

  const handleSaveToDB = () => {
    console.log('Save to DB');
  };

  const { numPages, pageNumber, jumpToPage } = usePDFViewer();


  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!pdfUrl || !pdfDetails) {
    return <div>No data available</div>;
  }


  return (
    <>
      <header className="h-[3rem] px-4 py-2 flex-shrink-0 flex-grow-0 border-b border-gray-600/30 flex justify-between items-center">
        <h1 className="text-xl">{`PDFs > ${pdfDetails.file_name}`}</h1>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => { console.log('Configure Slicer') }}>
              <Settings className="mr-2 h-4 w-4" />
              Configure Slicer
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => { console.log('Export') }}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={handleSaveToDB}>
              <Database className="mr-2 h-4 w-4" />
              Save to DB
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
      <main className="flex-1 bg-gray-800 flex flex-col min-h-0 text-white">
        <div className="flex-1 flex min-h-0">
          <div className="relative flex-1">
            <PDFViewer pdf_password={pdfPassword} showToolbar={false} url={pdfUrl} onRectangleUpdate={() => { }} onClearPage={() => { }} onClearAllPages={() => { }} processingRules={null} onPageExclude={() => { }} onPageInclude={() => { }} onPageExcludeAll={() => { }} onPageIncludeAll={() => { }} />
            <PDFNavigation currentPage={pageNumber ?? 1} numPages={numPages ?? 1} onPageChange={jumpToPage} />
          </div>
          <div className=" flex-1">
            <PDFLab pdfDetails={pdfDetails} slicerIds={slicerIds ?? []} />
          </div>
        </div>
      </main>
    </>
  );
};

export default PDFDetails;