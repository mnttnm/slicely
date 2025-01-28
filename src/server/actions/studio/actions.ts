"use server";

import { LLMPrompt, PdfLLMOutput, PDFMetadata, ProcessingRules, SectionInfo, SlicedPdfContent, SlicedPdfContentWithMetadata, Slicer, SlicerLLMOutput } from "@/app/types";
import { deserializeProcessingRules, serializeProcessingRules } from "@/app/utils/fabric-helper";
import { generateEmbedding } from "@/lib/embedding-utils";
import { LLMResponse } from "@/lib/openai";
import { createClient } from "@/server/services/supabase/server";
import { Tables, TablesInsert } from "@/types/supabase-types/database.types";
import { hashPassword, verifyPassword } from "@/utils/password-utils";
import { revalidatePath } from "next/cache";

export async function uploadPdf(formData: FormData): Promise<Tables<"pdfs">> {
  const supabase = createClient();
  // Get the authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Authentication failed");
  }

  // Extract fields from the form
  const file = formData.get("pdf") as File | null;
  if (!file || !(file instanceof File)) {
    throw new Error("Invalid file provided");
  }

  const isTemplate = formData.get("is_template") === "true";

  // Upload file to Supabase Storage
  const { data: fileData, error: uploadError } = await supabase.storage
    .from("slicely-pdfs")
    .upload(`${user.id}/${file.name}`, file, {
      contentType: "application/pdf",
    });

  if (uploadError) {
    console.error("Upload error:", uploadError);
    throw new Error("Failed to upload PDF");
  }

  // Insert PDF record into database
  const { data: newPdf, error: insertError } = await supabase
    .from("pdfs")
    .insert({
      file_name: file.name,
      file_path: fileData.path,
      is_template: isTemplate,
      user_id: user.id,
    })
    .select()
    .single();

  if (insertError) {
    console.error("Insert error:", insertError);
    throw new Error(insertError.message);
  }

  return newPdf;
}

export async function getUserPDFs(): Promise<(Tables<"pdfs"> & { slicer_ids: string[] })[]> {
  const supabase = createClient();
  const { data: pdfs, error } = await supabase
    .from("pdfs")
    .select(`
      *,
      pdf_slicers (slicer_id)
    `);

  if (error) {
    console.error("Error fetching PDFs:", error);
    throw new Error("Failed to fetch PDFs");
  }

  // Transform the data to include slicer_ids
  return (pdfs || []).map(pdf => ({
    ...pdf,
    slicer_ids: pdf.pdf_slicers.map(ps => ps.slicer_id),
    pdf_slicers: undefined // Remove this property as it's no longer needed
  }));
}

// fetch PDF from Supabase Storage
export async function fetchPDF(filePath: string): Promise<Blob | null> {
  const supabase = createClient();
  const { data, error } = await supabase.storage.from("slicely-pdfs").download(filePath);
  if (error) {
    console.error("Error fetching PDF:", error);
    throw new Error("Failed to fetch PDF");
  }
  return data;
}

export async function getSignedPdfUrl(filePath: string): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase
    .storage
    .from("slicely-pdfs")
    .createSignedUrl(filePath, 60 * 60); // URL valid for 1 hour

  if (error) {
    console.error("Error creating signed URL:", error);
    throw new Error("Failed to create signed URL for PDF");
  }

  return data.signedUrl;
}

export async function getPdfDetails(pdfId: string): Promise<{ pdfDetails: Tables<"pdfs">, slicer_ids: string[]; pdfUrl: string } | null> {
  const supabase = createClient();

  // First try to get the PDF
  const { data, error } = await supabase
    .from("pdfs")
    .select("*, pdf_slicers (slicer_id)")
    .eq("id", pdfId)
    .single();

  if (!data) {
    return null;
  }

  const { pdf_slicers: pdfSlicers, ...pdfDetails } = data;

  if (error) {
    console.error("Error fetching PDF details:", error);
    throw new Error("Failed to fetch PDF details");
  }

  const pdfUrl = await getSignedPdfUrl(pdfDetails.file_path);

  return {
    pdfDetails,
    slicer_ids: pdfSlicers.map(ps => ps.slicer_id),
    pdfUrl
  };
}

