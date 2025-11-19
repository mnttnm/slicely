/**
 * LLM Service Types
 *
 * Type definitions for the multi-provider LLM service using Vercel AI SDK.
 */

import { z } from 'zod';

// =============================================================================
// Provider Types
// =============================================================================

export type LLMProviderType = 'openai' | 'anthropic' | 'google' | 'azure' | 'ollama';

export interface LLMProviderConfig {
  id: LLMProviderType;
  name: string;
  models: LLMModelConfig[];
  requiresApiKey: boolean;
  supportsStructuredOutput: boolean;
  supportsStreaming: boolean;
  supportsEmbeddings: boolean;
}

export interface LLMModelConfig {
  id: string;
  name: string;
  contextWindow: number;
  maxOutputTokens: number;
  pricing: {
    input: number; // $ per 1M tokens
    output: number; // $ per 1M tokens
  };
  capabilities: string[];
  recommended?: boolean;
}

// =============================================================================
// Request/Response Types
// =============================================================================

export interface LLMConfig {
  provider: LLMProviderType;
  model: string;
  temperature?: number;
  maxTokens?: number;
  apiKey?: string; // Override default API key
}

export interface LLMCompletionRequest {
  prompt: string;
  systemPrompt?: string;
  config: LLMConfig;
}

export interface LLMCompletionResponse {
  text: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  cost: number;
  provider: LLMProviderType;
  model: string;
  finishReason: 'stop' | 'length' | 'content_filter' | 'tool_calls' | 'error' | 'other' | 'unknown';
}

export interface LLMStreamResponse {
  stream: ReadableStream;
  provider: LLMProviderType;
  model: string;
}

// =============================================================================
// Structured Output Types (matching existing Slicely schema)
// =============================================================================

// Single value response (e.g., "Total: $1,234.56")
export const SingleValueContentSchema = z.object({
  value: z.union([z.string(), z.number()]),
  unit: z.string().optional(),
});

// Chart response
export const ChartContentSchema = z.object({
  chart_type: z.enum(['bar', 'line']),
  data: z.array(
    z.object({
      x: z.union([z.string(), z.number()]),
      y: z.number(),
    })
  ),
  x_label: z.string(),
  y_label: z.string(),
});

// Table response
export const TableContentSchema = z.object({
  headers: z.array(z.string()),
  rows: z.array(z.array(z.union([z.string(), z.number()]))),
});

// Text response
export const TextContentSchema = z.object({
  text: z.string(),
});

// Formatted response (discriminated union)
export const FormattedResponseSchema = z.discriminatedUnion('response_type', [
  z.object({
    response_type: z.literal('single_value'),
    content: SingleValueContentSchema,
  }),
  z.object({
    response_type: z.literal('chart'),
    content: ChartContentSchema,
  }),
  z.object({
    response_type: z.literal('table'),
    content: TableContentSchema,
  }),
  z.object({
    response_type: z.literal('text'),
    content: TextContentSchema,
  }),
]);

// Full LLM response schema
export const LLMResponseSchema = z.object({
  formatted_response: FormattedResponseSchema,
  raw_response: z.string(),
  confidence: z.number().min(0).max(1),
  follow_up_questions: z.array(z.string()),
  context_object_ids: z.array(z.string()),
});

// Type exports
export type SingleValueContent = z.infer<typeof SingleValueContentSchema>;
export type ChartContent = z.infer<typeof ChartContentSchema>;
export type TableContent = z.infer<typeof TableContentSchema>;
export type TextContent = z.infer<typeof TextContentSchema>;
export type FormattedResponse = z.infer<typeof FormattedResponseSchema>;
export type LLMResponse = z.infer<typeof LLMResponseSchema>;

// =============================================================================
// Embedding Types
// =============================================================================

export interface EmbeddingRequest {
  text: string;
  config?: {
    provider?: LLMProviderType;
    model?: string;
    apiKey?: string;
  };
}

export interface EmbeddingResponse {
  embedding: number[];
  dimensions: number;
  model: string;
  provider: LLMProviderType;
}

// =============================================================================
// Error Types
// =============================================================================

export class LLMError extends Error {
  constructor(
    message: string,
    public code: string,
    public provider: LLMProviderType,
    public statusCode?: number,
    public retryable?: boolean
  ) {
    super(message);
    this.name = 'LLMError';
  }
}

// =============================================================================
// Usage Tracking Types
// =============================================================================

export interface LLMUsageRecord {
  id?: string;
  provider: LLMProviderType;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  requestType: 'completion' | 'embedding' | 'structured';
  resourceType?: string;
  resourceId?: string;
  timestamp: Date;
}
