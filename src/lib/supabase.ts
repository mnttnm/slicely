"use server";
import { generateEmbedding } from "@/lib/embedding-utils"; // Make sure this import is correct
import { createClient } from "@/server/services/supabase/server";

// const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
// const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;


export async function searchVectorStore(query: string, slicerId: string) {
  const supabase = createClient();
  try {
    const embedding = await generateEmbedding(query);

    const { data, error } = await supabase.rpc("match_outputs", {
      query_embedding: JSON.stringify(embedding),
      p_slicer_id: slicerId,
      match_threshold: 0.3, // TODO: make this configurable, this is very low for now
      match_count: 5
    });

    if (error) {
      console.error("Error in match_outputs RPC:", error);
      throw error;
    }

    console.log("match_outputs count:", data.length);
    return data;
  } catch (error) {
    console.error("Error in searchVectorStore:", error);
    throw error;
  }
}