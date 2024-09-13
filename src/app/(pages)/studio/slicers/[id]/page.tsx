'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import PDFViewer from '@/app/components/PDFViewer';
import { SlicerControlProvider } from '@/app/contexts/SlicerControlContext';
import SlicerSettings from '@/app/components/SlicerSettings';
import { Slicer, ProcessingRules } from '@/app/types';
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

const SlicerPage = ({ params }: { params: { id: string } }) => {
  const { id } = useParams();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [extractedTexts, setExtractedTexts] = useState<ExtractedText[]>([]);
  const [slicer, setSlicer] = useState<Slicer | null>(null);
  const [processingRules, setProcessingRules] = useState<ProcessingRules | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSlicerDetails = async () => {
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

    fetchSlicerDetails();
  }, [id]);

  const addExtractedText = (newExtractedText: ExtractedText) => {
    setExtractedTexts(prev => [...prev, newExtractedText]);
  };

  const removeExtractedText = (id?: string, removeAll?: boolean, pageNumber?: number) => {
    if (removeAll && pageNumber !== undefined) {
      setExtractedTexts(prev => prev.filter(text => text.pageNumber !== pageNumber));
    } else if (id) {
      setExtractedTexts(prev => prev.filter(text => text.id !== id));
    }
  };

  const updateSlicerDetails = (updatedSlicer: Partial<Slicer>) => {
    setSlicer(prev => prev ? { ...prev, ...updatedSlicer } : null);
    // Here you would typically make an API call to update the slicer in the database
  };

  const updateProcessingRules = async (updatedRules: ProcessingRules) => {
    if (!slicer || !slicer.id) return;

    console.log('Updating processing rules', updatedRules);
    try {
      // await saveAnnotations(slicer.id, updatedRules);
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
            onExtractText={addExtractedText}
            onDeleteText={removeExtractedText}
            processingRules={processingRules}
            onUpdateAnnotations={updateProcessingRules}
            slicerId={slicer.id}
          />
          <SlicerSettings
            slicerObject={slicer}
            extractedTexts={extractedTexts}
            onUpdateSlicer={updateSlicerDetails}
          />
        </div>
      </SlicerControlProvider>
    </div>
  );
};

export default SlicerPage;