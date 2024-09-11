'use server';

import { ProcessingRules } from '@/app/types';
import { createClient } from '@/server/services/supabase/server';
import { Tables, TablesInsert } from '@/types/supabase-types/database.types';

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

  const slicerId = formData.get('slicer_id')?.toString() || null;
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
      slicer_id: slicerId,
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

export async function getUserPDFs(): Promise<Tables<'pdfs'>[]> {
  const supabase = createClient()
  // Get the authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.log('authError', authError);  
    throw new Error('Authentication failed');
  }

  const { data: userPDFs, error } = await supabase
    .from('pdfs')
    .select('*')
    .eq('user_id', user.id);

  if (error) {
    console.error('Error fetching user PDFs:', error);
    throw new Error('Failed to fetch user PDFs');
  }

  return userPDFs;
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

export async function createSlicer({ name, description, fileId }: { name: string; description: string; fileId: string }) {
  const supabase = createClient()
  // Get the authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Authentication failed');
  }

  // Create the new slicer
  const { data: newSlicer, error } = await supabase
    .from('slicers')
    .insert({
      name,
      description,
      pdf_id: fileId,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating slicer:', error);
    throw new Error('Failed to create slicer');
  }

  // Update the PDF to link it to the new slicer
  const { error: updateError } = await supabase
    .from('pdfs')
    .update({ slicer_id: newSlicer.id, is_template: true })
    .eq('id', fileId);

  if (updateError) {
    console.error('Error updating PDF:', updateError);
    // You might want to handle this error, possibly by deleting the created slicer
  }

  return newSlicer;
}

export async function getSlicerDetails(slicerId: string): Promise<{ slicerDetails: Tables<'slicers'>; pdfUrl: string } | null> {
  const supabase = createClient()
  // Get the authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Authentication failed');
  }

  // Fetch slicer details
  const { data: slicerDetails, error } = await supabase
    .from('slicers')
    .select('*, pdfs!slicers_pdf_id_fkey(*)')
    .eq('id', slicerId)
    .single();


  console.log('slicerDetails', slicerDetails);

  if (error) {
    console.error('Error fetching slicer details:', error);
    throw new Error('Failed to fetch slicer details');
  }

  if (!slicerDetails) {
    throw new Error('Slicer or associated PDF not found');
  }


  return { slicerDetails, pdfUrl: slicerDetails.pdfs.file_path };
}

export async function saveAnnotations(slicerId: string, annotations: ProcessingRules) {
  const supabase = createClient()
  // Get the authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Authentication failed');
  }

  const { data, error } = await supabase
    .from('slicers')
    .update({ processing_rules: annotations })
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

  return data?.processing_rules || null;
}