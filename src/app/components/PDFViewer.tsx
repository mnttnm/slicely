'use client';

import { useRef, useEffect } from 'react';
import * as fabric from 'fabric';
import PDFToolbar from './PDFToolbar';
import PDFRenderer from './PDFRenderer';
import AnnotationCanvas from './AnnotationCanvas';
import { useSlicerControl } from '@/app/contexts/SlicerControlContext';
import { RectangleText, ProcessingRules } from '@/app/types';
import { FileIcon } from 'lucide-react';
import { saveAnnotations } from '@/server/actions/studio/actions';

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

  useEffect(() => {
    if (url) {
      fetchSignedPdfUrl(url);
    }
  }, [url, fetchSignedPdfUrl]);

  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);

  const saveRectangles = async (rectangles: fabric.Object[]) => {
    if (!processingRules) return;

    const updatedRules = { ...processingRules };
    const pageAnnotation = updatedRules.annotations.find(a => a.page === pageNumber);

    const transformedRectangles = rectangles.map((rect: any) => ({
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    }));

    if (pageAnnotation) {
      pageAnnotation.rectangles = transformedRectangles;
    } else {
      updatedRules.annotations.push({
        page: pageNumber,
        rectangles: transformedRectangles,
      });
    }

    onUpdateAnnotations(updatedRules);

    try {
      await saveAnnotations(slicerId, updatedRules);
    } catch (error) {
      console.error('Error saving annotations:', error);
    }
  };

  // const handleExtractedText = (newExtractedText: RectangleText) => {
  //   setExtractedTexts(prev => [...prev, newExtractedText]);
  //   onExtractText(newExtractedText);
  // };

  // const handleDeleteText = (id?: string, deleteAll?: boolean) => {
  //   if (deleteAll) {
  //     setExtractedTexts([]);
  //   } else {
  //     setExtractedTexts(prev => prev.filter(text => text.id !== id));
  //   }
  //   onDeleteText(id, deleteAll);
  // };

  const deleteSelectedObject = () => {
    if (fabricCanvasRef.current) {
      const activeObject = fabricCanvasRef.current.getActiveObject();
      if (activeObject) {
        if (activeObject.type === 'rect') {
          const rect = activeObject as fabric.Rect & { id: string };
          onDeleteText(rect.id);
        }
        fabricCanvasRef.current.remove(activeObject);
        saveRectangles(fabricCanvasRef.current.getObjects('rect'));
      }
    }
  };

  const clearAllAnnotations = () => {
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.clear();

      // Clear only the annotations for the current page
      if (processingRules) {
        const updatedRules = { ...processingRules };
        updatedRules.annotations = updatedRules.annotations.filter(a => a.page !== pageNumber);
        onUpdateAnnotations(updatedRules);
      }

      // Delete extracted text only for the current page
      onDeleteText(undefined, true, pageNumber);

      saveRectangles([]);
    }
  };

  const extractTextFromRectangle = async (rect?: fabric.Rect) => {
    if (!fabricCanvasRef.current || !pdfDocument) return;

    const targetRect = rect || (fabricCanvasRef.current.getActiveObject() as fabric.Rect);
    if (!targetRect || targetRect.type !== 'rect') return;

    const page = await pdfDocument.getPage(pageNumber);
    const scale = (await page.getViewport({ scale: 1 })).scale;

    const { left, top, width, height } = targetRect;
    const scaledRect = {
      left: left / scale,
      top: top / scale,
      width: width / scale,
      height: height / scale,
    };

    try {
      const textContent = await page.getTextContent();
      const pageViewport = page.getViewport({ scale: 1 });
      const extractedText = textContent.items
        .filter((item: any) => {
          const [x, y] = item.transform.slice(-2);
          const [newX, newY] = pageViewport.convertToViewportPoint(x, y);
          return (
            newX >= scaledRect.left &&
            newX <= scaledRect.left + scaledRect.width &&
            newY >= scaledRect.top &&
            newY <= scaledRect.top + scaledRect.height
          );
        })
        .map((item) => item.str)
        .join(' ');

      onExtractText({
        id: (targetRect as any).id,
        pageNumber,
        text: extractedText,
        rectangleInfo: {
          left: scaledRect.left,
          top: scaledRect.top,
          width: scaledRect.width,
          height: scaledRect.height,
        },
      });

      console.log('Extracted text:', extractedText);
    } catch (error) {
      console.error('Error extracting text:', error);
    }
  };

  const handleRectangleCreated = (rect: fabric.Rect) => {
    if (fabricCanvasRef.current) {
      console.log('handleRectangleCreated', rect);
      const rectangles = fabricCanvasRef.current.getObjects('rect');
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