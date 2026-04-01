/**
 * LLM Service
 *
 * Multi-provider LLM service using Vercel AI SDK.
 * Provides a unified interface for text generation, structured outputs, and embeddings.
 */

'use server';

import { generateText, streamText, generateObject, embed } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import {
  type LLMConfig,
  type LLMCompletionRequest,
  type LLMCompletionResponse,
  type LLMResponse,
  type EmbeddingRequest,
  type EmbeddingResponse,
  type LLMProviderType,
  LLMResponseSchema,
  LLMError,
} from './types';
import { getModel, calculateCost, getDefaultModel, PROVIDER_CONFIGS } from './providers';

// =============================================================================
// Core LLM Functions
// =============================================================================

/**
 * Generate text completion using any supported provider.
 */
export async function generateCompletion(request: LLMCompletionRequest): Promise<LLMCompletionResponse> {
  const { prompt, systemPrompt, config } = request;
  const model = getModel(config.provider, config.model, config.apiKey);

  try {
    const result = await generateText({
      model,
      system: systemPrompt,
      prompt,
      temperature: config.temperature ?? 0.7,
      ...(config.maxTokens && { maxOutputTokens: config.maxTokens }),
    });

    const inputTokens = (result.usage as any).promptTokens ?? (result.usage as any).inputTokens ?? 0;
    const outputTokens = (result.usage as any).completionTokens ?? (result.usage as any).outputTokens ?? 0;

    const cost = calculateCost(
      config.provider,
      config.model,
      inputTokens,
      outputTokens
    );

    return {
      text: result.text,
      usage: {
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
      },
      cost,
      provider: config.provider,
      model: config.model,
      finishReason: result.finishReason as any,
    };
  } catch (error: any) {
    throw new LLMError(
      error.message || 'Failed to generate completion',
      'COMPLETION_FAILED',
      config.provider,
      error.status,
      error.status === 429 // Rate limit is retryable
    );
  }
}

/**
 * Generate streaming text completion.
 * Returns a ReadableStream for real-time UI updates.
 */
export async function generateStreamingCompletion(
  request: LLMCompletionRequest
): Promise<ReadableStream> {
  const { prompt, systemPrompt, config } = request;
  const model = getModel(config.provider, config.model, config.apiKey);

  try {
    const result = streamText({
      model,
      system: systemPrompt,
      prompt,
      temperature: config.temperature ?? 0.7,
      ...(config.maxTokens && { maxOutputTokens: config.maxTokens }),
    });

    return result.textStream as unknown as ReadableStream;
  } catch (error: any) {
    throw new LLMError(
      error.message || 'Failed to stream completion',
      'STREAM_FAILED',
      config.provider,
      error.status,
      error.status === 429
    );
  }
}

/**
 * Generate structured output matching the Slicely LLM response schema.
 * This maintains backward compatibility with the existing output format.
 */
export async function generateStructuredResponse(
  context: string,
  instruction: string,
  config: LLMConfig,
  contextObjectIds: string[] = []
): Promise<LLMResponse> {
  const model = getModel(config.provider, config.model, config.apiKey);

  const systemPrompt = `You are an expert AI assistant that analyzes document content and provides structured responses.

Your response must be in a specific format with:
1. A formatted_response that can be one of: single_value, chart, table, or text
2. A raw_response with a plain text version
3. A confidence score between 0 and 1
4. Follow-up questions that could help clarify or expand on the analysis
5. Context object IDs that were most relevant to your response

Guidelines for response_type selection:
- Use "single_value" for numeric answers, totals, counts, or brief factual answers
- Use "chart" for data that shows trends, comparisons, or distributions
- Use "table" for structured data with multiple fields per item
- Use "text" for explanations, summaries, or complex answers

Always provide accurate, helpful responses based on the context provided.`;

  const userPrompt = `Context:
${context}

Instruction: ${instruction}

Context Object IDs available: ${contextObjectIds.join(', ') || 'none'}`;

  try {
    const result = await generateObject({
      model,
      schema: LLMResponseSchema,
      system: systemPrompt,
      prompt: userPrompt,
      temperature: config.temperature ?? 0.7,
      ...(config.maxTokens && { maxOutputTokens: config.maxTokens }),
    });

    return result.object;
  } catch (error: any) {
    // If structured output fails, fall back to text response
    console.error('Structured output failed, falling back to text:', error);

    const textResult = await generateText({
      model,
      system: systemPrompt,
      prompt: userPrompt,
      temperature: config.temperature ?? 0.7,
      ...(config.maxTokens && { maxOutputTokens: config.maxTokens }),
    });

    // Return a text-type response
    return {
      formatted_response: {
        response_type: 'text',
        content: { text: textResult.text },
      },
      raw_response: textResult.text,
      confidence: 0.7,
      follow_up_questions: [],
      context_object_ids: contextObjectIds,
    };
  }
}

/**
 * Generate embeddings for text.
 * Defaults to OpenAI text-embedding-3-small.
 */
