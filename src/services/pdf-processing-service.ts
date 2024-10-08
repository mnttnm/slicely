"use server";

import { PDFMetadata } from "@/app/types";
import { extractPdfContent } from "@/server/actions/pdf-actions";
import { getAnnotations, getSignedPdfUrl, getSlicerDetails, saveSlicedContent, updatePDF } from "@/server/actions/studio/actions";
import { Tables, TablesInsert } from "@/types/supabase-types/database.types";

// extract content from pdf and returns output in the format to be inserted into the outputs table
export async function ProcessPdf(pdf: PDFMetadata, slicerId: string): Promise<TablesInsert<"outputs">[]> {
  const pdfUrl = await getSignedPdfUrl(pdf.file_path);
  const processingRules = await getAnnotations(slicerId);

  if (!processingRules) {
    throw new Error("No processing rules found for this slicer");
  }

  const extractedContent = await extractPdfContent(pdfUrl, processingRules, pdf.password);

  return extractedContent.map(content => ({
    page_number: content.page_number,
    pdf_id: pdf.id,
    slicer_id: slicerId,
    section_info: {
      type: content.rectangle_info ? "annotation_output" : "full_page_output",
      metadata: {
        id: content.id,
        rectangle_info: content.rectangle_info
      }
    },
    text_content: content.text,
  }));
}

export async function handlePDFProcessing(pdfDetails: Tables<"pdfs">, slicerId: string) {
  if (!slicerId) {
    throw new Error(`No slicer associated with PDF ${pdfDetails.file_name}. Please link a slicer first.`);
  }

  try {
    const { slicerDetails } = await getSlicerDetails(slicerId as string) ?? {};

    if (!slicerDetails) {
      throw new Error(`No slicer associated with PDF ${pdfDetails.file_name}. Please link a slicer first.`);
    }

    const result = await ProcessPdf({ ...pdfDetails, password: slicerDetails.pdf_password ?? undefined }, slicerId as string);
    // TODO: Currently it generates a new output every time,
    // so, even if the PDF is already processed, it will generate a new output.
    // We need to check if the output already exists in the database.
    // If it exists, we need to update the output.
    // Or while showing the output, we can show a timeline of the outputs.
    // If it doesn't exist, we need to insert the output.
    result.forEach(async (output) => {
      await saveSlicedContent(output);
    });

    const updatedData: Partial<PDFMetadata> = {
      file_processing_status: "processed",
    };

    try {
      await updatePDF(pdfDetails.id, updatedData);
    } catch (error) {
      throw new Error(`Error updating PDF ${pdfDetails.file_name} status: ${error instanceof Error ? error.message : String(error)}`);
    }
  } catch (error) {
    throw new Error(`Error processing PDF ${pdfDetails.file_name}: ${error instanceof Error ? error.message : String(error)}`);
  }
}
