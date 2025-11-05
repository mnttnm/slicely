# Implementation Plan: Multi-LLM Provider Support

**Priority:** 🟠 HIGH
**Impact:** 80/100
**Effort:** Medium (3 weeks)
**Owner:** Backend Engineering
**Dependencies:** None

---

## 1. Overview

### Objective
Add support for multiple LLM providers (Anthropic Claude, Azure OpenAI, AWS Bedrock, Ollama) to eliminate vendor lock-in, enable cost optimization, support data residency requirements, and provide fallback options.

### Current Limitation
- ❌ OpenAI only (vendor lock-in)
- ❌ No fallback if OpenAI is down
- ❌ No cost optimization (different models for different tasks)
- ❌ No data residency options (EU customers need Azure OpenAI)

### Success Criteria
- ✅ Support for 4+ LLM providers
- ✅ Provider selection per slicer
- ✅ Automatic fallback on failure
- ✅ Cost tracking per provider
- ✅ Quality comparison (A/B testing)
- ✅ Unified interface (same code for all providers)

---

## 2. Provider Priorities

### Tier 1: Cloud Providers (Week 1-2)

1. **Anthropic Claude** (Highest Priority)
   - **Why:** Best for document analysis, 200K context window
   - **Models:** Claude 3.5 Sonnet, Claude 3 Opus, Claude 3 Haiku
   - **Cost:** $3/1M tokens (Sonnet), $15/1M (Opus), $0.25/1M (Haiku)
   - **Strengths:** Reasoning, document analysis, structured outputs
   - **Use Case:** Complex document analysis, contract review

2. **Azure OpenAI** (Enterprise Priority)
   - **Why:** Same OpenAI models with enterprise SLAs + data residency
   - **Models:** GPT-4o, GPT-4o-mini, GPT-4 Turbo
   - **Cost:** Same as OpenAI
   - **Strengths:** Enterprise support, EU data residency, Azure integration
   - **Use Case:** Enterprise customers with Azure infrastructure

3. **AWS Bedrock** (Multi-Model Access)
   - **Why:** Access to Claude, Llama, Mistral, Cohere in one platform
   - **Models:** Claude 3.5, Llama 3, Mistral Large, Cohere Command
   - **Cost:** Varies by model
   - **Strengths:** AWS integration, variety of models
   - **Use Case:** AWS customers, cost optimization

4. **Google Vertex AI (Gemini)** (Multimodal)
   - **Why:** Multimodal (text + images), good for tables
   - **Models:** Gemini 1.5 Pro, Gemini 1.5 Flash
   - **Cost:** $1.25/1M tokens (Flash), $3.50/1M (Pro)
   - **Strengths:** Multimodal, GCP integration
   - **Use Case:** Image-heavy PDFs, GCP customers

### Tier 2: Open-Source/Self-Hosted (Week 3)

5. **Ollama** (On-Premise)
   - **Why:** No API costs, data privacy, on-premise deployments
   - **Models:** Llama 3, Mistral, Phi-3
   - **Cost:** $0 (self-hosted)
   - **Strengths:** Privacy, no API costs, offline capability
   - **Use Case:** Sensitive data, on-premise customers

---

## 3. Technical Architecture

### 3.1 Provider Abstraction Layer

```typescript
// src/lib/llm/types.ts

export interface LLMProvider {
  id: string;
  name: string;
  type: ProviderType;
  icon: string;

  // Capabilities
  supportsStructuredOutput: boolean;
  supportsVision: boolean;
  supportsStreaming: boolean;
  maxTokens: number;
  contextWindow: number;

  // Available models
  models: LLMModel[];

  // Methods
  completion(request: CompletionRequest): Promise<CompletionResponse>;
  structuredCompletion<T>(request: StructuredCompletionRequest<T>): Promise<T>;
  embedding?(text: string): Promise<number[]>;
}

export enum ProviderType {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  AZURE_OPENAI = 'azure-openai',
  AWS_BEDROCK = 'aws-bedrock',
  GOOGLE_VERTEX = 'google-vertex',
  OLLAMA = 'ollama',
}

export interface LLMModel {
  id: string;
  name: string;
  contextWindow: number;
  maxOutputTokens: number;
  pricing: {
    input: number;   // $ per 1M tokens
    output: number;  // $ per 1M tokens
  };
  strengths: string[];
  recommended: boolean;
}

export interface CompletionRequest {
  messages: Message[];
  model: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface CompletionResponse {
  content: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  cost: number;
  provider: string;
  model: string;
  finishReason: 'stop' | 'length' | 'content_filter';
}

export interface StructuredCompletionRequest<T> extends CompletionRequest {
  schema: ZodSchema<T>;
  instruction: string;
}
```

