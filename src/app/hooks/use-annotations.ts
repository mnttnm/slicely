import { useCallback } from "react";
import * as fabric from "fabric";

export const useAnnotations = (
  fabricCanvasRef: React.RefObject<fabric.Canvas>,
) => {

  const deleteSelectedObject = useCallback(() => {
    if (fabricCanvasRef.current) {
      const activeObject = fabricCanvasRef.current.getActiveObject();
      const id = activeObject?.get("id");
      if (activeObject) {
        if (activeObject.type === "rect") {
          fabricCanvasRef.current.remove(activeObject);
        }
      }
      return id;
    }
  }, [fabricCanvasRef]);

  const clearAnnotationFromCurrentPage = useCallback(() => {
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.clear();
    }
  }, [fabricCanvasRef]);

  return { deleteSelectedObject, clearAnnotationFromCurrentPage };
};