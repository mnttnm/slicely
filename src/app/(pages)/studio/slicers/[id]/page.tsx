'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import PDFViewer from '@/app/components/PDFViewer';
import { SlicerControlProvider } from '@/app/contexts/SlicerControlContext';
import SlicerSettings from '@/app/components/SlicerSettings';
import { Slicer, ProcessingRules } from '@/app/types';
import { getSlicerDetails, saveAnnotations } from '@/server/actions/studio/actions';

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
  const [processingRules, setProcessingRules] = useState<ProcessingRules | null>(null);
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
          setProcessingRules(slicerDetails.processing_rules || null);
          setPdfUrl(pdfUrl);
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

  const handleUpdateAnnotations = async (updatedRules: ProcessingRules) => {
    if (!slicer || !slicer.id) return;

    try {
      await saveAnnotations(slicer.id, updatedRules);
      setProcessingRules(updatedRules);
    } catch (error) {
      console.error('Error saving annotations:', error);
    }
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
      <SlicerControlProvider>
        <div className="flex h-full">
          <PDFViewer
            url={pdfUrl}
            onExtractText={handleExtractedText}
            onDeleteText={handleDeleteText}
            processingRules={processingRules}
            onUpdateAnnotations={handleUpdateAnnotations}
            slicerId={slicer.id}
          />
          <SlicerSettings
            slicerObject={slicer}
            extractedTexts={extractedTexts}
            onUpdateSlicer={handleUpdateSlicer}
          />
        </div>
      </SlicerControlProvider>
    </div>
  );
};

export default SlicerPage;