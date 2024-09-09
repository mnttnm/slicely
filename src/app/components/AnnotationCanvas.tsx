import { useRef, useEffect } from 'react';
import * as fabric from 'fabric';

interface AnnotationCanvasProps {
  pageDimensions: { width: number; height: number };
  isRectangleMode: boolean;
  pageNumber: number;
  onRectangleCreated: (rect: fabric.Rect) => void;
  onCanvasReady: (canvas: fabric.Canvas) => void;
}

const AnnotationCanvas: React.FC<AnnotationCanvasProps> = ({
  pageDimensions,
  isRectangleMode,
  pageNumber,
  onRectangleCreated,
  onCanvasReady,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);

  useEffect(() => {
    if (canvasRef.current && pageDimensions) {
      const fabricCanvas = new fabric.Canvas(canvasRef.current);
      fabricCanvas.setDimensions(pageDimensions);

      const savedRectangles = JSON.parse(localStorage.getItem(`pdfRectangles_${pageNumber}`) || '[]');
      savedRectangles.forEach((rect: any) => {
        fabricCanvas.add(new fabric.Rect(rect));
      });

      fabricCanvasRef.current = fabricCanvas;
      onCanvasReady(fabricCanvas);
    }

    return () => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
      }
    };
  }, [pageDimensions, pageNumber, onCanvasReady]);

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
            onRectangleCreated(rect);
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
  }, [isRectangleMode, pageNumber, onRectangleCreated]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0"
      width={pageDimensions.width}
      height={pageDimensions.height}
    />
  );
};

export default AnnotationCanvas;