export async function getSlicers(): Promise<Tables<"slicers">[]> {
  const supabase = createClient();

  const { data: slicers, error } = await supabase
    .from("slicers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching slicers:", error);
    throw new Error("Failed to fetch slicers");
  }

  return slicers || [];
}

export async function createSlicer({ name, description, fileId, password, processingRules }: { name: string; description: string; fileId: string; password?: string; processingRules: ProcessingRules }) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Authentication failed");
  }

  // Hash the password if provided
  const hashedPassword = password ? await hashPassword(password) : null;

  // Create the new slicer
  const { data: newSlicer, error } = await supabase
    .from("slicers")
    .insert({
      name,
      description,
      processing_rules: serializeProcessingRules(processingRules),
      user_id: user.id,
      pdf_password: hashedPassword,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating slicer:", error);
    throw new Error("Failed to create slicer");
  }

  // Create the relationship in pdf_slicers
  const { error: relationError } = await supabase
    .from("pdf_slicers")
    .insert({
      pdf_id: fileId,
      slicer_id: newSlicer.id,
      user_id: user.id,
    });

  if (relationError) {
    console.error("Error creating pdf-slicer relationship:", relationError);
    // You might want to handle this error, possibly by deleting the created slicer
    throw new Error("Failed to link PDF to slicer");
  }

  // Update the PDF to mark it as a template
  const { error: updateError } = await supabase
    .from("pdfs")
    .update({ is_template: true })
    .eq("id", fileId);

  if (updateError) {
    console.error("Error updating PDF:", updateError);
    // You might want to handle this error
  }

  return newSlicer;
}

export async function updateSlicer(slicerId: string, slicer: Slicer) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Authentication failed");
  }

  const serializedProcessingRules = serializeProcessingRules(slicer.processing_rules);

  // Check if the password has changed
  let updatedPassword = slicer.pdf_password;
  if (slicer.pdf_password && slicer.pdf_password !== "") {
    // Only hash the password if it has changed
    const { data: currentSlicer } = await supabase
      .from("slicers")
      .select("pdf_password")
      .eq("id", slicerId)
      .single();

    if (currentSlicer && slicer.pdf_password !== currentSlicer.pdf_password) {
      updatedPassword = await hashPassword(slicer.pdf_password);
    }
  }

  const llmPrompts = slicer.llm_prompts?.map((prompt: LLMPrompt) => ({
    id: prompt.id,
    prompt: prompt.prompt
  }));

  const pdfPrompts = slicer.pdf_prompts?.map((prompt: LLMPrompt) => ({
    id: prompt.id,
    prompt: prompt.prompt
  }));

  const { data, error } = await supabase
    .from("slicers")
    .update({
      ...slicer,
      processing_rules: serializedProcessingRules,
      pdf_password: updatedPassword,
      llm_prompts: llmPrompts,
      pdf_prompts: pdfPrompts, // Ensure pdf_prompts are included
    })
    .eq("id", slicerId)
    .eq("user_id", user.id)
    .single();

  if (error) {
    console.error("Error updating slicer:", error);
    throw new Error("Failed to update slicer");
  }

  return data;
}

export async function updatePDF(pdfId: string, updatedData: Partial<PDFMetadata>): Promise<PDFMetadata> {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Authentication failed");
  }

  const { data, error } = await supabase
    .from("pdfs")
    .update(updatedData)
    .eq("id", pdfId)
    .single();

  if (error) {
    console.error("Error updating PDF:", error);
    throw new Error("Failed to update PDF");
  }

  revalidatePath("/studio/slicers");
  return data;
}

