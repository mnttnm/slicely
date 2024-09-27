'use client';

import { useRef, useCallback } from 'react';
import * as fabric from 'fabric';
import PDFToolbar from './PDFToolbar';
import PDFRenderer from './PDFRenderer';
import { AnnotationCanvas } from './AnnotationCanvas';
import { usePDFViewer } from '@/app/contexts/PDFViewerContext';
import { ProcessingRules } from '@/app/types';
import { useAnnotations } from "@/app/hooks/useAnnotations";
import { FabricRect } from '../types';
import { serializeFabricRect } from '@/app/utils/fabricHelper';

interface PDFViewerProps {
  url: string;
  onRectangleUpdate(operation: "add" | "remove", payload: { id: string, rect?: Partial<FabricRect>, pageNumber?: number }): void;
  onClearPage: (pageNumber: number) => void;
  onClearAllPages: () => void;
  processingRules: ProcessingRules | null;
  onPageExclude: (pageNumber: number) => void;
  onPageInclude: (pageNumber: number) => void;
  onPageExcludeAll: () => void;
  onPageIncludeAll: () => void;
  showToolbar?: boolean;
  pdf_password?: string;
}
const PDFViewer: React.FC<PDFViewerProps> = ({
  url,
  onRectangleUpdate,
  onClearPage,
  onClearAllPages,
  processingRules,
  onPageExclude,
  onPageInclude,
  onPageExcludeAll,
  onPageIncludeAll,
  showToolbar = true,
  pdf_password
  pdf_password
}) => {
  const {
    numPages,
    pageNumber,
    pageDimensions,
    isRectangleMode,
    skippedPages,
    togglePageSkip,
    onDocumentLoadSuccess,
    onPageRenderSuccess,
    previousPage,
    nextPage,
    toggleRectangleMode,
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


  const handleRectangleCreated = useCallback(async (rect: FabricRect) => {
    if (fabricCanvasRef.current) {
      const serializedRect = serializeFabricRect(rect);
      onRectangleUpdate("add", { id: rect.id, rect: serializedRect, pageNumber });
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
    <>
      <div className="relative flex flex-col h-full w-full">
        {url ? (
          <div className="relative flex justify-center items-start flex-grow overflow-auto">
            <div className="relative">
              <PDFRenderer
                url={url}
                pageNumber={pageNumber}
                onDocumentLoadSuccess={onDocumentLoadSuccess}
                onPageRenderSuccess={onPageRenderSuccess}
                skippedPages={processingRules?.skipped_pages || []}
                password={pdf_password}
                password={pdf_password}
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

      {showToolbar && (
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
      )}
    </>
  );
};

export default PDFViewer;