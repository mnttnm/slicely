import { useCallback } from "react";
import * as fabric from "fabric";
import { ProcessingRules, FabricRect } from "@/app/types";

import { saveAnnotations } from "@/server/actions/studio/actions";

export const useAnnotations = (
  fabricCanvasRef: React.RefObject<fabric.Canvas>,
  processingRules: ProcessingRules | null,
  onUpdateAnnotations: (updatedRules: ProcessingRules) => void,
  slicerId: string,
  pageNumber: number,
  onDeleteText: (id?: string, deleteAll?: boolean, pageNumber?: number) => void
) => {
  const saveRectangles = useCallback(async (rectangles: FabricRect[]) => {
    if (!processingRules) return;

    const updatedRules = { ...processingRules };
    const pageAnnotation = updatedRules.annotations.find(a => a.page === pageNumber);

    const transformedRectangles = rectangles.map(rect => ({
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
  }, [processingRules, pageNumber, onUpdateAnnotations, slicerId]);

  const deleteSelectedObject = useCallback(() => {
    if (fabricCanvasRef.current) {
      const activeObject = fabricCanvasRef.current.getActiveObject();
      if (activeObject) {
        if (activeObject.type === 'rect') {
          const rect = activeObject as FabricRect;
          onDeleteText(rect.id);
        }
        fabricCanvasRef.current.remove(activeObject);
        saveRectangles(fabricCanvasRef.current.getObjects('rect') as FabricRect[]);
      }
    }
  }, [fabricCanvasRef, onDeleteText, saveRectangles]);

  const clearAllAnnotations = useCallback(() => {
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.clear();

      if (processingRules) {
        const updatedRules = { ...processingRules };
        updatedRules.annotations = updatedRules.annotations.filter(a => a.page !== pageNumber);
        onUpdateAnnotations(updatedRules);
      }

      onDeleteText(undefined, true, pageNumber);
      saveRectangles([]);
    }
  }, [fabricCanvasRef, processingRules, onUpdateAnnotations, onDeleteText, pageNumber, saveRectangles]);

  return { saveRectangles, deleteSelectedObject, clearAllAnnotations };
};