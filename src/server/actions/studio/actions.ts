'use server';

import { PDFMetadata, ProcessingRules, Slicer, ProcessedOutput, ProcessedOutputWithMetadata, SectionInfo } from '@/app/types';
import { createClient } from '@/server/services/supabase/server';
import { Tables, TablesInsert } from '@/types/supabase-types/database.types';
import { serializeProcessingRules, deserializeProcessingRules } from '@/app/utils/fabricHelper';
import { revalidatePath } from 'next/cache';
import { hashPassword, verifyPassword } from '@/server/utils/passwordUtils';

export async function uploadPdf(formData: FormData): Promise<TablesInsert<'pdfs'>> {
  const supabase = createClient()
  // Get the authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Authentication failed');
  }

  // Extract fields from the form
  const file = formData.get('pdf') as File | null;
  if (!file || !(file instanceof File)) {
    throw new Error('Invalid file provided');
  }

  const isTemplate = formData.get('is_template') === 'true';

  // Upload file to Supabase Storage
  const { data: fileData, error: uploadError } = await supabase.storage
    .from('slicely-pdfs')
    .upload(`${user.id}/${file.name}`, file, {
      contentType: 'application/pdf',
    });

  if (uploadError) {
    console.error('Upload error:', uploadError);
    throw new Error('Failed to upload PDF');
  }

  // Insert PDF record into database
  const { data: newPdf, error: insertError } = await supabase
    .from('pdfs')
    .insert({
      file_name: file.name,
      file_path: fileData.path,
      is_template: isTemplate,
      user_id: user.id,
    })
    .select()
    .single();

  if (insertError) {
    console.error('Insert error:', insertError);
    throw new Error(insertError.message);
  }

  return newPdf;
}

export async function getUserPDFs(): Promise<(Tables<'pdfs'> & { slicer_ids: string[] })[]> {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Authentication failed');
  }

  const { data: userPDFs, error } = await supabase
    .from('pdfs')
    .select(`
      *,
      pdf_slicers (slicer_id)
    `)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error fetching user PDFs:', error);
    throw new Error('Failed to fetch user PDFs');
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
  const supabase = createClient()
  const { data, error } = await supabase.storage.from('slicely-pdfs').download(filePath);
  if (error) {
    console.error('Error fetching PDF:', error);
    throw new Error('Failed to fetch PDF');
  }
  return data;
}

export async function getSignedPdfUrl(filePath: string): Promise<string> {
  const supabase = createClient()
  const { data, error } = await supabase
    .storage
    .from('slicely-pdfs')
    .createSignedUrl(filePath, 60 * 60); // URL valid for 1 hour

  if (error) {
    console.error('Error creating signed URL:', error);
    throw new Error('Failed to create signed URL for PDF');
  }

  return data.signedUrl;
}

export async function getPdfDetails(pdfId: string): Promise<{ pdfDetails: Tables<'pdfs'>, slicer_ids: string[]; pdfUrl: string } | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('pdfs')
    .select('*, pdf_slicers (slicer_id)')
    .eq('id', pdfId)
    .single();

  if (!data) {
    return null;
  }

  const { pdf_slicers: pdfSlicers, ...pdfDetails } = data;

  if (error) {
    console.error('Error fetching PDF details:', error);
    throw new Error('Failed to fetch PDF details');
  }

  const pdfUrl = await getSignedPdfUrl(pdfDetails.file_path);

  return {
    pdfDetails,
    slicer_ids: pdfSlicers.map(ps => ps.slicer_id),
    pdfUrl
  };
}

export async function getSlicers(): Promise<Tables<'slicers'>[]> {
  const supabase = createClient()
  // Get the authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Authentication failed');
  }

  const { data: slicers, error } = await supabase
    .from('slicers')
    .select('*')
    .eq('user_id', user.id);

  if (error) {
    console.error('Error fetching user slicers:', error);
    throw new Error('Failed to fetch user slicers');
  }

  return slicers;
}

