'use client';

import { useState, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import * as fabric from 'fabric';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import samplePdf from '@/../Mohit-Tater-Resume-FE-2024.pdf';
import PDFToolbar from './PDFToolbar';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface RectangleText {
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

interface PDFViewerProps {
  url: string;
  onExtractText: (extractedText: RectangleText) => void;
  onDeleteText: (id: string) => void;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ url, onExtractText, onDeleteText }) => {
  // State declarations
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageDimensions, setPageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [isRectangleMode, setIsRectangleMode] = useState(false);
  const [pdfDocument, setPdfDocument] = useState<pdfjs.PDFDocumentProxy | null>(null);

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);

  // PDF handling functions
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
    pdfjs.getDocument(samplePdf).promise.then(setPdfDocument);
  };

  const onPageRenderSuccess = (page: any) => {
    const { width, height } = page.getViewport({ scale: 1 });
    setPageDimensions({ width, height });
  };

  const changePage = (offset: number) => {
    setPageNumber((prevPageNumber) => prevPageNumber + offset);
  };

  const previousPage = () => changePage(-1);
  const nextPage = () => changePage(1);

  // Canvas and annotation functions
  const saveRectangles = () => {
    if (fabricCanvasRef.current) {
      const rectangles = fabricCanvasRef.current.getObjects('rect').map(obj => obj.toObject());
      localStorage.setItem(`pdfRectangles_${pageNumber}`, JSON.stringify(rectangles));
    }
  };

  const toggleDrawingMode = () => {
    setIsDrawingMode((prevMode) => {
      const newMode = !prevMode;
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.isDrawingMode = newMode;
      }
      return newMode;
    });
  };

  const toggleRectangleMode = () => {
    setIsRectangleMode(!isRectangleMode);
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.isDrawingMode = false;
      setIsDrawingMode(false);
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
      localStorage.removeItem(`pdfRectangles_${pageNumber}`);
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

  // Effects
  useEffect(() => {
    if (canvasRef.current && pageDimensions) {
      const fabricCanvas = new fabric.Canvas(canvasRef.current, {
        isDrawingMode: isDrawingMode,
      });
      fabricCanvas.setDimensions(pageDimensions);

      const savedRectangles = JSON.parse(localStorage.getItem(`pdfRectangles_${pageNumber}`) || '[]');
      savedRectangles.forEach((rect: any) => {
        fabricCanvas.add(new fabric.Rect(rect));
      });

      fabricCanvas.on('object:added', saveRectangles);

      fabricCanvasRef.current = fabricCanvas;
    }

    return () => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
      }
    };
  }, [pageDimensions, isDrawingMode, pageNumber]);

  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (canvas && isRectangleMode) {
      let isDown = false;
      let startX = 0;
      let startY = 0;
      let rect: fabric.Rect | null = null;

      const handleMouseDown = (o: fabric.TEvent) => {
        const pointer = canvas.getPointer(o.e);
        const clickedObject = canvas.findTarget(o.e);
        if (clickedObject) {
          canvas.setActiveObject(clickedObject);
          return;
        }

        isDown = true;
        startX = pointer.x;
        startY = pointer.y;
      };

      const handleMouseMove = (o: fabric.TEvent) => {
        if (!isDown) return;
        const pointer = canvas.getPointer(o.e);
        if (!rect) {
          rect = new fabric.Rect({
            left: startX,
            top: startY,
            width: pointer.x - startX,
            height: pointer.y - startY,
            fill: 'transparent',
            stroke: 'red',
            strokeWidth: 2,
            id: `rect_${Date.now()}`,
          });
          canvas.add(rect);
        } else {
          rect.set({
            width: Math.abs(pointer.x - startX),
            height: Math.abs(pointer.y - startY),
            left: Math.min(startX, pointer.x),
            top: Math.min(startY, pointer.y),
          });
        }
        canvas.renderAll();
      };

      const handleMouseUp = () => {
        isDown = false;
        if (rect) {
          if (rect.width < 10 || rect.height < 10) {
            canvas.remove(rect);
          } else {
            canvas.setActiveObject(rect);
            saveRectangles();
            extractTextFromRectangle(rect);
          }
          rect = null;
        }
      };

      canvas.on('mouse:down', handleMouseDown);
      canvas.on('mouse:move', handleMouseMove);
      canvas.on('mouse:up', handleMouseUp);

      return () => {
        canvas.off('mouse:down', handleMouseDown);
        canvas.off('mouse:move', handleMouseMove);
        canvas.off('mouse:up', handleMouseUp);
      };
    }
  }, [isRectangleMode, pageNumber, extractTextFromRectangle]);

  if (!url) {
    return <div>No PDF selected</div>;
  }

  return (
    <div className="relative flex-1 w-full h-full flex">
      <div className="relative flex-grow">
        <Document file={samplePdf} onLoadSuccess={onDocumentLoadSuccess}>
          <Page
            pageNumber={pageNumber}
            onRenderSuccess={onPageRenderSuccess}
            renderTextLayer={true}
            renderAnnotationLayer={true}
          />
        </Document>
        {pageDimensions && (
          <div
            className="absolute top-0 left-0 z-10"
            style={{
              width: `${pageDimensions.width}px`,
              height: `${pageDimensions.height}px`,
            }}
          >
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0"
              width={pageDimensions.width}
              height={pageDimensions.height}
            />
          </div>
        )}
      </div>

      <PDFToolbar
        isDrawingMode={isDrawingMode}
        isRectangleMode={isRectangleMode}
        pageNumber={pageNumber}
        numPages={numPages}
        toggleDrawingMode={toggleDrawingMode}
        toggleRectangleMode={toggleRectangleMode}
        deleteSelectedObject={deleteSelectedObject}
        clearAllAnnotations={clearAllAnnotations}
        extractTextFromRectangle={extractTextFromRectangle}
        previousPage={previousPage}
        nextPage={nextPage}
      />
    </div>
  );
};

export default PDFViewer;