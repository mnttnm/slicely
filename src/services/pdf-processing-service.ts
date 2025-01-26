"use server";

import { LLMPrompt, PDFMetadata } from "@/app/types";
import { extractPdfContent } from "@/server/actions/pdf-actions";
import { getAnnotations, getSignedPdfUrl, getSlicerDetails, savePdfLLMOutput, saveSlicedContent, updatePDF } from "@/server/actions/studio/actions";
import { createMessages, getContextForPdf, processWithLLM } from "@/utils/explore-utils";

// extract content from pdf and returns output in the format to be inserted into the outputs table
export async function ProcessPdf(pdf: PDFMetadata, slicerId: string){
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
    text_content: content.text
  }));
}

export async function handlePDFProcessing(pdfDetails: PDFMetadata, slicerId: string) {
  if (!slicerId) {
    throw new Error(`No slicer associated with PDF ${pdfDetails.file_name}. Please link a slicer first.`);
  }

  try {
    const { slicerDetails } = await getSlicerDetails(slicerId) ?? {};

    if (!slicerDetails) {
      throw new Error(`No slicer associated with PDF ${pdfDetails.file_name}. Please link a slicer first.`);
    }

    // Process PDF and generate sliced content
    const result = await ProcessPdf({ ...pdfDetails, password: slicerDetails.pdf_password ?? undefined }, slicerId);
    for (const output of result) {
      await saveSlicedContent(output);
    }

    // Process LLM prompts and store outputs
    const pdfPrompts: LLMPrompt[] = slicerDetails.pdf_prompts || [];

    for (const prompt of pdfPrompts) {
      const context = await getContextForPdf(pdfDetails.id);
      const messages = await createMessages(context, prompt.prompt);

      try {
        const llmResult = await processWithLLM(messages);
        const llmOutput = {
          pdf_id: pdfDetails.id,
          slicer_id: slicerId,
          prompt_id: prompt.id,
          prompt: prompt.prompt,
          output: llmResult
        };
        await savePdfLLMOutput(pdfDetails.id, slicerId, llmOutput);
      } catch (error) {
        throw new Error(`Error processing LLM for PDF ${pdfDetails.file_name}: ${error instanceof Error ? error.message : String(error)}`);
        // alert(`Error processing LLM for PDF ${pdfDetails.file_name}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // Update PDF processing status
    const updatedData: Partial<PDFMetadata> = {
      file_processing_status: "processed",
    };

    await updatePDF(pdfDetails.id, updatedData);
  } catch (error) {
    throw new Error(`Error processing PDF ${pdfDetails.file_name}: ${error instanceof Error ? error.message : String(error)}`);
  }
}
