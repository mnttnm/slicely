'use client';

import { useRef, useEffect } from 'react';
import * as fabric from 'fabric';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import PDFToolbar from './PDFToolbar';
import PDFRenderer from './PDFRenderer';
import AnnotationCanvas from './AnnotationCanvas';
import { usePDFViewer } from '@/app/contexts/PDFViewerContext';
import { RectangleText } from '@/app/types';
import { FileIcon } from 'lucide-react';

interface PDFViewerProps {
  url: string;
  onExtractText: (extractedText: RectangleText) => void;
  onDeleteText: (id?: string, deleteAll?: boolean) => void;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ url, onExtractText, onDeleteText }) => {
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
    updatePageAnnotations,
  } = usePDFViewer();

  useEffect(() => {
    if (url) {
      fetchSignedPdfUrl(url);
    }
  }, [url, fetchSignedPdfUrl]);

  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);

  const saveRectangles = () => {
    if (fabricCanvasRef.current) {
      const rectangles = fabricCanvasRef.current.getObjects('rect').map(obj => obj.toObject());
      console.log('save rectangles', rectangles);
      const transformedRectangles = rectangles.map((rect: any) => ({
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      }));
      updatePageAnnotations(transformedRectangles);
      localStorage.setItem(`pdfRectangles_${pageNumber}`, JSON.stringify(rectangles));
    }
  };

  const deleteSelectedObject = () => {
    if (fabricCanvasRef.current) {
      const activeObject = fabricCanvasRef.current.getActiveObject();
      if (activeObject) {
        if (activeObject.type === 'rect') {
          const rect = activeObject as fabric.Rect & { id: string };
          onDeleteText(rect.id);
        }
        fabricCanvasRef.current.remove(activeObject);
        saveRectangles();
      }
    }
  };

  const clearAllAnnotations = () => {
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.clear();
      onDeleteText(undefined, true);
      localStorage.removeItem(`pdfRectangles_${pageNumber}`);
      saveRectangles();
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
    saveRectangles();
    extractTextFromRectangle(rect);
  };

  const handleCanvasReady = (canvas: fabric.Canvas) => {
    fabricCanvasRef.current = canvas;
  };

  return (
    <div className="relative w-1/2 h-full flex">
      <div className="flex flex-col h-full w-full">
        <header className="flex items-center space-x-2 border-b p-2 border-gray-300">
          <FileIcon className="h-4 w-4 flex justify-center items-center" />
          <h2 className="text-lg font-medium">{`Slicer:some name`}</h2>
        </header>
        {pdfUrl ? <div className="relative flex justify-center items-start flex-grow overflow-auto">
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
                />
              </div>
            )}
          </div>
        </div> : <div>Loading PDF...</div>}
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
      />
    </div>
  );
};

export default PDFViewer;