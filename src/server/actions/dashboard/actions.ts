"use server";

import { SlicerLLMOutput } from "@/app/types";
import { LLMResponse } from "@/lib/openai";
import { createClient } from "@/server/services/supabase/server";

const DEMO_USER_ID = "20d7775d-40ab-4de3-8208-d5c453c284f8";

export async function getAllSlicersLLMOutput(): Promise<{ [slicerId: string]: { name: string; outputs: SlicerLLMOutput[]; lastProcessed: string } }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let slicers;

  if (user?.id === DEMO_USER_ID) {
    // If logged-in user is the demo user, just fetch their data
    const { data: userSlicers, error: userSlicersError } = await supabase
      .from("slicers")
      .select("id, name, updated_at, description")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (userSlicersError) {
      console.error("Error fetching slicers:", userSlicersError);
      return {};
    }
    slicers = userSlicers;
  } else {
    // Get demo user's data
    const { data: demoSlicers, error: demoSlicersError } = await supabase
      .from("slicers")
      .select("id, name, updated_at, description")
      .eq("user_id", DEMO_USER_ID)
      .order("updated_at", { ascending: false });

    if (demoSlicersError) {
      console.error("Error fetching demo slicers:", demoSlicersError);
      return {};
    }

    // If user is logged in and not the demo user, get their data too
    if (user) {
      const { data: userSlicers, error: userSlicersError } = await supabase
        .from("slicers")
        .select("id, name, updated_at, description")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (userSlicersError) {
        console.error("Error fetching user slicers:", userSlicersError);
      }
      slicers = [...(demoSlicers || []), ...(userSlicers || [])];
    } else {
      slicers = demoSlicers || [];
    }
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