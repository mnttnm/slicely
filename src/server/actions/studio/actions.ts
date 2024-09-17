'use server';

import { PDFMetadata, ProcessedText, ProcessingRules, Slicer } from '@/app/types';
import { createClient } from '@/server/services/supabase/server';
import { Json, Tables, TablesInsert } from '@/types/supabase-types/database.types';
import { ProcessedPageOutput } from '@/app/types';
import { serializeProcessingRules, deserializeProcessingRules } from '@/app/utils/fabricHelper';

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

export async function createSlicer({ name, description, fileId }: { name: string; description: string; fileId: string }) {
  const supabase = createClient()
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
      user_id: user.id,
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

  const { data, error } = await supabase
    .from('slicers')
    .update({ ...slicer, processing_rules: serializedProcessingRules })
    .eq('id', slicerId)
    .eq('user_id', user.id)
    .single();

  if (error) {
    console.error('Error updating slicer:', error);
    throw new Error('Failed to update slicer');
  }

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
    : slicerDetailsWithoutPdfSlicers.processing_rules;

  return {
    slicerDetails: {
      ...slicerDetailsWithoutPdfSlicers,
      processing_rules: processingRules
    },
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

const deserializeProcessedOutput = (output: Json): ProcessedPageOutput[] => {
  if (typeof output !== "object" || output === null || !("data" in output)) {
    throw new Error("Invalid output format");
  }

  return {
    ...output,
    data: (output.data as Array<unknown>).map((page) => {
      if (typeof page !== "object" || page === null || !("extractedSectionTexts" in page)) {
        throw new Error("Invalid page format");
      }

      return {
        ...page,
        extractedSectionTexts: (page.extractedSectionTexts as Array<unknown>).map((text) => {
          if (typeof text !== "object" || text === null || !("transform" in text)) {
            throw new Error("Invalid text format");
          }

          return {
            ...text,
            transform: (text.transform as Array<unknown>).map((num) => {
              if (typeof num !== "number") {
                throw new Error("Invalid transform value");
              }
              return num;
            }),
          };
        }),
      };
    }),
  };
};


export async function getProcessedOutput(pdfId: string): Promise<ProcessedText | null> {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Authentication failed');
  }

  const { data: result, error } = await supabase
    .from('outputs')
    .select('*')
    .eq('pdf_id', pdfId)
    .eq('user_id', user.id)
    .single();

  if (error) {
    console.error('Error fetching processed output:', error);
    return null;
  }

  if (!result || !result.data) return null;

  const { data: PageOutputJson, ...rest } = result;
  const deserializedOutput = deserializeProcessedOutput(PageOutputJson);

  console.log(deserializedOutput);
  return { ...rest, data: deserializedOutput };
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

export async function saveProcessedOutput(pdfId: string, output: ProcessedPageOutput) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Authentication failed");
  }

  const { data, error } = await supabase
    .from("outputs")
    .upsert({
      pdf_id: pdfId,
      user_id: user.id,
      data: output,
    })
    .single();

  if (error) {
    console.error("Error saving processed output:", error);
    throw new Error("Failed to save processed output");
  }

  return data;
}