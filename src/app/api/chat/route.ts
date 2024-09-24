import { NextResponse } from 'next/server';
import { searchVectorStore } from '@/lib/supabase';
import { getChatCompletion } from '@/lib/openai';

export async function POST(request: Request) {
  const { question, slicerId } = await request.json();

  if (!question || !slicerId) {
    return NextResponse.json({ message: "Missing required parameters" }, { status: 400 });
  }

  try {
    console.log("Received question:", question);
    console.log("Slicer ID:", slicerId);

    const relevantDocuments = await searchVectorStore(question, slicerId);

    console.log("Relevant documents:", relevantDocuments);

    if (relevantDocuments.length === 0) {
      console.log("No relevant documents found");
      return NextResponse.json({
        answer: "I'm sorry, but I couldn't find any relevant information to answer your question.",
        sources: []
      });
    }

    const context = relevantDocuments.map((doc) => doc.text_content).join('\n\n');

    console.log("Context:", context);

    const messages = [
      { role: "system", content: "You are a helpful AI assistant. Use the provided context to answer the user's question." },
      { role: "user", content: `Context: ${context}\n\nQuestion: ${question}` }
    ];

    const answer = await getChatCompletion(messages);

    console.log("Generated answer:", answer);

    return NextResponse.json({
      answer,
      sources: relevantDocuments
    });
  } catch (error) {
    console.error("Error in chat API:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}