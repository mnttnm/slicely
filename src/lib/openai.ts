import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
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

export type FormattedResponse = z.infer<typeof Content>;

const OutputFormatter = z.object({
  formatted_response: Content,
  raw_response: z.string(),
  confidence: z.number(),
  follow_up_questions: z.array(z.string()),
  context_object_ids: z.array(z.string()),
});

export type LLMResponse = z.infer<typeof OutputFormatter>;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const chatCompletion = async (messages: any[]) => {
  const systemMessage = {
    role: "system",
    content: `You are an AI assistant responding to queries about PDF content. 
Use the output_formatter function to structure your responses. 
Always provide both a formatted_response (choosing the most appropriate type from single_value, chart, table, or text) 
and a raw_response. The raw_response should be a comprehensive textual answer to the user's query. 
The formatted_response should represent the same information in a structured format suitable for visualization
or display. Additionally, include the context_object_ids array with the {id} of the context objects that are most relevant
in context of the generated response. These IDs are in the format <context_id>{id}</context_id> in the provided context, do not include the 
<context_id> tags in the context_object_ids array. Most importantly, If the context is empty, respond with "No relevant information found in the context."`,
  };

  console.log("llm prompt messages", [systemMessage, ...messages]);

  const response = await openai.beta.chat.completions.parse({
    model: "gpt-4o-mini",
    messages: [systemMessage, ...messages],
    response_format: zodResponseFormat(OutputFormatter, "llm_response"),
  });

  const llmResponse = response.choices[0].message.parsed;

  console.log("llmResponse", llmResponse);
  if (!llmResponse) {
    throw new Error("Unexpected response format from OpenAI API");
  }

  return llmResponse;
};