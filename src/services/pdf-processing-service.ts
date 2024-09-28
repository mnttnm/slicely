"use server";

import { FabricRect, PDFMetadata, ProcessedOutput } from "@/app/types";
import { extractTextFromRectangle } from "@/app/utils/text-extraction";
import { getChatCompletion } from "@/lib/openai";
import { getAnnotations, getSignedPdfUrl } from "@/server/actions/studio/actions";
import { TablesInsert } from "@/types/supabase-types/database.types";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
await import("pdfjs-dist/legacy/build/pdf.worker.mjs");

export async function ProcessPdf(pdf: PDFMetadata, slicerId: string): Promise<ProcessedOutput[]> {
  // 1. Get the signed URL for the PDF
  const pdfUrl = await getSignedPdfUrl(pdf.file_path);

  // 2. Load the PDF document
  const pdfDocument = await getDocument({
    url: pdfUrl,
    password: pdf.password,
  }).promise;

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

      // Apply annotation-level rule if exists
      const annotationRule = processingRules.annotation_rules.find(r => r.annotation_id === rect.id);
      let processedText = text;
      if (annotationRule) {
        processedText = await getChatCompletion([{ role: "user", content: text }]);
      }

      // Apply page-level rule if exists
      const pageRule = processingRules.page_rules.find(r => r.page_number === page);
      if (pageRule) {
        processedText = await getChatCompletion([{ role: "user", content: processedText }]);
      }

      // Apply file-level rule if exists
      if (processingRules.file_rule) {
        processedText = await getChatCompletion([{ role: "user", content: processedText }]);
      }

      const processedOutput: TablesInsert<"outputs"> = {
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
        text_content: processedText,
      };

      return processedOutput as ProcessedOutput;
    });

    const extractedSectionTexts = await Promise.all(extractionPromises);
    processedOutput.push(...extractedSectionTexts);
  }

  return processedOutput;
}