"use server";

import { PDFMetadata, ProcessedOutput, FabricRect } from "@/app/types";
import { getSignedPdfUrl, getAnnotations, saveProcessedOutput } from "@/server/actions/studio/actions";
import { extractTextFromRectangle } from "@/app/utils/textExtraction";
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { TablesInsert } from "@/types/supabase-types/database.types";
await import('pdfjs-dist/legacy/build/pdf.worker.mjs');

export async function ProcessPdf(pdf: PDFMetadata, slicerId: string): Promise<ProcessedOutput[]> {
  console.log("Processing PDF", pdf, slicerId);

  // 1. Get the signed URL for the PDF
  const pdfUrl = await getSignedPdfUrl(pdf.file_path);

  // 2. Load the PDF document
  const pdfDocument = await getDocument(pdfUrl).promise;

  // 3. Get the processing rules for the slicer
  const processingRules = await getAnnotations(slicerId);

  if (!processingRules) {
    throw new Error("No processing rules found for this slicer");
  }

  // 4. Process each page
  const processedOutput: ProcessedOutput[] = [];

  for (const { page, rectangles } of processingRules.annotations) {
    const pageObj = await pdfDocument.getPage(page);

    const extractionPromises = rectangles.map(async (rect: FabricRect) => {
      const text = await extractTextFromRectangle(pageObj, rect);
      // Save each extracted text to the database
      const processedOutput: TablesInsert<'outputs'> = {
        pdf_id: pdf.id,
        slicer_id: slicerId,
        page_number: page,
        section_info: {
          type: "annotation_output",
          metadata: {
            rectangle_info: {
              id: rect.id,
              left: rect.left,
              top: rect.top,
              width: rect.width,
              height: rect.height,
            }
          }
        },
        text_content: text,
      };

      await saveProcessedOutput(processedOutput);

      return processedOutput as ProcessedOutput;
    });

    const extractedSectionTexts = await Promise.all(extractionPromises);
    processedOutput.push(...extractedSectionTexts);
  }

  console.log("processedOutput", JSON.stringify(processedOutput));
  return processedOutput;
}