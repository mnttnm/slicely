'use client';

import { useRef, useEffect, useCallback } from 'react';
import * as fabric from 'fabric';
import PDFToolbar from './PDFToolbar';
import PDFRenderer from './PDFRenderer';
import { AnnotationCanvas } from './AnnotationCanvas';
import { usePDFViewer } from '@/app/contexts/PDFViewerContext';
import { ProcessingRules } from '@/app/types';
import { useAnnotations } from "@/app/hooks/useAnnotations";
import { FabricRect } from '../types';
import { pdfjs } from 'react-pdf';

interface PDFViewerProps {
  url: string;
  onRectangleUpdate(operation: "add" | "remove", payload: { id: string, rect?: FabricRect, pageNumber?: number }): void;
  onClearPage: (pageNumber: number) => void;
  onClearAllPages: () => void;
  processingRules: ProcessingRules | null;
  onPdfDocumentUpdate: (pdfDocument: pdfjs.PDFDocumentProxy) => void;
  onPageExclude: (pageNumber: number) => void;
  onPageInclude: (pageNumber: number) => void;
  onPageExcludeAll: () => void;
  onPageIncludeAll: () => void;
}

const PDFViewer: React.FC<PDFViewerProps> = ({
  url,
  onRectangleUpdate,
  onClearPage,
  onClearAllPages,
  processingRules,
  onPdfDocumentUpdate,
  onPageExclude,
  onPageInclude,
  onPageExcludeAll,
  onPageIncludeAll,
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
    includeAllPages,
    excludeAllPages,
    jumpToPage,
  } = usePDFViewer();

  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);

  const {
    deleteSelectedObject,
    clearAnnotationFromCurrentPage,
  } = useAnnotations(fabricCanvasRef);

  const handleAnnotationDelete = useCallback(() => {
    if (fabricCanvasRef.current) {
      const id = deleteSelectedObject();
      if (id) {
        onRectangleUpdate("remove", { id, pageNumber });
      }
    }
  }, [fabricCanvasRef, deleteSelectedObject, onRectangleUpdate, pageNumber]);

  const handleClearCurrentPage = useCallback(() => {
    clearAnnotationFromCurrentPage();
    onClearPage(pageNumber);
  }, [clearAnnotationFromCurrentPage, onClearPage, pageNumber]);

  const handleClearAllPages = useCallback(() => {
    onClearAllPages();
  }, [onClearAllPages]);

  useEffect(() => {
    if (url) {
      fetchSignedPdfUrl(url);
    }
  }, [url, fetchSignedPdfUrl]);

  useEffect(() => {
    if (pdfDocument) {
      onPdfDocumentUpdate(pdfDocument);
    }
  }, [pdfDocument, onPdfDocumentUpdate]);


  const handleRectangleCreated = useCallback(async (rect: FabricRect) => {
    if (fabricCanvasRef.current) {
      onRectangleUpdate("add", { id: rect.id, rect, pageNumber });
      // const extractedText = await extractTextFromRectangle(rect) ?? "";

      //extract text from rectangle
      // const newExtractedText: ExtractedText = {
      //   id: rect.id,
      //   pageNumber,
      //   text: extractedText,
      //   rectangleInfo: {
      //     left: rect.left,
      //     top: rect.top,
      //     width: rect.width,
      //     height: rect.height,
      //   },
      // };
      // onExtractText(newExtractedText);

      // Update the processing rules here
      // if (processingRules) {
      //   const updatedRules = { ...processingRules };
      //   const pageAnnotation = updatedRules.annotations.find(a => a.page === pageNumber);
      //   if (pageAnnotation) {
      //     pageAnnotation.rectangles.push(rect);
      //   } else {
      //     updatedRules.annotations.push({ page: pageNumber, rectangles: [rect] });
      //   }
      //   onProcessingRulesUpdate(updatedRules);
      // }
    }
  }, [fabricCanvasRef, onRectangleUpdate, pageNumber]);


  const handlePageToggle = useCallback((pageNumber: number) => {
    if (skippedPages.includes(pageNumber)) {
      onPageInclude(pageNumber);
    } else {
      onPageExclude(pageNumber);
    }
    togglePageSkip(pageNumber);
  }, [onPageInclude, onPageExclude, skippedPages, togglePageSkip]);

  const handlePageExcludeAll = useCallback(() => {
    excludeAllPages();
    onPageExcludeAll();
  }, [onPageExcludeAll, excludeAllPages]);

  const handlePageIncludeAll = useCallback(() => {
    includeAllPages();
    onPageIncludeAll();
  }, [onPageIncludeAll, includeAllPages]);


  const handleCanvasReady = useCallback((canvas: fabric.Canvas) => {
    fabricCanvasRef.current = canvas;
  }, []);

  return (
    <div className="relative w-1/2 h-full flex">
      <div className="flex flex-col h-full w-full">
        {/* <header className="flex items-center space-x-2 border-b p-2 border-gray-300">
          <FileIcon className="h-4 w-4 flex justify-center items-center" />
          <h2 className="text-lg font-medium">{`Slicer: ${slicerId}`}</h2>
        </header> */}
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
        deleteSelectedObject={handleAnnotationDelete}
        clearCurrentPage={handleClearCurrentPage}
        clearAllPages={handleClearAllPages}
        previousPage={previousPage}
        nextPage={nextPage}
        isPageSkipped={skippedPages.includes(pageNumber)}
        togglePageSkip={handlePageToggle}
        includeAllPages={handlePageIncludeAll}
        excludeAllPages={handlePageExcludeAll}
        jumpToPage={jumpToPage}
      />
    </div>
  );
};

export default PDFViewer;