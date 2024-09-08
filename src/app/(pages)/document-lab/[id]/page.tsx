'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { usePDFContext } from '@/app/contexts/PDFContext';
import { PDFMetadata } from '@/app/types';
import PDFViewer from '@/app/components/PDFViewer';
import ExtractedTextList from '@/app/components/ExtractedTextList';

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

const PDFViewerPage = () => {
  const { id } = useParams();
  const { pdfs, setCurrentPDF } = usePDFContext();
  const [pdf, setPdf] = useState<PDFMetadata | null>(null);
  const [extractedTexts, setExtractedTexts] = useState<ExtractedText[]>([]);

  useEffect(() => {
    const selectedPdf = pdfs.find(p => p.id === id);
    if (selectedPdf) {
      setPdf(selectedPdf);
      setCurrentPDF(selectedPdf);
    }
  }, [id, pdfs, setCurrentPDF]);

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


  if (!pdf) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col h-screen px-4">
      <h2 className="text-2xl font-bold mb-4">{pdf.name}</h2>
      <div className="flex h-full">
        <PDFViewer url={pdf.url} onExtractText={handleExtractedText} onDeleteText={handleDeleteText} />
        <ExtractedTextList extractedTexts={extractedTexts} />
      </div>
      {/* <div className="flex-1 h-full p-4 overflow-y-auto">
      </div> */}
    </div>
  );
};

export default PDFViewerPage;