"use server";
import OpenAI from "openai";

const getOpenAIInstance = (apiKey: string) => {
  if (!apiKey) {
    throw new Error("OpenAI API key is required");
  }

  return new OpenAI({
    apiKey: apiKey,
  });
};

export async function generateEmbedding(input: string, apiKey: string): Promise<number[]> {
  try {
    const openai = getOpenAIInstance(apiKey);
    const embedding = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: input,
      encoding_format: "float",
    });

    return embedding.data[0].embedding;
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw error;
  }
}