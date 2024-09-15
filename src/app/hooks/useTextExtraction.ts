import { useCallback } from "react";
import * as fabric from "fabric";
import { PDFDocumentProxy } from "pdfjs-dist";
import { RectangleText } from "@/app/types";

export const useTextExtraction = (
  fabricCanvasRef: React.RefObject<fabric.Canvas>,
  pdfDocument: PDFDocumentProxy | null,
  pageNumber: number,
  onExtractText: (extractedText: RectangleText) => void
) => {
  const extractTextFromRectangle = useCallback(async (rect?: fabric.Rect) => {
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
        .map((item: any) => item.str)
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
  }, [fabricCanvasRef, pdfDocument, pageNumber, onExtractText]);

  return { extractTextFromRectangle };
};