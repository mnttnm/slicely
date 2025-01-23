"use server";

import { SlicerLLMOutput } from "@/app/types";
import { LLMResponse } from "@/lib/openai";
import { createClient } from "@/server/services/supabase/server";

export async function getAllSlicersLLMOutput(): Promise<{ [slicerId: string]: { name: string; outputs: SlicerLLMOutput[]; lastProcessed: string } }> {
  const supabase = createClient();

  const { data: slicers, error: slicersError } = await supabase
    .from("slicers")
    .select("id, name, updated_at, description")
    .order("updated_at", { ascending: false });

  if (slicersError) {
    console.error("Error fetching slicers:", slicersError);
    return {};
  }

  const allSlicersOutput: { [slicerId: string]: { name: string; outputs: SlicerLLMOutput[]; lastProcessed: string, description?: string } } = {};

  for (const slicer of slicers || []) {
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
      outputs: (llmOutputs ?? []).map(llmOutput => ({
        id: llmOutput.id,
        prompt: llmOutput.prompt,
        prompt_id: llmOutput.prompt_id,
        output: llmOutput.output as LLMResponse,
        created_at: llmOutput.created_at,
        updated_at: llmOutput.updated_at,
        slicer_id: llmOutput.slicer_id
      })),
      lastProcessed: slicer.updated_at ?? "-",
      description: slicer.description ?? "",
    };
  }

  return allSlicersOutput;
}