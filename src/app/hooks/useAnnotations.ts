import { useCallback } from "react";
import * as fabric from "fabric";

export const useAnnotations = (
  fabricCanvasRef: React.RefObject<fabric.Canvas>,
) => {

  const deleteSelectedObject = useCallback(() => {
    if (fabricCanvasRef.current) {
      const activeObject = fabricCanvasRef.current.getActiveObject();
      if (activeObject) {
        if (activeObject.type === 'rect') {
          // const rect = activeObject as FabricRect;
          fabricCanvasRef.current.remove(activeObject);
          // if (processingRules) {
          //   // find the rectangle in the processing rules and remove it
          //   const currentPageAnnotations = processingRules.annotations.find(annotation => annotation.page === pageNumber);
          //   if (currentPageAnnotations) {
          //     currentPageAnnotations.rectangles = currentPageAnnotations.rectangles.filter(annotation => annotation.id !== rect.id);
          //     // onProcessingRulesUpdate({ ...processingRules, annotations: processingRules.annotations.map(annotation => annotation.page === pageNumber ? currentPageAnnotations : annotation) });
          //   }
          // }
        }
      }
      return activeObject?.get("id");
    }
  }, [fabricCanvasRef]);

  const clearAnnotationFromCurrentPage = useCallback(() => {
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.clear();

      // if (processingRules) {
      //   const updatedRules = { ...processingRules };
      //   updatedRules.annotations = updatedRules.annotations.filter(a => a.page !== pageNumber);
      //   // onProcessingRulesUpdate(updatedRules);
      // }
    }
  }, [fabricCanvasRef]);

  return { deleteSelectedObject, clearAnnotationFromCurrentPage };
};