export async function generateEmbedding(request: EmbeddingRequest): Promise<EmbeddingResponse> {
  const { text, config } = request;
  const provider = config?.provider || 'openai';
  const modelId = config?.model || 'text-embedding-3-small';

  // Currently only OpenAI embeddings are supported
  if (provider !== 'openai' && provider !== 'azure') {
    throw new LLMError(
      `Embeddings not supported for provider: ${provider}`,
      'EMBEDDINGS_NOT_SUPPORTED',
      provider
    );
  }

  try {
    const embeddingModel = openai.embedding(modelId);

    const result = await embed({
      model: embeddingModel,
      value: text,
    });

    return {
      embedding: result.embedding,
      dimensions: result.embedding.length,
      model: modelId,
      provider,
    };
  } catch (error: any) {
    throw new LLMError(
      error.message || 'Failed to generate embedding',
      'EMBEDDING_FAILED',
      provider,
      error.status,
      error.status === 429
    );
  }
}

// =============================================================================
// Convenience Functions
// =============================================================================

/**
 * Simple completion with default settings.
 * Backward compatible with existing code that just needs text output.
 */
export async function simpleCompletion(
  prompt: string,
  apiKey?: string,
  options?: {
    provider?: LLMProviderType;
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }
): Promise<string> {
  const provider = options?.provider || 'openai';
  const model = options?.model || getDefaultModel(provider);

  const result = await generateCompletion({
    prompt,
    config: {
      provider,
      model,
      temperature: options?.temperature,
      maxTokens: options?.maxTokens,
      apiKey,
    },
  });

  return result.text;
}

/**
 * Chat completion with messages (backward compatible with existing chatCompletion).
 */
export async function chatCompletion(
  messages: Array<{ role: string; content: string }>,
  apiKey: string,
  options?: {
    provider?: LLMProviderType;
    model?: string;
    temperature?: number;
  }
): Promise<LLMResponse> {
  const provider = options?.provider || 'openai';
  const model = options?.model || 'gpt-4o-mini';

  // Extract system message and user messages
  const systemMessage = messages.find((m) => m.role === 'system');
  const userMessages = messages.filter((m) => m.role !== 'system');

  // Combine user messages into context and instruction
  const context = userMessages.length > 1 ? userMessages.slice(0, -1).map((m) => m.content).join('\n') : '';
  const instruction = userMessages[userMessages.length - 1]?.content || '';

  return generateStructuredResponse(
    context || instruction,
    instruction,
    {
      provider,
      model,
      temperature: options?.temperature,
      apiKey,
    }
  );
}

/**
 * Generate embedding (backward compatible with existing generateEmbedding).
 */
export async function createEmbedding(text: string, apiKey?: string): Promise<number[]> {
  const result = await generateEmbedding({
    text,
    config: {
      provider: 'openai',
      apiKey,
    },
  });

  return result.embedding;
}

// =============================================================================
// Multi-Provider Features
// =============================================================================

/**
 * Generate completion with automatic fallback to alternative providers.
 */
export async function generateWithFallback(
  request: LLMCompletionRequest,
  fallbackProviders: LLMProviderType[] = ['anthropic', 'google']
): Promise<LLMCompletionResponse> {
  const providers = [request.config.provider, ...fallbackProviders];

  let lastError: Error | null = null;

  for (const provider of providers) {
    try {
      const result = await generateCompletion({
        ...request,
        config: {
          ...request.config,
          provider,
          model: request.config.model || getDefaultModel(provider),
        },
      });

      return result;
    } catch (error: any) {
      console.error(`Provider ${provider} failed:`, error.message);
      lastError = error;
      // Continue to next provider
    }
  }

  throw lastError || new Error('All providers failed');
}

/**
 * Compare responses from multiple providers (for A/B testing).
 */
export async function compareProviders(
  prompt: string,
  providers: Array<{ provider: LLMProviderType; model: string }>,
  apiKeys?: Record<LLMProviderType, string>
): Promise<Array<{ provider: LLMProviderType; model: string; response: LLMCompletionResponse }>> {
  const results = await Promise.allSettled(
    providers.map(({ provider, model }) =>
      generateCompletion({
        prompt,
        config: {
          provider,
          model,
          apiKey: apiKeys?.[provider],
        },
      })
    )
  );

  return results
    .map((result, index) => {
      if (result.status === 'fulfilled') {
        return {
          provider: providers[index].provider,
          model: providers[index].model,
          response: result.value,
        };
      }
      return null;
    })
    .filter(Boolean) as Array<{
    provider: LLMProviderType;
    model: string;
    response: LLMCompletionResponse;
  }>;
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Get available models for the current environment.
 */
export function getAvailableModels(): Array<{
  provider: LLMProviderType;
  model: string;
  name: string;
  available: boolean;
}> {
  const models: Array<{
    provider: LLMProviderType;
    model: string;
    name: string;
    available: boolean;
  }> = [];

  for (const [providerType, config] of Object.entries(PROVIDER_CONFIGS)) {
    const available = isProviderConfigured(providerType as LLMProviderType);

    for (const model of config.models) {
      models.push({
        provider: providerType as LLMProviderType,
        model: model.id,
        name: `${config.name} - ${model.name}`,
        available,
      });
    }
  }

  return models;
}

/**
 * Check if a provider is configured with API keys.
 */
function isProviderConfigured(provider: LLMProviderType): boolean {
  switch (provider) {
    case 'openai':
      return !!process.env.OPENAI_API_KEY;
    case 'anthropic':
      return !!process.env.ANTHROPIC_API_KEY;
    case 'google':
      return !!process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    case 'azure':
      return !!process.env.AZURE_OPENAI_ENDPOINT && !!process.env.AZURE_OPENAI_API_KEY;
    case 'ollama':
      return true; // Always "available"
    default:
      return false;
  }
}
