'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { usePDFContext } from '@/app/contexts/PDFContext';
import { PDFMetadata } from '@/app/types';
import PDFViewer from '@/app/components/PDFViewer';
import { PDFViewerProvider } from '@/app/contexts/PDFViewerContext';
import SlicerSettings from '@/app/components/SlicerSettings';
import { Slicer } from '@/app/types';


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
  const { pdfs, setCurrentPDF } = usePDFContext();
  const [pdf, setPdf] = useState<PDFMetadata | null>(null);
  const [extractedTexts, setExtractedTexts] = useState<ExtractedText[]>([]);
  const [slicer, setSlicer] = useState<Slicer | null>(null);

  useEffect(() => {
    const selectedPdf = pdfs.find(p => p.id === id);
    if (selectedPdf) {
      setPdf(selectedPdf);
      setCurrentPDF(selectedPdf);
    }
  }, [id, pdfs, setCurrentPDF]);

  useEffect(() => {
    // Fetch slicer data from the database using the id
    // This is a placeholder, replace with actual API call
    const fetchSlicer = async () => {
      // const response = await fetch(`/api/slicers/${id}`);
      // const data = await response.json();
      // setSlicer(data);

      // Placeholder data
      setSlicer({
        name: 'Sample Slicer',
        description: 'A sample slicer configuration',
        user_id: 'user123',
        llm_prompt: 'Sample prompt',
        output_mode: 'Sample mode',
        webhook_url: 'Sample url',
        processing_rules: {
          annotations: [],
          skipped_pages: [],
        },
      });
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

  if (!pdf || !slicer) {
    return <div>Loading...</div>;
  }

  return (
    <article className="flex flex-col h-full">
      <div className="flex h-full overflow-auto">
        <PDFViewerProvider>
          <PDFViewer url={pdf.url} onExtractText={handleExtractedText} onDeleteText={handleDeleteText} />
          <SlicerSettings
            slicer={slicer}
            extractedTexts={extractedTexts}
            onUpdateSlicer={handleUpdateSlicer}
          />
        </PDFViewerProvider>
      </div>
    </article>
  );
};

export default SlicerPage;