export async function createSlicer({ name, description, fileId, password }: { name: string; description: string; fileId: string; password?: string }) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Authentication failed');
  }

  // Hash the password if provided
  const hashedPassword = password ? await hashPassword(password) : null;

  // Create the new slicer
  const { data: newSlicer, error } = await supabase
    .from('slicers')
    .insert({
      name,
      description,
      user_id: user.id,
      pdf_password: hashedPassword,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating slicer:', error);
    throw new Error('Failed to create slicer');
  }

  // Create the relationship in pdf_slicers
  const { error: relationError } = await supabase
    .from('pdf_slicers')
    .insert({
      pdf_id: fileId,
      slicer_id: newSlicer.id,
    });

  if (relationError) {
    console.error('Error creating pdf-slicer relationship:', relationError);
    // You might want to handle this error, possibly by deleting the created slicer
    throw new Error('Failed to link PDF to slicer');
  }

  // Update the PDF to mark it as a template
  const { error: updateError } = await supabase
    .from('pdfs')
    .update({ is_template: true })
    .eq('id', fileId);

  if (updateError) {
    console.error('Error updating PDF:', updateError);
    // You might want to handle this error
  }

  return newSlicer;
}

export async function updateSlicer(slicerId: string, slicer: Slicer) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Authentication failed');
  }

  const serializedProcessingRules = serializeProcessingRules(slicer.processing_rules);

  // Check if the password has changed
  let updatedPassword = slicer.pdf_password;
  if (slicer.pdf_password && slicer.pdf_password !== '') {
    // Only hash the password if it has changed
    const { data: currentSlicer } = await supabase
      .from('slicers')
      .select('pdf_password')
      .eq('id', slicerId)
      .single();

    if (currentSlicer && slicer.pdf_password !== currentSlicer.pdf_password) {
      updatedPassword = await hashPassword(slicer.pdf_password);
    }
  }

  const { data, error } = await supabase
    .from('slicers')
    .update({ 
      ...slicer, 
      processing_rules: serializedProcessingRules,
      pdf_password: updatedPassword
    })
    .eq('id', slicerId)
    .eq('user_id', user.id)
    .single();

  if (error) {
    console.error('Error updating slicer:', error);
    throw new Error('Failed to update slicer');
  }

  return data;
}

export async function updatePDF(pdfId: string, updatedData: Partial<PDFMetadata>): Promise<PDFMetadata> {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Authentication failed');
  }

  const { data, error } = await supabase
    .from('pdfs')
    .update(updatedData)
    .eq('id', pdfId)
    .single();

  if (error) {
    console.error('Error updating PDF:', error);
    throw new Error('Failed to update PDF');
  }

  revalidatePath(`/studio/slicers`);
  return data;
}

export async function getSlicerDetails(slicerId: string): Promise<{ slicerDetails: Slicer; linkedPdfs: PDFMetadata[] } | null> {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Authentication failed');
  }

  // Fetch slicer details
  const { data: slicerDetails, error } = await supabase
    .from('slicers')
    .select('*, pdf_slicers (pdfs(*))')
    .eq('id', slicerId)
    .single();

  if (error) {
    console.error('Error fetching slicer details:', error);
    throw new Error('Failed to fetch slicer details');
  }

  if (!slicerDetails || !slicerDetails.pdf_slicers[0]?.pdfs) {
    throw new Error('Slicer or associated PDF not found');
  }

  const { pdf_slicers, ...slicerDetailsWithoutPdfSlicers } = slicerDetails;

  const linkedPdfs = pdf_slicers.map(ps => ps.pdfs);

  const processingRules = typeof slicerDetailsWithoutPdfSlicers.processing_rules === 'string'
    ? deserializeProcessingRules(slicerDetailsWithoutPdfSlicers.processing_rules)
    : {
      annotations: [],
      skipped_pages: []
    }

  if (!processingRules) {
    throw new Error('Processing rules not found');
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
  const supabase = createClient()
  // Get the authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Authentication failed');
  }

  const serializedAnnotations = serializeProcessingRules(annotations);

  const { data, error } = await supabase
    .from('slicers')
    .update({ processing_rules: serializedAnnotations })
    .eq('id', slicerId)
    .eq('user_id', user.id)
    .single();

  if (error) {
    console.error('Error saving annotations:', error);
    throw new Error('Failed to save annotations');
  }

  return data;
}