### 3.2 Provider Implementations

#### OpenAI Provider (Existing)

```typescript
// src/lib/llm/providers/openai.ts

import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';

export class OpenAIProvider implements LLMProvider {
  id = 'openai';
  name = 'OpenAI';
  type = ProviderType.OPENAI;
  icon = '/providers/openai.svg';

  supportsStructuredOutput = true;
  supportsVision = true;
  supportsStreaming = true;
  maxTokens = 16384;
  contextWindow = 128000;

  models: LLMModel[] = [
    {
      id: 'gpt-4o',
      name: 'GPT-4o',
      contextWindow: 128000,
      maxOutputTokens: 16384,
      pricing: { input: 2.5, output: 10 },
      strengths: ['reasoning', 'coding', 'vision'],
      recommended: true,
    },
    {
      id: 'gpt-4o-mini',
      name: 'GPT-4o Mini',
      contextWindow: 128000,
      maxOutputTokens: 16384,
      pricing: { input: 0.15, output: 0.6 },
      strengths: ['fast', 'affordable', 'general-purpose'],
      recommended: false,
    },
  ];

  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async completion(request: CompletionRequest): Promise<CompletionResponse> {
    const response = await this.client.chat.completions.create({
      model: request.model,
      messages: request.messages,
      temperature: request.temperature,
      max_tokens: request.maxTokens,
    });

    const choice = response.choices[0];
    const usage = response.usage!;

    return {
      content: choice.message.content!,
      usage: {
        inputTokens: usage.prompt_tokens,
        outputTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens,
      },
      cost: this.calculateCost(request.model, usage),
      provider: this.id,
      model: request.model,
      finishReason: choice.finish_reason as any,
    };
  }

  async structuredCompletion<T>(
    request: StructuredCompletionRequest<T>
  ): Promise<T> {
    const response = await this.client.beta.chat.completions.parse({
      model: request.model,
      messages: [
        {
          role: 'system',
          content: request.instruction,
        },
        ...request.messages,
      ],
      response_format: zodResponseFormat(request.schema, 'result'),
    });

    return response.choices[0].message.parsed!;
  }

  async embedding(text: string): Promise<number[]> {
    const response = await this.client.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });

    return response.data[0].embedding;
  }

  private calculateCost(model: string, usage: any): number {
    const modelPricing = this.models.find((m) => m.id === model)?.pricing;
    if (!modelPricing) return 0;

    const inputCost = (usage.prompt_tokens / 1000000) * modelPricing.input;
    const outputCost = (usage.completion_tokens / 1000000) * modelPricing.output;

    return inputCost + outputCost;
  }
}
```

#### Anthropic Provider

