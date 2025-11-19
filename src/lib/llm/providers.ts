/**
 * LLM Provider Configuration
 *
 * Configuration for all supported LLM providers using Vercel AI SDK.
 */

import { openai, createOpenAI } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import type { LLMProviderConfig, LLMProviderType, LLMModelConfig } from './types';

// =============================================================================
// Provider Configurations
// =============================================================================

export const PROVIDER_CONFIGS: Record<LLMProviderType, LLMProviderConfig> = {
  openai: {
    id: 'openai',
    name: 'OpenAI',
    requiresApiKey: true,
    supportsStructuredOutput: true,
    supportsStreaming: true,
    supportsEmbeddings: true,
    models: [
      {
        id: 'gpt-4o',
        name: 'GPT-4o',
        contextWindow: 128000,
        maxOutputTokens: 16384,
        pricing: { input: 2.5, output: 10 },
        capabilities: ['reasoning', 'coding', 'vision', 'structured-output'],
        recommended: true,
      },
      {
        id: 'gpt-4o-mini',
        name: 'GPT-4o Mini',
        contextWindow: 128000,
        maxOutputTokens: 16384,
        pricing: { input: 0.15, output: 0.6 },
        capabilities: ['fast', 'affordable', 'structured-output'],
        recommended: false,
      },
      {
        id: 'gpt-4-turbo',
        name: 'GPT-4 Turbo',
        contextWindow: 128000,
        maxOutputTokens: 4096,
        pricing: { input: 10, output: 30 },
        capabilities: ['reasoning', 'coding', 'vision'],
        recommended: false,
      },
    ],
  },

  anthropic: {
    id: 'anthropic',
    name: 'Anthropic Claude',
    requiresApiKey: true,
    supportsStructuredOutput: true,
    supportsStreaming: true,
    supportsEmbeddings: false,
    models: [
      {
        id: 'claude-3-5-sonnet-20241022',
        name: 'Claude 3.5 Sonnet',
        contextWindow: 200000,
        maxOutputTokens: 8192,
        pricing: { input: 3, output: 15 },
        capabilities: ['reasoning', 'document-analysis', 'coding', 'long-context'],
        recommended: true,
      },
      {
        id: 'claude-3-5-haiku-20241022',
        name: 'Claude 3.5 Haiku',
        contextWindow: 200000,
        maxOutputTokens: 8192,
        pricing: { input: 1, output: 5 },
        capabilities: ['fast', 'affordable', 'long-context'],
        recommended: false,
      },
      {
        id: 'claude-3-opus-20240229',
        name: 'Claude 3 Opus',
        contextWindow: 200000,
        maxOutputTokens: 4096,
        pricing: { input: 15, output: 75 },
        capabilities: ['advanced-reasoning', 'complex-tasks'],
        recommended: false,
      },
    ],
  },

  google: {
    id: 'google',
    name: 'Google Gemini',
    requiresApiKey: true,
    supportsStructuredOutput: true,
    supportsStreaming: true,
    supportsEmbeddings: true,
    models: [
      {
        id: 'gemini-1.5-flash',
        name: 'Gemini 1.5 Flash',
        contextWindow: 1000000,
        maxOutputTokens: 8192,
        pricing: { input: 0.075, output: 0.3 },
        capabilities: ['fast', 'affordable', 'multimodal', 'long-context'],
        recommended: true,
      },
      {
        id: 'gemini-1.5-pro',
        name: 'Gemini 1.5 Pro',
        contextWindow: 2000000,
        maxOutputTokens: 8192,
        pricing: { input: 1.25, output: 5 },
        capabilities: ['advanced-reasoning', 'multimodal', 'very-long-context'],
        recommended: false,
      },
    ],
  },

  azure: {
    id: 'azure',
    name: 'Azure OpenAI',
    requiresApiKey: true,
    supportsStructuredOutput: true,
    supportsStreaming: true,
    supportsEmbeddings: true,
    models: [
      {
        id: 'gpt-4o',
        name: 'GPT-4o (Azure)',
        contextWindow: 128000,
        maxOutputTokens: 16384,
        pricing: { input: 2.5, output: 10 },
        capabilities: ['enterprise-sla', 'data-residency', 'compliance'],
        recommended: true,
      },
    ],
  },

  ollama: {
    id: 'ollama',
    name: 'Ollama (Self-Hosted)',
    requiresApiKey: false,
    supportsStructuredOutput: true,
    supportsStreaming: true,
    supportsEmbeddings: true,
    models: [
      {
        id: 'llama3.1:70b',
        name: 'Llama 3.1 70B',
        contextWindow: 128000,
        maxOutputTokens: 4096,
        pricing: { input: 0, output: 0 },
        capabilities: ['free', 'on-premise', 'privacy'],
        recommended: true,
      },
      {
        id: 'llama3.1:8b',
        name: 'Llama 3.1 8B',
        contextWindow: 128000,
        maxOutputTokens: 4096,
        pricing: { input: 0, output: 0 },
        capabilities: ['fast', 'lightweight', 'free'],
        recommended: false,
      },
      {
        id: 'mistral:7b',
        name: 'Mistral 7B',
        contextWindow: 8192,
        maxOutputTokens: 4096,
        pricing: { input: 0, output: 0 },
        capabilities: ['fast', 'lightweight', 'free'],
        recommended: false,
      },
    ],
  },
};

