'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { PDFViewerProvider } from '@/app/contexts/PDFViewerContext';
import { getPdfDetails } from '@/server/actions/studio/actions';
import { Tables } from '@/types/supabase-types/database.types';
import PDFRenderer from '@/app/components/PDFRenderer';
import PDFLab from '@/app/components/PDFLab';
import PDFNavigation from '@/app/components/PDFNavigation';

const PDFDetails = () => {
  const { id } = useParams();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfDetails, setPdfDetails] = useState<Tables<'pdfs'> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);

  const handleDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

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
      <div className="flex-1 bg-gray-800 flex flex-col min-h-0 text-white">
        <header className="h-[3rem] px-4 py-2 flex-shrink-0 flex-grow-0 border-b border-gray-600/30">
          <h1 className="text-xl">{`PDFs > ${pdfDetails.file_name}`}</h1>
        </header>

        <div className="flex-1 flex min-h-0">
          {/* Left Section for PDFRenderer */}
          <section className="relative w-[50%] bg-gray-700 flex justify-center">
            <PDFRenderer
              url={pdfUrl}
              pageNumber={currentPage}
              onDocumentLoadSuccess={handleDocumentLoadSuccess}
              onPageRenderSuccess={() => { }}
              skippedPages={[]}
            />
            <PDFNavigation
              currentPage={currentPage}
              numPages={numPages}
              onPageChange={setCurrentPage}
            />
          </section>

          <PDFLab />
        </div>

      </div >
    </PDFViewerProvider>
  );
};

export default PDFDetails;