"use server";
import { SlicedPdfContent } from "@/app/types";
import { chatCompletion } from "@/lib/openai";
import { searchVectorStore } from "@/lib/supabase";
import { getInitialSlicedContentForSlicer, getSlicedPdfContent } from "@/server/actions/studio/actions";



export async function getContextForSlicer(slicerId: string, apiKey: string, limit = 100) {
  const { results } = await getInitialSlicedContentForSlicer(slicerId, 1, limit);
  return results.map(result => result.text_content).join("\n\n");
}

export async function getContextForPdf(pdfId: string, apiKey: string) {
  const slicedPdfContent = await getSlicedPdfContent(pdfId);
  return slicedPdfContent.map((result: SlicedPdfContent) => result.text_content).join("\n\n");
}

export interface ContextObject {
  id: string;
  text_content: string;
}

export async function getContextForQuery(query: string, slicerId: string, apiKey: string): Promise<{ context: string; contextObjects: ContextObject[] }> {
  try {
    const relevantDocuments = await searchVectorStore(query, slicerId, apiKey);
    if (!relevantDocuments || relevantDocuments.length === 0) {
      console.warn("No relevant documents found for the query");
      return { context: "", contextObjects: [] };
    }
    const contextObjects = relevantDocuments.map((doc: any) => ({
      id: doc.id,
      text_content: doc.text_content,
      // Add other relevant metadata here
    }));
    const context = contextObjects.map(obj => `<context_id>${obj.id}</context_id> ${obj.text_content}`).join("\n\n");
    return { context, contextObjects };
  } catch (error) {
    console.error("Error in getContextForQuery:", error);
    throw error;
  }
}

export async function createMessages(context: string, instruction: string, query?: string) {
  const messages = [
    { role: "system", content: "You are a helpful AI assistant. Process the following content according to the given instructions." },
    { role: "user", content: `Instructions(Question): ${query || instruction}\n Context: ${context}` }
  ];

  return messages;
}

export async function processWithLLM(messages: { role: string; content: string }[], apiKey: string) {
  if (!messages || !Array.isArray(messages)) {
    throw new Error("Invalid messages format");
  }

  try {
    const answer = await chatCompletion(messages, apiKey);
    return answer;
  } catch (error) {
    console.error("Error in processWithLLM:", error);
    throw new Error("Failed to process with LLM");
  }
}