"use server";
import OpenAI from "openai";

// For server components, we'll only use the environment variable
const getOpenAIInstance = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OpenAI API key not found in environment variables");
  }

  return new OpenAI({
    apiKey: apiKey,
  });
};

export async function generateEmbedding(input: string): Promise<number[]> {
  try {
    const openai = getOpenAIInstance();
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