"use client";

import { usePDFViewer } from "@/app/contexts/pdf-viewer-context";
import { useAnnotations } from "@/app/hooks/use-annotations";
import { ProcessingRules } from "@/app/types";
import { serializeFabricRect } from "@/app/utils/fabric-helper";
import { getPagesToInclude } from "@/app/utils/pdf-utils";
import * as fabric from "fabric";
import { useCallback, useEffect, useRef } from "react";
import { FabricRect } from "../types";
import { AnnotationCanvas } from "./annotation-canvas";
import PDFRenderer from "./pdf-renderer";
import PDFToolbar from "./pdf-toolbar";

interface PDFViewerProps {
  url: string;
  onRectangleUpdate(operation: "add" | "remove", payload: { id: string, rect?: Partial<FabricRect>, pageNumber?: number }): void;
  onClearPage: (pageNumber: number) => void;
  onClearAllPages: () => void;
  processingRules: ProcessingRules;
  showToolbar?: boolean;
  pdf_password?: string;
}

const PDFViewer: React.FC<PDFViewerProps> = ({
  url,
  onRectangleUpdate,
  onClearPage,
  onClearAllPages,
  processingRules,
  showToolbar = true,
  pdf_password
}) => {
  const {
    numPages,
    pageNumber,
    pageDimensions,
    isRectangleMode,
    onDocumentLoadSuccess,
    onPageRenderSuccess,
    previousPage,
    nextPage,
    clearAllPages,
    toggleRectangleMode,
    includeAllPages,
    excludeAllPages,
    jumpToPage,
    togglePageSkip,
    updateProcessingRules,
    currentProcessingRules
  } = usePDFViewer();

  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);

  const {
    deleteSelectedObject,
    clearAnnotationFromCurrentPage,
  } = useAnnotations(fabricCanvasRef);

  // Sync processing rules with usePDFViewer context
  useEffect(() => {
    updateProcessingRules(processingRules);
  }, [processingRules, updateProcessingRules]);

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
    clearAllPages();
    onClearAllPages();
  }, [clearAllPages, onClearAllPages]);

  const handleRectangleCreated = useCallback(async (rect: FabricRect) => {
    if (fabricCanvasRef.current) {
      const serializedRect = serializeFabricRect(rect);
      onRectangleUpdate("add", { id: rect.id, rect: serializedRect, pageNumber });
    }
  }, [fabricCanvasRef, onRectangleUpdate, pageNumber]);

  const handlePageToggle = useCallback((pageNumber: number) => {
    console.log("handlePageToggle called for page", pageNumber);
    // Call togglePageSkip from the context
    togglePageSkip(pageNumber);
  }, [togglePageSkip]);

  const handleIncludeAll = useCallback(() => {
    includeAllPages();
  }, [includeAllPages]);

  const handleExcludeAll = useCallback(() => {
    excludeAllPages();
  }, [excludeAllPages]);

  const handleCanvasReady = useCallback((canvas: fabric.Canvas) => {
    fabricCanvasRef.current = canvas;
  }, []);

  const isPageSkipped = useCallback((pageNumber: number) => {
    const pagesToInclude = getPagesToInclude(currentProcessingRules, numPages || 0);
    return !pagesToInclude.includes(pageNumber);
  }, [currentProcessingRules, numPages]);

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
                processingRules={currentProcessingRules}
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
                    annotations={currentProcessingRules?.annotations || []}
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
          isPageSkipped={isPageSkipped(pageNumber)}
          togglePageSkip={() => handlePageToggle(pageNumber)}
          includeAllPages={handleIncludeAll}
          excludeAllPages={handleExcludeAll}
          jumpToPage={jumpToPage}
        />
      )}
    </>
  );
};

export default PDFViewer;