"use server";
import { chatCompletion } from "@/lib/openai";
import { searchVectorStore } from "@/lib/supabase";
import { getInitialOutputs } from "@/server/actions/studio/actions";


export async function getContextForSlicer(slicerId: string, limit = 100) {
  const { results } = await getInitialOutputs(slicerId, 1, limit);
  return results.map(result => result.text_content).join("\n\n");
}

export async function getContextForQuery(query: string, slicerId: string) {
  try {
    const relevantDocuments = await searchVectorStore(query, slicerId);
    if (!relevantDocuments || relevantDocuments.length === 0) {
      console.warn("No relevant documents found for the query");
      return "No relevant information found.";
    }
    return relevantDocuments.map((doc: any) => doc.text_content).join("\n\n");
  } catch (error) {
    console.error("Error in getContextForQuery:", error);
    throw error;
  }
}

export async function createMessages(context: string, instruction: string, query?: string) {
  const messages = [
    { role: "system", content: "You are a helpful AI assistant. Process the following content according to the given instructions." },
    { role: "user", content: `Instructions: ${instruction}\n Context: ${context}` }
  ];

  if (query) {
    messages.push({ role: "user", content: `Question: ${query}` });
  }

  return messages;
}


export async function processWithLLM(messages: { role: string; content: string }[]) {
  if (!messages || !Array.isArray(messages)) {
    throw new Error("Invalid messages format");
  }

  try {
    const answer = await chatCompletion(messages);
    console.log("Chat completion response:", JSON.stringify(answer, null, 2));
    return answer;
  } catch (error) {
    console.error("Error in processWithLLM:", error);
    throw new Error("Failed to process with LLM");
  }
}