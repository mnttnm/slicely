"use server";

import { SlicerLLMOutput } from "@/app/types";
import { createClient } from "@/server/services/supabase/server";

export async function getAllSlicersLLMOutput(): Promise<{ [slicerId: string]: { name: string; outputs: SlicerLLMOutput[]; lastProcessed: string } }> {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Authentication failed");
  }

  const { data: slicers, error: slicersError } = await supabase
    .from("slicers")
    .select("id, name, updated_at, description")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (slicersError) {
    console.error("Error fetching slicers:", slicersError);
    throw new Error("Failed to fetch slicers");
  }

  const allSlicersOutput: { [slicerId: string]: { name: string; outputs: SlicerLLMOutput[]; lastProcessed: string, description?: string } } = {};

  for (const slicer of slicers) {
    const { data: llmOutputs, error: llmOutputError } = await supabase
      .from("slicer_llm_outputs")
      .select("*")
      .eq("slicer_id", slicer.id);

    if (llmOutputError) {
      console.error(`Error fetching LLM outputs for slicer ${slicer.id}:`, llmOutputError);
      continue;
    }

    allSlicersOutput[slicer.id] = {
      name: slicer.name,
      outputs: llmOutputs ?? [],
      lastProcessed: slicer.updated_at ?? "-",
      description: slicer.description ?? "",
    };
  }

  return allSlicersOutput;
}