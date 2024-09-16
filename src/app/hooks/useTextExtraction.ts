import { useCallback } from "react";
import * as fabric from "fabric";
import { pdfjs } from "react-pdf";

export const useTextExtraction = (
  pdfDocument: pdfjs.PDFDocumentProxy | null,
) => {
  const extractTextFromRectangle = useCallback(async (rect: fabric.Rect, pageNumber: number) => {
    if (!pdfDocument || !rect) return;

    const page = await pdfDocument.getPage(pageNumber);
    const scale = (await page.getViewport({ scale: 1 })).scale;

    const { left, top, width, height } = rect;
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

      console.log('Extracted text:', extractedText);
      return extractedText;
    } catch (error) {
      console.error('Error extracting text:', error);
    }
  }, [pdfDocument]);

  return { extractTextFromRectangle };
};