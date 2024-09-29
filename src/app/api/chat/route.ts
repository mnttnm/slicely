import { getChatCompletion } from "@/lib/openai";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { messages } = await request.json();

  if (!messages || !Array.isArray(messages)) {
    return NextResponse.json({ message: "Invalid messages format" }, { status: 400 });
  }

  try {
    const answer = await getChatCompletion(messages);
    console.log("Chat completion response:", answer);
    return NextResponse.json({ answer });
  } catch (error) {
    console.error("Error in chat API:", error);
    return NextResponse.json({ message: "Internal server error", error: error.message }, { status: 500 });
  }
}