function deserializeSlicer(data: any): Slicer {
  return {
    ...data,
    llm_prompts: Array.isArray(data.llm_prompts) ? data.llm_prompts.map((p: any) => ({
      id: p.id,
      prompt: p.prompt
    })) : [],
    pdf_prompts: Array.isArray(data.pdf_prompts) ? data.pdf_prompts.map((p: any) => ({
      id: p.id,
      prompt: p.prompt
    })) : [],
    processing_rules: deserializeProcessingRules(data.processing_rules)
  };
}

export async function getSlicerDetails(slicerId: string): Promise<{ slicerDetails: Slicer; linkedPdfs: PDFMetadata[] } | null> {
  const supabase = createClient();

  // Get slicer details without requiring authentication
  const { data: slicerDetails, error } = await supabase
    .from("slicers")
    .select("*, pdf_slicers (pdfs(*))")
    .eq("id", slicerId)
    .single();

  if (error || !slicerDetails) {
    console.error("Error fetching slicer details:", error);
    return null;
  }

  if (!slicerDetails.pdf_slicers[0]?.pdfs) {
    return {
      slicerDetails: deserializeSlicer(slicerDetails),
      linkedPdfs: []
    };
  }

  const { pdf_slicers, ...slicerDetailsWithoutPdfSlicers } = slicerDetails;

  const linkedPdfs = pdf_slicers.map(ps => ps.pdfs);

  const processingRules = typeof slicerDetailsWithoutPdfSlicers.processing_rules === "string"
    ? deserializeProcessingRules(slicerDetailsWithoutPdfSlicers.processing_rules)
    : {
      annotations: [],
      pageSelection: {
        strategy: "include",
        rules: [
          { type: "all" }
        ]
      }
    };

  if (!processingRules) {
    throw new Error("Processing rules not found");
  }

  return {
    slicerDetails: deserializeSlicer(slicerDetailsWithoutPdfSlicers),
    linkedPdfs: linkedPdfs as PDFMetadata[]
  };
}

export async function saveAnnotations(slicerId: string, annotations: ProcessingRules) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Authentication required");
  }

  // First verify if the user owns this slicer
  const { data: slicer } = await supabase
    .from("slicers")
    .select("user_id")
    .eq("id", slicerId)
    .single();

  if (!slicer || slicer.user_id !== user.id) {
    throw new Error("Access denied: You can only edit your own slicers");
  }

  const serializedAnnotations = serializeProcessingRules(annotations);

  const { data, error } = await supabase
    .from("slicers")
    .update({ processing_rules: serializedAnnotations })
    .eq("id", slicerId)
    .eq("user_id", user.id)
    .single();

  if (error) {
    console.error("Error saving annotations:", error);
    throw new Error("Failed to save annotations");
  }

  return data;
}

export async function getAnnotations(slicerId: string): Promise<ProcessingRules | null> {
  const supabase = createClient();
  // const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("slicers")
    .select("processing_rules")
    .eq("id", slicerId)
    .single();

  if (error) {
    console.error("Error fetching annotations:", error);
    throw new Error("Failed to fetch annotations");
  }

  if (data?.processing_rules) {
    return deserializeProcessingRules(data.processing_rules);
  }

  return null;
}

export async function getSlicedPdfContent(pdfId: string): Promise<SlicedPdfContent[]> {
  const supabase = createClient();

  // First verify if the user has access to this PDF
  const { data: pdf } = await supabase
    .from("pdfs")
    .select("id")
    .eq("id", pdfId)
    .single();

  if (!pdf) {
    throw new Error("PDF not found or access denied");
  }

  const { data, error } = await supabase
    .from("outputs")
    .select("*, tsv")
    .eq("pdf_id", pdfId);

  if (error) {
    console.error("Error fetching processed output:", error);
    throw new Error("Failed to fetch processed output");
  }

  if (!data || data.length === 0) return [];

  return data.map(item => ({
    ...item,
    section_info: item.section_info as SectionInfo
  })) as SlicedPdfContent[];
}