```typescript
// src/lib/llm/providers/anthropic.ts

import Anthropic from '@anthropic-ai/sdk';

export class AnthropicProvider implements LLMProvider {
  id = 'anthropic';
  name = 'Anthropic Claude';
  type = ProviderType.ANTHROPIC;
  icon = '/providers/anthropic.svg';

  supportsStructuredOutput = true;
  supportsVision = true;
  supportsStreaming = true;
  maxTokens = 8192;
  contextWindow = 200000;

  models: LLMModel[] = [
    {
      id: 'claude-3-5-sonnet-20241022',
      name: 'Claude 3.5 Sonnet',
      contextWindow: 200000,
      maxOutputTokens: 8192,
      pricing: { input: 3, output: 15 },
      strengths: ['reasoning', 'document-analysis', 'coding'],
      recommended: true,
    },
    {
      id: 'claude-3-haiku-20240307',
      name: 'Claude 3 Haiku',
      contextWindow: 200000,
      maxOutputTokens: 4096,
      pricing: { input: 0.25, output: 1.25 },
      strengths: ['fast', 'affordable'],
      recommended: false,
    },
  ];

  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async completion(request: CompletionRequest): Promise<CompletionResponse> {
    // Convert messages to Anthropic format
    const { system, messages } = this.convertMessages(request.messages);

    const response = await this.client.messages.create({
      model: request.model,
      system,
      messages,
      max_tokens: request.maxTokens || 4096,
      temperature: request.temperature,
    });

    const content = response.content[0].type === 'text'
      ? response.content[0].text
      : '';

    return {
      content,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      },
      cost: this.calculateCost(request.model, response.usage),
      provider: this.id,
      model: request.model,
      finishReason: response.stop_reason as any,
    };
  }

  async structuredCompletion<T>(
    request: StructuredCompletionRequest<T>
  ): Promise<T> {
    // Anthropic doesn't have native structured output yet
    // Use JSON mode with schema description

    const schemaDescription = this.generateSchemaDescription(request.schema);

    const response = await this.completion({
      ...request,
      messages: [
        {
          role: 'system',
          content: `${request.instruction}\n\nRespond with a JSON object matching this schema:\n${schemaDescription}`,
        },
        ...request.messages,
      ],
    });

    // Parse and validate
    const parsed = JSON.parse(response.content);
    return request.schema.parse(parsed);
  }

  private convertMessages(messages: Message[]): { system: string; messages: any[] } {
    let system = '';
    const converted = [];

    for (const msg of messages) {
      if (msg.role === 'system') {
        system = msg.content;
      } else {
        converted.push({
          role: msg.role,
          content: msg.content,
        });
      }
    }

    return { system, messages: converted };
  }

  private calculateCost(model: string, usage: any): number {
    const modelPricing = this.models.find((m) => m.id === model)?.pricing;
    if (!modelPricing) return 0;

    const inputCost = (usage.input_tokens / 1000000) * modelPricing.input;
    const outputCost = (usage.output_tokens / 1000000) * modelPricing.output;

    return inputCost + outputCost;
  }

  private generateSchemaDescription(schema: ZodSchema<any>): string {
    // Generate human-readable schema description for JSON mode
    return JSON.stringify(schema._def, null, 2);
  }
}
```

#### Azure OpenAI Provider

```typescript
// src/lib/llm/providers/azure-openai.ts

import { AzureOpenAI } from 'openai';

export class AzureOpenAIProvider implements LLMProvider {
  id = 'azure-openai';
  name = 'Azure OpenAI';
  type = ProviderType.AZURE_OPENAI;
  icon = '/providers/azure.svg';

  supportsStructuredOutput = true;
  supportsVision = true;
  supportsStreaming = true;
  maxTokens = 16384;
  contextWindow = 128000;

  models: LLMModel[] = [
    // Same models as OpenAI, but hosted on Azure
    {
      id: 'gpt-4o',
      name: 'GPT-4o',
      contextWindow: 128000,
      maxOutputTokens: 16384,
      pricing: { input: 2.5, output: 10 },
      strengths: ['reasoning', 'coding', 'enterprise-sla'],
      recommended: true,
    },
  ];

  private client: AzureOpenAI;

  constructor(endpoint: string, apiKey: string, deploymentName: string) {
    this.client = new AzureOpenAI({
      endpoint,
      apiKey,
      deployment: deploymentName,
      apiVersion: '2024-08-01-preview',
    });
  }

  async completion(request: CompletionRequest): Promise<CompletionResponse> {
    // Same implementation as OpenAI
    const response = await this.client.chat.completions.create({
      model: request.model,
      messages: request.messages,
      temperature: request.temperature,
      max_tokens: request.maxTokens,
    });

    // ... (same as OpenAI)
  }

  // ... (rest of implementation same as OpenAI)
}
```

#### AWS Bedrock Provider

