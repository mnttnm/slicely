import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateEmbedding(input: string): Promise<number[]> {
  try {
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