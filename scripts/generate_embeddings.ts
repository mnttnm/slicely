import { createClient } from '@supabase/supabase-js'
import dotenv from "dotenv";
import { generateEmbedding } from '../src/lib/embeddingUtils';

// Load environment variables from .env file
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('Generating embeddings...');

async function generateEmbeddings() {
  console.log('Fetching all outputs from Supabase...');
  const { data: outputs, error } = await supabase
    .from('outputs')
    .select('id, text_content')
    .order('created_at', { ascending: false });

  console.log('Query result:', { outputCount: outputs?.length, error });

  if (error) {
    console.error('Error fetching outputs:', error);
    return;
  }

  if (!outputs || outputs.length === 0) {
    console.log('No outputs found');
    return;
  }

  console.log(`Processing ${outputs.length} outputs`);

  for (const output of outputs) {
    try {
      const embedding = await generateEmbedding(output.text_content);

      const { error: updateError } = await supabase
        .from('outputs')
        .update({ embedding: embedding })
        .eq('id', output.id);

      if (updateError) {
        console.error(`Error updating embedding for output ${output.id}:`, updateError);
      } else {
        console.log(`Updated embedding for output ${output.id}`);
      }
    } catch (error) {
      console.error(`Error generating embedding for output ${output.id}:`, error);
    }
  }

  console.log('Finished generating embeddings.');
}

generateEmbeddings().catch(console.error);