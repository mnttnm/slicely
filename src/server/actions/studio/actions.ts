"use server";

import { LLMPrompt, PDFMetadata, ProcessingRules, SectionInfo, SlicedPdfContent, SlicedPdfContentWithMetadata, Slicer, SlicerLLMOutput } from "@/app/types";
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
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Authentication failed");
  }

  const { data: userPDFs, error } = await supabase
    .from("pdfs")
    .select(`
      *,
      pdf_slicers (slicer_id)
    `)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error fetching user PDFs:", error);
    throw new Error("Failed to fetch user PDFs");
  }

  // Transform the data to include slicer_ids
  const transformedPDFs = userPDFs.map(pdf => ({
    ...pdf,
    slicer_ids: pdf.pdf_slicers.map(ps => ps.slicer_id),
    pdf_slicers: undefined // Remove this property as it's no longer needed
  }));

  return transformedPDFs;
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
  // Get the authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Authentication failed");
  }

  const { data: slicers, error } = await supabase
    .from("slicers")
    .select("*")
    .eq("user_id", user.id);

  if (error) {
    console.error("Error fetching user slicers:", error);
    throw new Error("Failed to fetch user slicers");
  }

  return slicers;
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

  const llmPrompts = slicer.llm_prompts.map((prompt: LLMPrompt) => ({
    id: prompt.id,
    prompt: prompt.prompt
  }));

  const pdfPrompts = slicer.pdf_prompts.map((prompt: LLMPrompt) => ({
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

export async function getSlicerDetails(slicerId: string): Promise<{ slicerDetails: Slicer; linkedPdfs: PDFMetadata[] } | null> {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Authentication failed");
  }

  // Fetch slicer details
  const { data: slicerDetails, error } = await supabase
    .from("slicers")
    .select("*, pdf_slicers (pdfs(*))")
    .eq("id", slicerId)
    .single();

  if (error) {
    console.error("Error fetching slicer details:", error);
    throw new Error("Failed to fetch slicer details");
  }

  if (!slicerDetails || !slicerDetails.pdf_slicers[0]?.pdfs) {
    throw new Error("Slicer or associated PDF not found");
  }

  const { pdf_slicers, ...slicerDetailsWithoutPdfSlicers } = slicerDetails;

  const linkedPdfs = pdf_slicers.map(ps => ps.pdfs);

  const processingRules = typeof slicerDetailsWithoutPdfSlicers.processing_rules === "string"
    ? deserializeProcessingRules(slicerDetailsWithoutPdfSlicers.processing_rules)
    : {
      annotations: [],
      skipped_pages: []
    };

  if (!processingRules) {
    throw new Error("Processing rules not found");
  }

  return {
    slicerDetails: {
      ...slicerDetailsWithoutPdfSlicers,
      processing_rules: processingRules
    } as Slicer,
    linkedPdfs: linkedPdfs as PDFMetadata[]
  };
}

export async function saveAnnotations(slicerId: string, annotations: ProcessingRules) {
  const supabase = createClient();
  // Get the authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Authentication failed");
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
  // Get the authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Authentication failed");
  }

  const { data, error } = await supabase
    .from("slicers")
    .select("processing_rules")
    .eq("id", slicerId)
    .eq("user_id", user.id)
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
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Authentication failed");
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

export async function saveSlicedContent(output: TablesInsert<"outputs">): Promise<Tables<"outputs">> {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error("Authentication failed");
  }

  // Generate embedding for the output text
  const embedding = await generateEmbedding(output.text_content);
  // Add the embedding to the output object
  output.embedding = JSON.stringify(embedding);
  const { data, error } = await supabase
    .from("outputs")
    .insert(output)
    .select()
    .single();

  if (error) {
    console.error("Error saving processed output:", error);
    throw new Error("Failed to save processed output");
  }

  return data as Tables<"outputs">;
}

export async function searchSlicedContentForSlicer(slicerId: string, query: string, page = 1, pageSize = 5): Promise<{ results: SlicedPdfContentWithMetadata[], total: number }> {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Authentication failed");
  }

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

export async function getInitialSlicedContentForSlicer(slicerId: string, page = 1, pageSize = 10) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Authentication failed");
  }

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
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Authentication failed");
  }

  const { data: slicer, error } = await supabase
    .from("slicers")
    .select("pdf_password")
    .eq("id", slicerId)
    .eq("user_id", user.id)
    .single();

  if (error || !slicer) {
    throw new Error("Failed to fetch slicer");
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
  const { error } = await supabase
    .from("slicer_llm_outputs")
    .upsert({
      slicer_id: slicerId,
      prompt_id: output.prompt_id,
      prompt: output.prompt,
      output: output.output
    }, { onConflict: "slicer_id,prompt_id" });

  if (error) {
    console.error("Error saving slicer LLM output:", error);
    throw new Error("Failed to save slicer LLM output");
  }
}

export async function getAllSlicers() {
  const supabase = createClient();

  try {
    const { data: slicers, error } = await supabase
      .from("slicers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching slicers:", error);
      throw new Error("Failed to fetch slicers");
    }

    return slicers || [];
  } catch (error) {
    console.error("Error in getAllSlicers:", error);
    throw error;
  }
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

export async function getLLMOutputForPdf(pdfId: string, pdf_prompts: LLMPrompt): Promise<SlicerLLMOutput> {
  // todo: implement this
}

// Ensure you have a way to retrieve the pdf_prompts when fetching slicers
export const getSlicerById = async (id: string): Promise<Slicer | null> => {
  const supabase = createClient();
  const slicer = await supabase.from("slicers").select("*").eq("id", id).single();
  return slicer.data;
};