export async function linkPdfToSlicer(slicerId: string, pdfId: string) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Authentication failed");
  }

  // Create the relationship in pdf_slicers
  const { error: relationError } = await supabase
    .from("pdf_slicers")
    .insert({
      pdf_id: pdfId,
      slicer_id: slicerId,
      user_id: user.id
    });

  if (relationError) {
    console.error("Error creating pdf-slicer relationship:", relationError);
    throw new Error("Failed to link PDF to slicer");
  }

  // Optionally, you can update the PDF to mark it as a template
  // Uncomment the following block if you want this behavior
  /*
  const { error: updateError } = await supabase
    .from("pdfs")
    .update({ is_template: true })
    .eq("id", pdfId);

  if (updateError) {
    console.error("Error updating PDF:", updateError);
    // You might want to handle this error
  }
  */

  return { success: true };
}

export async function saveSlicedContent(outputs: TablesInsert<"outputs">[], apiKey: string) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    throw new Error("Authentication failed");
  }

  try {
    for (const output of outputs) {
      // Generate embedding for the output text
      const embedding = await generateEmbedding(output.text_content, apiKey);
      
      const { error } = await supabase
        .from("outputs")
        .upsert(
          {
            ...output,
            embedding,
            user_id: user.id,
            updated_at: new Date().toISOString()
          },
          {
            onConflict: "pdf_id,slicer_id,page_number",
            ignoreDuplicates: false
          }
        );

      if (error) {
        console.error("Error saving sliced content:", error);
        throw error;
      }
    }
  } catch (error) {
    console.error("Error in saveSlicedContent:", error);
    throw error;
  }
}

export async function searchSlicedContentForSlicer(slicerId: string, query: string, page = 1, pageSize = 5): Promise<{ results: SlicedPdfContentWithMetadata[], total: number }> {
  const supabase = createClient();

  const offset = (page - 1) * pageSize;

  let query_builder = supabase
    .from("outputs")
    .select(`
      *,
      tsv,
      pdfs (
        file_name
      )
    `, { count: "exact" })
    .eq("slicer_id", slicerId);

  if (query.trim()) {
    query_builder = query_builder.textSearch("tsv", query);
  }

  const { data, error, count } = await query_builder
    .range(offset, offset + pageSize - 1);

  if (error) {
    console.error("Error searching outputs:", error);
    throw new Error("Failed to search outputs");
  }

  const results = (data || []).map(item => ({
    ...item,
    section_info: item.section_info as SectionInfo,
    pdfs: item.pdfs as { file_name: string | null }
  })) as SlicedPdfContentWithMetadata[];

  return {
    results,
    total: count ?? 0
  };
}

/**************************/
  /**  get content for the slicer from the outputs table.
/*************/
export async function getInitialSlicedContentForSlicer(slicerId: string, page = 1, pageSize = 10) {
  const supabase = createClient();

  const offset = (page - 1) * pageSize;

  const { data, error, count } = await supabase
    .from("outputs")
    .select(`
      *,
      tsv,
      pdfs (
        file_name
      )
    `, { count: "exact" })
    .eq("slicer_id", slicerId)
    .range(offset, offset + pageSize - 1)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching initial outputs:", error);
    throw error;
  }

  const results = (data || []).map(item => ({
    ...item,
    section_info: item.section_info as SectionInfo,
    pdfs: item.pdfs as { file_name: string | null }
  })) as SlicedPdfContentWithMetadata[];

  return { results, total: count || 0 };
}

// Add a function to verify the password
export async function verifyPdfPassword(slicerId: string, password: string): Promise<boolean> {
  const supabase = createClient();

  // Get the slicer details
  const { data: slicer } = await supabase
    .from("slicers")
    .select("pdf_password")
    .eq("id", slicerId)
    .single();

  if (!slicer) {
    throw new Error("Slicer not found or access denied");
  }

  if (!slicer.pdf_password) {
    return true; // No password set, consider it valid
  }

  return verifyPassword(password, slicer.pdf_password);
}

