'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { PDFViewerProvider } from '@/app/contexts/PDFViewerContext';
import { getPdfDetails } from '@/server/actions/studio/actions';
import { Tables } from '@/types/supabase-types/database.types';
import PDFRenderer from '@/app/components/PDFRenderer';

const PDFDetails = () => {
  const { id } = useParams();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfDetails, setPdfDetails] = useState<Tables<'pdfs'> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPdfDetails = async () => {
      if (!id || typeof id !== 'string') return;

      setIsLoading(true);
      setError(null);

      try {
        const result = await getPdfDetails(id);
        if (result) {
          const { pdfDetails, pdfUrl } = result;
          setPdfDetails(pdfDetails);
          setPdfUrl(pdfUrl);
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
    <PDFViewerProvider>
      <div className="flex flex-col h-[100vh] overflow-hidden">
        <header className="flex p-2 border-b border-gray-300">
          <h1 className="text-xl">{`pdfs > ${pdfDetails.file_name}`}</h1>
        </header>
        <div className="flex flex-grow">
          <div className="flex w-1/2 h-full overflow-auto border-r border-gray-300 justify-center">
            <PDFRenderer
              url={pdfUrl}
              pageNumber={1}
              onDocumentLoadSuccess={() => { }}
              onPageRenderSuccess={() => { }}
              skippedPages={[]}
            />
          </div>
        </div>
      </div>

    </PDFViewerProvider>
  );
};

export default PDFDetails;