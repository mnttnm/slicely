'use client';

import { useRef, useEffect } from 'react';
import * as fabric from 'fabric';
import PDFToolbar from './PDFToolbar';
import PDFRenderer from './PDFRenderer';
import AnnotationCanvas from './AnnotationCanvas';
import { useSlicerControl } from '@/app/contexts/SlicerControlContext';
import { RectangleText, ProcessingRules } from '@/app/types';
import { FileIcon } from 'lucide-react';
import { useAnnotations } from "@/app/hooks/useAnnotations";
import { useTextExtraction } from "@/app/hooks/useTextExtraction";
import { PDFDocumentProxy } from 'pdfjs-dist';
import { FabricRect } from '../types';

interface PDFViewerProps {
  url: string;
  onExtractText: (extractedText: RectangleText) => void;
  onDeleteText: (id?: string, deleteAll?: boolean, pageNumber?: number) => void;
  processingRules: ProcessingRules | null;
  onUpdateAnnotations: (updatedRules: ProcessingRules) => void;
  slicerId: string;
}

const PDFViewer: React.FC<PDFViewerProps> = ({
  url,
  onExtractText,
  onDeleteText,
  processingRules,
  onUpdateAnnotations,
  slicerId
}) => {

  const {
    numPages,
    pageNumber,
    pageDimensions,
    isRectangleMode,
    pdfDocument,
    pdfUrl,
    skippedPages,
    togglePageSkip,
    onDocumentLoadSuccess,
    onPageRenderSuccess,
    previousPage,
    nextPage,
    toggleRectangleMode,
    fetchSignedPdfUrl,
    clearAllPages,
    includeAllPages,
    excludeAllPages,
    jumpToPage,
  } = useSlicerControl();

  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);

  const {
    saveRectangles,
    deleteSelectedObject,
    clearAllAnnotations,
  } = useAnnotations(fabricCanvasRef, processingRules, onUpdateAnnotations, slicerId, pageNumber, onDeleteText);

  const { extractTextFromRectangle } = useTextExtraction(
    fabricCanvasRef,
    pdfDocument as PDFDocumentProxy | null,
    pageNumber,
    onExtractText
  );

  useEffect(() => {
    if (url) {
      fetchSignedPdfUrl(url);
    }
  }, [url, fetchSignedPdfUrl]);

  const handleRectangleCreated = (rect: FabricRect) => {
    if (fabricCanvasRef.current) {
      console.log('handleRectangleCreated', rect);
      const rectangles = fabricCanvasRef.current.getObjects('rect') as FabricRect[];
      saveRectangles(rectangles);
      extractTextFromRectangle(rect);
    }
  };

  const handleCanvasReady = (canvas: fabric.Canvas) => {
    fabricCanvasRef.current = canvas;
  };

  return (
    <div className="relative w-1/2 h-full flex">
      <div className="flex flex-col h-full w-full">
        <header className="flex items-center space-x-2 border-b p-2 border-gray-300">
          <FileIcon className="h-4 w-4 flex justify-center items-center" />
          <h2 className="text-lg font-medium">{`Slicer: ${slicerId}`}</h2>
        </header>
        {pdfUrl ? (
          <div className="relative flex justify-center items-start flex-grow overflow-auto">
            <div className="relative">
              <PDFRenderer
                url={pdfUrl}
                pageNumber={pageNumber}
                onDocumentLoadSuccess={onDocumentLoadSuccess}
                onPageRenderSuccess={onPageRenderSuccess}
                skippedPages={skippedPages}
              />
              {pageDimensions && (
                <div
                  className="absolute inset-0 z-10"
                  style={{
                    width: `${pageDimensions.width}px`,
                    height: `${pageDimensions.height}px`,
                  }}
                >
                  <AnnotationCanvas
                    pageDimensions={pageDimensions}
                    isRectangleMode={isRectangleMode}
                    slicerId={slicerId}
                    pageNumber={pageNumber}
                    onRectangleCreated={handleRectangleCreated}
                    onCanvasReady={handleCanvasReady}
                    annotations={processingRules?.annotations || []}
                  />
                </div>
              )}
            </div>
          </div>
        ) : (
          <div>Loading PDF...</div>
        )}
      </div>

      <PDFToolbar
        isRectangleMode={isRectangleMode}
        pageNumber={pageNumber}
        numPages={numPages}
        toggleRectangleMode={toggleRectangleMode}
        deleteSelectedObject={deleteSelectedObject}
        clearAllAnnotations={clearAllAnnotations}
        extractTextFromRectangle={extractTextFromRectangle}
        previousPage={previousPage}
        nextPage={nextPage}
        isPageSkipped={skippedPages.includes(pageNumber)}
        togglePageSkip={togglePageSkip}
        clearAllPages={clearAllPages}
        includeAllPages={includeAllPages}
        excludeAllPages={excludeAllPages}
        jumpToPage={jumpToPage}
      />
    </div>
  );
};

export default PDFViewer;