export async function getAnnotations(slicerId: string): Promise<ProcessingRules | null> {
  const supabase = createClient()
  // Get the authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Authentication failed');
  }

  const { data, error } = await supabase
    .from('slicers')
    .select('processing_rules')
    .eq('id', slicerId)
    .eq('user_id', user.id)
    .single();

  if (error) {
    console.error('Error fetching annotations:', error);
    throw new Error('Failed to fetch annotations');
  }

  if (data?.processing_rules) {
    return deserializeProcessingRules(data.processing_rules);
  }

  return null;
}

export async function getProcessedOutput(pdfId: string): Promise<ProcessedOutput[]> {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Authentication failed');
  }

  const { data, error } = await supabase
    .from('outputs')
    .select('*, tsv')
    .eq('pdf_id', pdfId);

  if (error) {
    console.error('Error fetching processed output:', error);
    throw new Error('Failed to fetch processed output');
  }

  if (!data || data.length === 0) return [];

  return data.map(item => ({
    ...item,
    section_info: item.section_info as SectionInfo
  })) as ProcessedOutput[];
}

export async function getProcessedOutputForSlicer(slicerId: string): Promise<ProcessedOutputWithMetadata[]> {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Authentication failed");
  }

  if (!slicerId) {
    throw new Error("No slicer ID provided");
  }

  const { data, error } = await supabase
    .from("outputs")
    .select(`
      *,
      tsv,
      pdfs (
        file_name
      )
    `)
    .eq("slicer_id", slicerId);

  if (error) {
    console.error("Error fetching processed output for slicer:", error);
    throw new Error("Failed to fetch processed output for slicer");
  }

  return (data || []).map(item => ({
    ...item,
    section_info: item.section_info as SectionInfo,
    pdfs: item.pdfs as { file_name: string | null }
  })) as ProcessedOutputWithMetadata[];
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

export async function saveProcessedOutput(output: TablesInsert<'outputs'>): Promise<Tables<'outputs'>> {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error("Authentication failed");
  }

  const { data, error } = await supabase
    .from("outputs")
    .insert(output)
    .select()
    .single();

  if (error) {
    console.error("Error saving processed output:", error);
    throw new Error("Failed to save processed output");
  }

  return data as Tables<'outputs'>;
}

export async function searchOutputs(slicerId: string, query: string, page: number = 1, pageSize: number = 5): Promise<{ results: ProcessedOutputWithMetadata[], total: number }> {
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
    `, { count: 'exact' })
    .eq("slicer_id", slicerId);

  if (query.trim()) {
    query_builder = query_builder.textSearch('tsv', query);
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
  })) as ProcessedOutputWithMetadata[];

  return {
    results,
    total: count ?? 0
  };
}

export async function getInitialOutputs(slicerId: string, page: number = 1, pageSize: number = 10) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Authentication failed");
  }

  const offset = (page - 1) * pageSize;

  const { data, error, count } = await supabase
    .from('outputs')
    .select(`
      *,
      tsv,
      pdfs (
        file_name
      )
    `, { count: 'exact' })
    .eq('slicer_id', slicerId)
    .range(offset, offset + pageSize - 1)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching initial outputs:', error);
    throw error;
  }

  const results = (data || []).map(item => ({
    ...item,
    section_info: item.section_info as SectionInfo,
    pdfs: item.pdfs as { file_name: string | null }
  })) as ProcessedOutputWithMetadata[];

  return { results, total: count || 0 };
}

// Add a function to verify the password
export async function verifyPdfPassword(slicerId: string, password: string): Promise<boolean> {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Authentication failed');
  }

  const { data: slicer, error } = await supabase
    .from('slicers')
    .select('pdf_password')
    .eq('id', slicerId)
    .eq('user_id', user.id)
    .single();

  if (error || !slicer) {
    throw new Error('Failed to fetch slicer');
  }

  if (!slicer.pdf_password) {
    return true; // No password set, consider it valid
  }

  return verifyPassword(password, slicer.pdf_password);
}