// =============================================================================
// Provider Factory Functions
// =============================================================================

/**
 * Get the Vercel AI SDK provider instance for a given provider type.
 */
export function getProviderInstance(providerType: LLMProviderType, apiKey?: string) {
  switch (providerType) {
    case 'openai':
      if (apiKey) {
        return createOpenAI({ apiKey });
      }
      return openai;

    case 'anthropic':
      if (apiKey) {
        // Anthropic SDK uses ANTHROPIC_API_KEY env var by default
        // For custom keys, we need to create a new instance
        const { createAnthropic } = require('@ai-sdk/anthropic');
        return createAnthropic({ apiKey });
      }
      return anthropic;

    case 'google':
      if (apiKey) {
        const { createGoogleGenerativeAI } = require('@ai-sdk/google');
        return createGoogleGenerativeAI({ apiKey });
      }
      return google;

    case 'azure':
      // Azure OpenAI requires endpoint configuration
      const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
      const azureKey = apiKey || process.env.AZURE_OPENAI_API_KEY;

      if (!azureEndpoint) {
        throw new Error('AZURE_OPENAI_ENDPOINT is required for Azure OpenAI');
      }

      return createOpenAI({
        baseURL: azureEndpoint,
        apiKey: azureKey,
      });

    case 'ollama':
      // Ollama runs locally, no API key needed
      const ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434/v1';
      return createOpenAI({
        baseURL: ollamaUrl,
        apiKey: 'ollama', // Ollama doesn't require a real key
      });

    default:
      throw new Error(`Unknown provider: ${providerType}`);
  }
}

/**
 * Get a specific model from a provider.
 */
export function getModel(providerType: LLMProviderType, modelId: string, apiKey?: string) {
  const provider = getProviderInstance(providerType, apiKey);
  return provider(modelId);
}

/**
 * Get the default model for a provider.
 */
export function getDefaultModel(providerType: LLMProviderType): string {
  const config = PROVIDER_CONFIGS[providerType];
  const recommended = config.models.find((m) => m.recommended);
  return recommended?.id || config.models[0].id;
}

/**
 * Get model configuration by provider and model ID.
 */
export function getModelConfig(providerType: LLMProviderType, modelId: string): LLMModelConfig | undefined {
  const config = PROVIDER_CONFIGS[providerType];
  return config.models.find((m) => m.id === modelId);
}

/**
 * Calculate cost for a given usage.
 */
export function calculateCost(
  providerType: LLMProviderType,
  modelId: string,
  inputTokens: number,
  outputTokens: number
): number {
  const modelConfig = getModelConfig(providerType, modelId);
  if (!modelConfig) return 0;

  const inputCost = (inputTokens / 1_000_000) * modelConfig.pricing.input;
  const outputCost = (outputTokens / 1_000_000) * modelConfig.pricing.output;

  return inputCost + outputCost;
}

/**
 * Get all available providers.
 */
export function getAvailableProviders(): LLMProviderConfig[] {
  return Object.values(PROVIDER_CONFIGS);
}

/**
 * Check if a provider is available (has required configuration).
 */
export function isProviderAvailable(providerType: LLMProviderType): boolean {
  switch (providerType) {
    case 'openai':
      return !!process.env.OPENAI_API_KEY;
    case 'anthropic':
      return !!process.env.ANTHROPIC_API_KEY;
    case 'google':
      return !!process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    case 'azure':
      return !!process.env.AZURE_OPENAI_ENDPOINT && !!process.env.AZURE_OPENAI_API_KEY;
    case 'ollama':
      // Ollama is always "available" but may not be running
      return true;
    default:
      return false;
  }
}
