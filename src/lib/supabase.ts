"use server";

import { createClient } from "@/server/services/supabase/server";
import { generateEmbedding } from "./embedding-utils";

// const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
// const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

interface MatchOutputsParams {
  query_embedding: number[];
  p_slicer_id: string;
  match_threshold: number;
  match_count: number;
}

export async function searchVectorStore(query: string, slicerId: string, apiKey: string) {
  const supabase = createClient();
  try {
    const embedding = await generateEmbedding(query, apiKey);

    const { data, error } = await supabase.rpc<any, MatchOutputsParams>("match_outputs", {
      query_embedding: embedding,
      p_slicer_id: slicerId,
      match_threshold: 0.3,
      match_count: 15
    });

    if (error) {
      console.error("Error in match_outputs RPC:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error in searchVectorStore:", error);
    throw error;
  }
}