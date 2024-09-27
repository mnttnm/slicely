import { createClient } from "@supabase/supabase-js";
import { generateEmbedding } from "./embedding-utils";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseKey);

export const searchVectorStore = async (query: string, slicerId: string, match_count = 5) => {
  const embedding = await generateEmbedding(query);

  console.log("Searching for:", query);
  console.log("Slicer ID:", slicerId);

  const { data: documents, error } = await supabase
    .rpc("match_outputs", {
      query_embedding: embedding,
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
};