export async function getSlicerLLMOutput(slicerId: string): Promise<SlicerLLMOutput[] | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("slicer_llm_outputs")
    .select("*")
    .eq("slicer_id", slicerId);

  if (error) {
    console.error("Error fetching slicer LLM output:", error);
    return null;
  }

  return data?.map(item => ({
    id: item.id,
    prompt_id: item.prompt_id,
    prompt: item.prompt,
    output: item.output as LLMResponse
  })) || null;
}

export async function saveSlicerLLMOutput(slicerId: string, output: SlicerLLMOutput): Promise<void> {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Authentication failed");
  }

  const { error } = await supabase
    .from("slicer_llm_outputs")
    .upsert(
      {
        slicer_id: slicerId,
        prompt_id: output.prompt_id,
        prompt: output.prompt,
        output: output.output,
        user_id: user.id,
        updated_at: new Date().toISOString()
      },
      {
        onConflict: "slicer_id,prompt_id",
        ignoreDuplicates: false
      }
    );

  if (error) {
    console.error("Error saving slicer LLM output:", error);
    throw new Error("Failed to save slicer LLM output");
  }
}

export async function getAllSlicers() {
  const supabase = createClient();

  const { data: slicers, error } = await supabase
    .from("slicers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching slicers:", error);
    throw new Error("Failed to fetch slicers");
  }

  return slicers || [];
}

export async function uploadMultiplePdfs(formData: FormData): Promise<Tables<"pdfs">[]> {
  const supabase = createClient();
  // Get the authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Authentication failed");
  }

  const files = formData.getAll("pdfs") as File[];
  if (files.length === 0) {
    throw new Error("No files provided");
  }

  const isTemplate = formData.get("is_template") === "true";

  const uploadedPdfs: Tables<"pdfs">[] = [];

  for (const file of files) {
    if (!(file instanceof File)) {
      continue;
    }

    // Upload file to Supabase Storage
    const { data: fileData, error: uploadError } = await supabase.storage
      .from("slicely-pdfs")
      .upload(`${user.id}/${file.name}`, file, {
        contentType: "application/pdf",
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      continue;
    }

    // Insert PDF record into database
    const { data: newPdf, error: insertError } = await supabase
      .from("pdfs")
      .insert({
        file_name: file.name,
        file_path: fileData.path,
        is_template: isTemplate,
        user_id: user.id,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      continue;
    }

    uploadedPdfs.push(newPdf);
  }

  if (uploadedPdfs.length === 0) {
    throw new Error("Failed to upload any PDFs");
  }

  return uploadedPdfs;
}

export async function savePdfLLMOutput(pdfId: string, slicerId: string, pdf_llm_output: Omit<TablesInsert<"pdf_llm_outputs">, "user_id">): Promise<Tables<"pdf_llm_outputs">> {
  const supabase = createClient();

  // Get the authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Authentication failed");
  }

  // Store LLM output in the database
  const { error: insertError, data } = await supabase
    .from("pdf_llm_outputs")
    .upsert(
      {
        pdf_id: pdfId,
        slicer_id: slicerId,
        prompt_id: pdf_llm_output.prompt_id,
        prompt: pdf_llm_output.prompt,
        output: pdf_llm_output.output,
        user_id: user.id,
        updated_at: new Date().toISOString()
      },
      {
        onConflict: "pdf_id,slicer_id,prompt_id",
        ignoreDuplicates: false
      }
    )
    .select()
    .single();

  if (insertError) {
    throw new Error(`Error storing LLM output: ${insertError.message}`);
  }

  return data;
}

export async function getLLMOutputForPdf(pdfId: string, slicerId: string): Promise<PdfLLMOutput[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("pdf_llm_outputs")
    .select("*")
    .eq("pdf_id", pdfId)
    .eq("slicer_id", slicerId);

  if (error) {
    console.error(`Error fetching LLM outputs: ${error.message}`);
    return [];
  }

  return data.map(item => ({
    id: item.id,
    pdf_id: item.pdf_id,
    slicer_id: item.slicer_id,
    prompt_id: item.prompt_id,
    prompt: item.prompt,
    output: item.output as LLMResponse
  }));
}