```typescript
// src/lib/llm/providers/aws-bedrock.ts

import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';

export class AWSBedrockProvider implements LLMProvider {
  id = 'aws-bedrock';
  name = 'AWS Bedrock';
  type = ProviderType.AWS_BEDROCK;
  icon = '/providers/aws.svg';

  supportsStructuredOutput = true;
  supportsVision = false;
  supportsStreaming = true;
  maxTokens = 8192;
  contextWindow = 200000;

  models: LLMModel[] = [
    {
      id: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
      name: 'Claude 3.5 Sonnet (Bedrock)',
      contextWindow: 200000,
      maxOutputTokens: 8192,
      pricing: { input: 3, output: 15 },
      strengths: ['reasoning', 'aws-integration'],
      recommended: true,
    },
    {
      id: 'meta.llama3-70b-instruct-v1:0',
      name: 'Llama 3 70B',
      contextWindow: 8192,
      maxOutputTokens: 2048,
      pricing: { input: 0.99, output: 0.99 },
      strengths: ['open-source', 'affordable'],
      recommended: false,
    },
  ];

  private client: BedrockRuntimeClient;

  constructor(region: string) {
    this.client = new BedrockRuntimeClient({ region });
  }

  async completion(request: CompletionRequest): Promise<CompletionResponse> {
    // Bedrock uses model-specific request formats
    const modelFamily = this.getModelFamily(request.model);

    const requestBody = this.buildRequestBody(modelFamily, request);

    const response = await this.client.send(
      new InvokeModelCommand({
        modelId: request.model,
        body: JSON.stringify(requestBody),
      })
    );

    const responseBody = JSON.parse(new TextDecoder().decode(response.body));

    return this.parseResponse(modelFamily, responseBody, request.model);
  }

  private getModelFamily(modelId: string): 'anthropic' | 'meta' | 'mistral' {
    if (modelId.startsWith('anthropic')) return 'anthropic';
    if (modelId.startsWith('meta')) return 'meta';
    if (modelId.startsWith('mistral')) return 'mistral';
    throw new Error(`Unknown model family: ${modelId}`);
  }

  private buildRequestBody(family: string, request: CompletionRequest): any {
    switch (family) {
      case 'anthropic':
        return {
          anthropic_version: 'bedrock-2023-05-31',
          messages: request.messages,
          max_tokens: request.maxTokens || 4096,
          temperature: request.temperature,
        };

      case 'meta':
        return {
          prompt: this.messagesToPrompt(request.messages),
          max_gen_len: request.maxTokens || 2048,
          temperature: request.temperature,
        };

      default:
        throw new Error(`Unsupported family: ${family}`);
    }
  }

  private parseResponse(family: string, body: any, model: string): CompletionResponse {
    switch (family) {
      case 'anthropic':
        return {
          content: body.content[0].text,
          usage: {
            inputTokens: body.usage.input_tokens,
            outputTokens: body.usage.output_tokens,
            totalTokens: body.usage.input_tokens + body.usage.output_tokens,
          },
          cost: 0, // Calculate based on pricing
          provider: this.id,
          model,
          finishReason: body.stop_reason,
        };

      case 'meta':
        return {
          content: body.generation,
          usage: {
            inputTokens: body.prompt_token_count,
            outputTokens: body.generation_token_count,
            totalTokens: body.prompt_token_count + body.generation_token_count,
          },
          cost: 0,
          provider: this.id,
          model,
          finishReason: 'stop',
        };

      default:
        throw new Error(`Unsupported family: ${family}`);
    }
  }
}
```

#### Ollama Provider (Self-Hosted)

```typescript
// src/lib/llm/providers/ollama.ts

export class OllamaProvider implements LLMProvider {
  id = 'ollama';
  name = 'Ollama (Self-Hosted)';
  type = ProviderType.OLLAMA;
  icon = '/providers/ollama.svg';

  supportsStructuredOutput = true;
  supportsVision = false;
  supportsStreaming = true;
  maxTokens = 4096;
  contextWindow = 8192;

  models: LLMModel[] = [
    {
      id: 'llama3:70b',
      name: 'Llama 3 70B',
      contextWindow: 8192,
      maxOutputTokens: 4096,
      pricing: { input: 0, output: 0 },
      strengths: ['free', 'on-premise', 'privacy'],
      recommended: true,
    },
    {
      id: 'mistral:7b',
      name: 'Mistral 7B',
      contextWindow: 8192,
      maxOutputTokens: 4096,
      pricing: { input: 0, output: 0 },
      strengths: ['fast', 'lightweight'],
      recommended: false,
    },
  ];

  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:11434') {
    this.baseUrl = baseUrl;
  }

  async completion(request: CompletionRequest): Promise<CompletionResponse> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        options: {
          temperature: request.temperature,
          num_predict: request.maxTokens,
        },
      }),
    });

    const data = await response.json();

    return {
      content: data.message.content,
      usage: {
        inputTokens: data.prompt_eval_count || 0,
        outputTokens: data.eval_count || 0,
        totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
      },
      cost: 0, // Free (self-hosted)
      provider: this.id,
      model: request.model,
      finishReason: 'stop',
    };
  }

  async structuredCompletion<T>(
    request: StructuredCompletionRequest<T>
  ): Promise<T> {
    // Ollama supports JSON mode
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: request.model,
        messages: [
          {
            role: 'system',
            content: `${request.instruction}\n\nRespond with a JSON object.`,
          },
          ...request.messages,
        ],
        format: 'json',
      }),
    });

    const data = await response.json();
    const parsed = JSON.parse(data.message.content);

    return request.schema.parse(parsed);
  }
}
```

