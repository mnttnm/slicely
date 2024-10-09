"use server";

import { ExtractedText, FabricRect, ProcessingRules } from "@/app/types";
import { getPagesToInclude, getPageText } from "@/app/utils/pdf-utils";
import { extractTextFromRectangle } from "@/app/utils/text-extraction";
import * as pdfjs from "pdfjs-dist";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
await import("pdfjs-dist/legacy/build/pdf.worker.mjs");

export async function extractPdfContent(
  pdfUrl: string,
  processingRules: ProcessingRules,
  password?: string
): Promise<ExtractedText[]> {
  const pdfDocument = await getDocument({ url: pdfUrl, password }).promise;
  return extractContentFromDocument(pdfDocument, processingRules);
}

async function extractContentFromDocument(
  pdfDocument: pdfjs.PDFDocumentProxy,
  processingRules: ProcessingRules
): Promise<ExtractedText[]> {
  const extractedTexts: ExtractedText[] = [];
  const totalPages = pdfDocument.numPages;
  const pagesToInclude = await getPagesToInclude(processingRules, totalPages);
  for (let pageNumber = 1; pageNumber <= totalPages; pageNumber++) {
    const pageAnnotation = processingRules.annotations.find(a => a.page === pageNumber);
    const isPageSkipped = !pagesToInclude.includes(pageNumber);
    const page = await pdfDocument.getPage(pageNumber);
    if (pageAnnotation) {
      for (const rect of pageAnnotation.rectangles) {
        const extractedText = await extractTextFromRectangle(page, rect as FabricRect);
        extractedTexts.push({
          id: rect.id,
          page_number: pageNumber,
          text: extractedText || "",
          rectangle_info: rect as FabricRect
        });
      }
    } else if (!isPageSkipped) {
      const fullPageContent = await getPageText(pdfDocument, pageNumber);
      extractedTexts.push({
        id: `full-page-${pageNumber}`,
        page_number: pageNumber,
        text: fullPageContent || "",
        rectangle_info: null
      });
    }
  }

  return extractedTexts;
}