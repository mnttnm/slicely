'use server';

import { SupabaseServerClient as supabase } from '@/server/services/supabase/server';
import { Tables, TablesInsert } from '@/types/database.types';

export async function uploadPdf(formData: FormData): Promise<TablesInsert<'pdfs'>> {

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

  // Get the authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
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
  const { data, error } = await supabase.storage.from('slicely-pdfs').download(filePath);
  if (error) {
    console.error('Error fetching PDF:', error);
    throw new Error('Failed to fetch PDF');
  }
  return data;
}

export async function getSignedPdfUrl(filePath: string): Promise<string> {
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

export async function getSlicers(): Promise<Tables<'pdfs'>[]> {
  return getUserPDFs();
}

export async function createSlicer(slicer: TablesInsert<'slicers'>): Promise<Tables<'slicers'>> {
  console.log('Creating slicer:', slicer);
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Authentication failed');
  }

  const { data, error } = await supabase
    .from('slicers')
    .insert({
      ...slicer,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating slicer:', error);
    throw new Error('Failed to create slicer');
  }

  return data;
}