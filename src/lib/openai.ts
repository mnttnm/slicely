import OpenAI from "openai";
import { zodFunction } from "openai/helpers/zod";
import z from "zod";

const SingleValueContent = z.object({
  value: z.number(),
  unit: z.string().optional(),
});

const ChartContent = z.object({
  chart_type: z.enum(["bar", "line"]),
  data: z.array(z.object({
    x: z.string(),
    y: z.number(),
  })),
  x_label: z.string(),
  y_label: z.string(),
});

const TableContent = z.object({
  headers: z.array(z.string()),
  rows: z.array(z.array(z.union([z.string(), z.number()]))),
});

const TextContent = z.object({
  text: z.string(),
});

const Content = z.discriminatedUnion("response_type", [
  z.object({ response_type: z.literal("single_value"), content: SingleValueContent }),
  z.object({ response_type: z.literal("chart"), content: ChartContent }),
  z.object({ response_type: z.literal("table"), content: TableContent }),
  z.object({ response_type: z.literal("text"), content: TextContent }),
]);

const OutputFormatter = z.object({
  formatted_response: Content,
  raw_response: z.string(),
  confidence: z.number(),
  follow_up_questions: z.array(z.string()),
});

// New TypeScript type based on the Zod schema
export type FormattedResponse = {
  formatted_response: {
    response_type: "single_value" | "chart" | "table" | "text";
    content:
    | { value: number; unit?: string }
    | { chart_type: "bar" | "line"; data: Array<{ x: string; y: number }>; x_label: string; y_label: string }
    | { headers: string[]; rows: Array<Array<string | number>> }
    | { text: string };
  };
  raw_response: string;
  confidence: number;
  follow_up_questions: string[];
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const chatCompletion = async (messages: any[]) => {
  const systemMessage = {
    role: "system",
    content: "You are an AI assistant responding to queries about PDF content. Use the output_formatter function to structure your responses. Always provide both a formatted_response (choosing the most appropriate type from single_value, chart, table, or text) and a raw_response. The raw_response should be a comprehensive textual answer to the user's query. The formatted_response should represent the same information in a structured format suitable for visualization or display.",
  };

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [systemMessage, ...messages],
    tools: [zodFunction({ name: "output_formatter", parameters: OutputFormatter })],
  });

  const functionCall = response.choices[0].message.tool_calls?.[0];

  if (functionCall && functionCall.function.name === "output_formatter") {
    return JSON.parse(functionCall.function.arguments);
  } else {
    throw new Error("Unexpected response format from OpenAI API");
  }
};