---

### 3.3 Provider Registry & Selection

```typescript
// src/lib/llm/provider-registry.ts

export class LLMProviderRegistry {
  private providers = new Map<string, LLMProvider>();

  register(provider: LLMProvider): void {
    this.providers.set(provider.id, provider);
  }

  get(providerId: string): LLMProvider {
    const provider = this.providers.get(providerId);

    if (!provider) {
      throw new Error(`Provider not found: ${providerId}`);
    }

    return provider;
  }

  list(): LLMProvider[] {
    return Array.from(this.providers.values());
  }
}

// Global registry
export const llmRegistry = new LLMProviderRegistry();

// Initialize providers
export function initializeLLMProviders(config: LLMConfig) {
  if (config.openai?.apiKey) {
    llmRegistry.register(new OpenAIProvider(config.openai.apiKey));
  }

  if (config.anthropic?.apiKey) {
    llmRegistry.register(new AnthropicProvider(config.anthropic.apiKey));
  }

  if (config.azureOpenAI) {
    llmRegistry.register(
      new AzureOpenAIProvider(
        config.azureOpenAI.endpoint,
        config.azureOpenAI.apiKey,
        config.azureOpenAI.deploymentName
      )
    );
  }

  if (config.awsBedrock) {
    llmRegistry.register(new AWSBedrockProvider(config.awsBedrock.region));
  }

  if (config.ollama) {
    llmRegistry.register(new OllamaProvider(config.ollama.baseUrl));
  }
}
```

### 3.4 Fallback Logic

```typescript
// src/lib/llm/llm-service.ts

export class LLMService {
  async completion(
    request: CompletionRequest,
    options: {
      primaryProvider: string;
      fallbackProviders?: string[];
      maxRetries?: number;
    }
  ): Promise<CompletionResponse> {
    const providers = [
      options.primaryProvider,
      ...(options.fallbackProviders || []),
    ];

    let lastError: Error | null = null;

    for (const providerId of providers) {
      try {
        const provider = llmRegistry.get(providerId);
        const response = await provider.completion(request);

        // Track usage
        await this.trackUsage(response);

        return response;
      } catch (error: any) {
        console.error(`Provider ${providerId} failed:`, error);
        lastError = error;

        // Log failure
        await auditLogger.log({
          eventType: 'llm.provider.failed',
          eventCategory: 'system',
          action: 'read',
          resourceType: 'llm',
          status: 'failure',
          errorMessage: error.message,
          metadata: {
            provider: providerId,
            model: request.model,
          },
        });

        // Continue to next provider
        continue;
      }
    }

    throw new Error(`All providers failed. Last error: ${lastError?.message}`);
  }

  private async trackUsage(response: CompletionResponse): Promise<void> {
    // Track LLM usage for billing and analytics
    await supabase.from('llm_usage').insert({
      provider: response.provider,
      model: response.model,
      input_tokens: response.usage.inputTokens,
      output_tokens: response.usage.outputTokens,
      cost: response.cost,
      timestamp: new Date().toISOString(),
    });
  }
}

export const llmService = new LLMService();
```

---

## 4. Database Schema

