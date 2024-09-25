import { createClient } from '@supabase/supabase-js';
import OpenAI from "openai";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

const openai = new OpenAI();

async function generateEmbedding(query: string) {
  const embedding = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: query,
    encoding_format: "float",
  });

  return embedding;
}

export async function searchVectorStore(query: string, slicerId: string, match_count: number = 5) {
  const embedding = await generateEmbedding(query);

  console.log("Searching for:", query);
  console.log("Slicer ID:", slicerId);

  const { data: documents, error } = await supabase
    .rpc('match_outputs', {
      query_embedding: embedding.data[0].embedding,
      match_threshold: 0.5,
      match_count: match_count,
      p_slicer_id: slicerId
    });

  if (error) {
    console.error("Error in vector search:", error);
    throw error;
  }

  console.log("Search results:", documents);
  return documents;
}