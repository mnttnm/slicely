'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import PDFViewer from '@/app/components/PDFViewer';
import { PDFViewerProvider, usePDFViewer } from '@/app/contexts/PDFViewerContext';
import SlicerSettings from '@/app/components/SlicerSettings';
import { Slicer } from '@/app/types';
import ExtractedTextView from '@/app/components/ExtractedTextView';
import { getSlicerDetails } from '@/server/actions/studio/actions';

interface ExtractedText {
  id: string;
  pageNumber: number;
  text: string;
  rectangleInfo: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
}

const SlicerPage = () => {
  const { id } = useParams();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [extractedTexts, setExtractedTexts] = useState<ExtractedText[]>([]);
  const [slicer, setSlicer] = useState<Slicer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSlicer = async () => {
      if (!id || typeof id !== 'string') return;

      setIsLoading(true);
      setError(null);

      try {
        const result = await getSlicerDetails(id);
        if (result) {
          const { slicerDetails, pdfUrl } = result;
          setSlicer(slicerDetails as Slicer);
          setPdfUrl(pdfUrl)
        }
      } catch (err) {
        console.error('Error fetching slicer:', err);
        setError('Failed to fetch slicer details. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSlicer();
  }, [id]);

  const handleExtractedText = (newExtractedText: ExtractedText) => {
    setExtractedTexts(prev => [...prev, newExtractedText]);
  };

  const handleDeleteText = (id?: string, deleteAll?: boolean) => {
    if (deleteAll) {
      setExtractedTexts([]);
    } else {
      setExtractedTexts(prev => prev.filter(text => text.id !== id));
    }
  };

  const handleUpdateSlicer = (updatedSlicer: Partial<Slicer>) => {
    setSlicer(prev => prev ? { ...prev, ...updatedSlicer } : null);
    // Here you would typically make an API call to update the slicer in the database
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!pdfUrl || !slicer) {
    return <div>No data available</div>;
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <PDFViewerProvider>
        <div className="flex-grow overflow-hidden">
          <ExtractedTextView extractedTexts={extractedTexts} />
        </div>
        <div className="flex h-full">
          <PDFViewer url={pdfUrl} onExtractText={handleExtractedText} onDeleteText={handleDeleteText} />
          <SlicerSettings
            slicer={slicer}
            extractedTexts={extractedTexts}
            onUpdateSlicer={handleUpdateSlicer}
          />
        </div>
      </PDFViewerProvider>
    </div>
  );
};

export default SlicerPage;