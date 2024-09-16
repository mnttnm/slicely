import { useCallback } from "react";
import * as fabric from "fabric";
import { ProcessingRules, Rectangle, FabricRect } from "@/app/types";

export const useAnnotations = (
  fabricCanvasRef: React.RefObject<fabric.Canvas>,
  processingRules: ProcessingRules | undefined,
  onProcessingRulesUpdate: (updatedRules: ProcessingRules) => void,
  pageNumber: number,
) => {

  const deleteSelectedObject = useCallback(() => {
    if (fabricCanvasRef.current) {
      const activeObject = fabricCanvasRef.current.getActiveObject();
      if (activeObject) {
        if (activeObject.type === 'rect') {
          const rect = activeObject as FabricRect;
          fabricCanvasRef.current.remove(activeObject);
          if (processingRules) {
            // find the rectangle in the processing rules and remove it
            const currentPageAnnotations = processingRules.annotations.find(annotation => annotation.page === pageNumber);
            if (currentPageAnnotations) {
              currentPageAnnotations.rectangles = currentPageAnnotations.rectangles.filter(annotation => annotation.id !== rect.id);
              onProcessingRulesUpdate({ ...processingRules, annotations: processingRules.annotations.map(annotation => annotation.page === pageNumber ? currentPageAnnotations : annotation) });
            }
          }
        }
      }

    }
  }, [fabricCanvasRef, processingRules, pageNumber, onProcessingRulesUpdate]);

  const clearAnnotationFromCurrentPage = useCallback(() => {
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.clear();

      if (processingRules) {
        const updatedRules = { ...processingRules };
        updatedRules.annotations = updatedRules.annotations.filter(a => a.page !== pageNumber);
        onProcessingRulesUpdate(updatedRules);
      }
    }
  }, [fabricCanvasRef, processingRules, onProcessingRulesUpdate, pageNumber]);

  return { deleteSelectedObject, clearAnnotationFromCurrentPage: clearAnnotationFromCurrentPage };
};