```sql
-- Provider configurations (per slicer or organization)
CREATE TABLE llm_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slicer_id UUID REFERENCES slicers(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  provider VARCHAR(50) NOT NULL,         -- 'openai', 'anthropic', etc.
  model VARCHAR(100) NOT NULL,

  fallback_providers JSONB,              -- ['anthropic', 'azure-openai']

  temperature NUMERIC(3,2) DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 4096,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT one_scope CHECK (
    (slicer_id IS NOT NULL AND organization_id IS NULL) OR
    (slicer_id IS NULL AND organization_id IS NOT NULL)
  )
);

-- LLM usage tracking
CREATE TABLE llm_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  user_id UUID REFERENCES auth.users(id),

  provider VARCHAR(50) NOT NULL,
  model VARCHAR(100) NOT NULL,

  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  total_tokens INTEGER GENERATED ALWAYS AS (input_tokens + output_tokens) STORED,

  cost NUMERIC(10,6) NOT NULL,          -- USD

  request_type VARCHAR(50),              -- 'completion', 'embedding'
  resource_type VARCHAR(50),             -- 'slicer', 'pdf'
  resource_id UUID,

  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_llm_usage_org_timestamp ON llm_usage(organization_id, timestamp DESC);
CREATE INDEX idx_llm_usage_provider ON llm_usage(provider);

-- Provider credentials (encrypted)
CREATE TABLE llm_provider_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  provider VARCHAR(50) NOT NULL,

  credentials JSONB NOT NULL,            -- Encrypted credentials

  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, provider)
);
```

---

## 5. UI Components

### 5.1 Provider Selection

```typescript
// components/slicer-settings/LLMProviderSelector.tsx

export function LLMProviderSelector({ slicerId }: { slicerId: string }) {
  const [config, setConfig] = useState<LLMConfiguration | null>(null);
  const [providers] = useState<LLMProvider[]>(llmRegistry.list());

  return (
    <div className="space-y-4">
      <div>
        <Label>Primary LLM Provider</Label>
        <Select
          value={config?.provider}
          onValueChange={(provider) => setConfig({ ...config, provider })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select provider" />
          </SelectTrigger>
          <SelectContent>
            {providers.map((provider) => (
              <SelectItem key={provider.id} value={provider.id}>
                <div className="flex items-center gap-2">
                  <img src={provider.icon} className="h-5 w-5" />
                  {provider.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {config?.provider && (
        <div>
          <Label>Model</Label>
          <Select
            value={config?.model}
            onValueChange={(model) => setConfig({ ...config, model })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {getProvider(config.provider).models.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  <div className="flex items-center justify-between gap-4">
                    <span>{model.name}</span>
                    <Badge variant="outline">
                      ${model.pricing.input}/1M tokens
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div>
        <Label>Fallback Providers (Optional)</Label>
        <MultiSelect
          value={config?.fallbackProviders || []}
          onChange={(fallbacks) => setConfig({ ...config, fallbackProviders: fallbacks })}
          options={providers.map((p) => ({ label: p.name, value: p.id }))}
        />
        <p className="text-sm text-muted-foreground mt-1">
          If the primary provider fails, these providers will be tried in order
        </p>
      </div>
    </div>
  );
}
```

---

## 6. Rollout Plan

### Week 1: Provider Abstraction
- ✅ Create provider interface
- ✅ Refactor existing OpenAI code to use interface
- ✅ Implement provider registry
- ✅ Database schema

### Week 2: New Providers
- ✅ Implement Anthropic provider
- ✅ Implement Azure OpenAI provider
- ✅ Implement AWS Bedrock provider
- ✅ Testing

### Week 3: Ollama + UI
- ✅ Implement Ollama provider
- ✅ Build provider selection UI
- ✅ Cost tracking dashboard
- ✅ Documentation

---

## 7. Success Metrics

- **Provider Adoption:** 40%+ use non-OpenAI providers
- **Cost Savings:** 30%+ reduction for customers using cheaper models
- **Reliability:** <0.1% requests fail across all providers
- **Fallback Success Rate:** >90%

---

## 8. Next Steps

1. ✅ Review and approve
2. ✅ Begin Week 1 (Provider Abstraction)
3. ✅ Set up test accounts for all providers

---

**Document Owner:** Backend Engineering Team
**Last Updated:** November 5, 2025
**Status:** Ready for Implementation
