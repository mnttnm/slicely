'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import PDFViewer from '@/app/components/PDFViewer';
import { PDFViewerProvider } from '@/app/contexts/PDFViewerContext';
import SlicerSettings from '@/app/components/SlicerSettings';
import { Slicer, ProcessingRules, ExtractedText } from '@/app/types';
import { getSlicerDetails } from '@/server/actions/studio/actions';

const SlicerPage = () => {
  const { id } = useParams();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [slicer, setSlicer] = useState<Slicer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [extractedTexts, setExtractedTexts] = useState<ExtractedText[]>([]);

  const transformSlicerDetails = (slicerDetails: any): Slicer => {
    return {
      ...slicerDetails,
      processing_rules: slicerDetails.processing_rules as ProcessingRules,
    };
  };

  // const updateSlicerRules = (updatedRules: ProcessingRules) => {
  //   setProcessingRules(updatedRules);
  // };

  useEffect(() => {
    const fetchSlicerDetails = async () => {
      if (!id || typeof id !== 'string') return;

      setIsLoading(true);
      setError(null);

      try {
        const result = await getSlicerDetails(id);
        if (result) {
          const { slicerDetails, pdfUrl } = result;
          setSlicer(transformSlicerDetails(slicerDetails));
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

  const onExtractedTextsUpdate = (updatedExtractedTexts: ExtractedText[]) => {
    setExtractedTexts(updatedExtractedTexts);
  };

  // const removeExtractedText = (id?: string, removeAll?: boolean, pageNumber?: number) => {
  //   if (removeAll && pageNumber !== undefined) {
  //     setExtractedTexts(prev => prev.filter(text => text.pageNumber !== pageNumber));
  //   } else if (id) {
  //     setExtractedTexts(prev => prev.filter(text => text.id !== id));
  //   }
  // };

  const updateSlicerDetails = (updatedSlicer: Partial<Slicer>) => {
    setSlicer(prev => prev ? { ...prev, ...updatedSlicer } : null);
  };

  const updateProcessingRules = (updatedRules: ProcessingRules) => {
    setSlicer(prev => prev ? { ...prev, processing_rules: updatedRules } : null);
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
        <div className="flex h-full">
          <PDFViewer
            onExtractText={addExtractedText}
            url={pdfUrl}
            processingRules={slicer.processing_rules}
            onProcessingRulesUpdate={updateProcessingRules}
            onExtractedTextsUpdate={onExtractedTextsUpdate}
          />
          <SlicerSettings
            slicerObject={slicer}
            extractedTexts={extractedTexts}
            onUpdateSlicer={updateSlicerDetails}
          />
        </div>
      </PDFViewerProvider>
    </div>
  );
};

export default SlicerPage;