"use client";

import { useRef, useEffect, useCallback } from 'react';
import * as fabric from 'fabric';
import { Rectangle, PageAnnotation, FabricRect } from '@/app/types';
import { RECTANGLE_FILL, RECTANGLE_STROKE, RECTANGLE_STROKE_WIDTH, MIN_RECTANGLE_SIZE } from "@/app/constants";

interface AnnotationCanvasProps {
  pageDimensions: { width: number; height: number };
  isRectangleMode: boolean;
  pageNumber: number;
  slicerId: string;
  onRectangleCreated: (rect: FabricRect) => void;
  onCanvasReady: (canvas: fabric.Canvas) => void;
  annotations: PageAnnotation[];
}

const AnnotationCanvas: React.FC<AnnotationCanvasProps> = ({
  pageDimensions,
  isRectangleMode,
  pageNumber,
  slicerId,
  onRectangleCreated,
  onCanvasReady,
  annotations,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);

  const renderAnnotations = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    canvas.clear();

    const pageAnnotation = annotations.find(a => a.page === pageNumber);
    if (pageAnnotation) {
      pageAnnotation.rectangles.forEach((rect: Rectangle) => {
        canvas.add(new fabric.Rect({
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
          fill: RECTANGLE_FILL,
          stroke: RECTANGLE_STROKE,
          strokeWidth: RECTANGLE_STROKE_WIDTH,
          selectable: true,
          hasControls: true,
          lockRotation: true,
          id: `rect_${Date.now()}_${Math.random()}`,
        }));
      });
    }
    canvas.renderAll();
  }, [annotations, pageNumber]);

  useEffect(() => {
    if (canvasRef.current && pageDimensions) {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
      }

      const fabricCanvas = new fabric.Canvas(canvasRef.current);
      fabricCanvas.setDimensions(pageDimensions);
      fabricCanvasRef.current = fabricCanvas;
      onCanvasReady(fabricCanvas);

      renderAnnotations();
    }

    return () => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
      }
    };
  }, [pageDimensions, onCanvasReady, renderAnnotations]);


  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    let isDown = false;
    let startX = 0;
    let startY = 0;
    let rect: fabric.Rect | null = null;

    const handleMouseDown = (o: fabric.TEvent) => {
      if (!isRectangleMode) return;
      const pointer = canvas.getViewportPoint(o.e);
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
      if (!isRectangleMode || !isDown) return;
      const pointer = canvas.getViewportPoint(o.e);
      if (!rect) {
        rect = new fabric.Rect({
          left: startX,
          top: startY,
          width: pointer.x - startX,
          height: pointer.y - startY,
          fill: RECTANGLE_FILL,
          stroke: RECTANGLE_STROKE,
          strokeWidth: RECTANGLE_STROKE_WIDTH,
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
      if (!isRectangleMode || !isDown) return;
      isDown = false;
      if (rect) {
        if (rect.width < MIN_RECTANGLE_SIZE || rect.height < MIN_RECTANGLE_SIZE) {
          canvas.remove(rect);
        } else {
          canvas.setActiveObject(rect);
          onRectangleCreated(rect); // Only call this, remove the local handleRectangleCreated
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
  }, [isRectangleMode, pageNumber, slicerId, annotations, onRectangleCreated]);

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