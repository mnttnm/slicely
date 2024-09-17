"use server";

import { PDFMetadata, ProcessedPageOutput, FabricRect } from "@/app/types";
import { getSignedPdfUrl, getAnnotations } from "@/server/actions/studio/actions";
import { extractTextFromRectangle } from "@/app/utils/textExtraction";
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';

export async function ProcessPdf(pdf: PDFMetadata, slicerId: string): Promise<ProcessedPageOutput[]> {
  console.log("Processing PDF", pdf, slicerId);

  // 1. Get the signed URL for the PDF
  const pdfUrl = await getSignedPdfUrl(pdf.file_path);

  // 2. Load the PDF document
  const pdfDocument = await pdfjs.getDocument(pdfUrl).promise;

  // 3. Get the processing rules for the slicer
  const processingRules = await getAnnotations(slicerId);

  if (!processingRules) {
    throw new Error("No processing rules found for this slicer");
  }

  // 4. Process each page
  const processedOutput: ProcessedPageOutput[] = [];

  for (const { page, rectangles } of processingRules.annotations) {
    console.log(page);
    const pageObj = await pdfDocument.getPage(page);

    const output: ProcessedPageOutput = {
      pageNumber: page,
      rawPageContent: "",
      extractedSectionTexts: [],
      llmOutputs: [],
    };

    const extractionPromises = rectangles.map(async (rect: FabricRect) => {
      const text = await extractTextFromRectangle(pageObj, rect);
      return {
        id: rect.id,
        pageNumber: page,
        text,
        rectangleInfo: {
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
        },
      };
    });

    output.extractedSectionTexts = await Promise.all(extractionPromises);
    processedOutput.push(output);
  }

  console.log("processedOutput", JSON.stringify(processedOutput));
  return processedOutput;
}