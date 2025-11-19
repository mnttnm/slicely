/**
 * LLM Module Exports
 *
 * Multi-provider LLM service using Vercel AI SDK.
 */

// Types
export * from './types';

// Provider configuration
export {
  PROVIDER_CONFIGS,
  getProviderInstance,
  getModel,
  getDefaultModel,
  getModelConfig,
  calculateCost,
  getAvailableProviders,
  isProviderAvailable,
} from './providers';

// LLM Service functions
export {
  generateCompletion,
  generateStreamingCompletion,
  generateStructuredResponse,
  generateEmbedding,
  simpleCompletion,
  chatCompletion,
  createEmbedding,
  generateWithFallback,
  compareProviders,
  getAvailableModels,
} from './llm-service';
