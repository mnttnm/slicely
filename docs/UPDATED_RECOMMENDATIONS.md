# Updated Implementation Recommendations: Production-Ready Solutions

**Date:** November 5, 2025
**Version:** 2.0 (Revised with industry-standard tools)
**Status:** RECOMMENDED APPROACH

---

## Overview

Based on additional research and industry best practices, this document updates our previous recommendations with more **battle-tested, production-ready solutions** that are widely adopted, well-maintained, and preferred by the developer community.

### Key Changes

| Component | Previous | **Updated (Recommended)** | Why |
|-----------|----------|---------------------------|-----|
| **Multi-LLM Support** | Individual integrations | **Vercel AI SDK** or **LiteLLM** | Unified interface, 100+ providers, better maintenance |
| **OCR Solution** | AWS Textract only | **DeepSeek-OCR** + **LLMWhisperer** + AWS Textract | Better accuracy, cost-effective, layout preservation |

---

## 1. Multi-LLM Provider: Vercel AI SDK vs LiteLLM

### Comparison Matrix

| Feature | Vercel AI SDK | LiteLLM | Previous Approach |
|---------|---------------|---------|-------------------|
| **Providers** | 100+ | 80+ (1.8K+ models) | 4-5 manual |
| **Interface** | TypeScript-first | Python + OpenAI format | Custom abstraction |
| **Streaming** | ✅ SSE-based | ✅ Native | ⚠️ Manual |
| **Structured Outputs** | ✅ Native | ✅ Via schema | ⚠️ Manual |
| **Tool Calling** | ✅ First-class | ✅ Supported | ⚠️ Manual |
| **Cost Tracking** | ❌ | ✅ Built-in | ⚠️ Manual |
| **Load Balancing** | ❌ | ✅ Built-in | ❌ |
| **Middleware** | ✅ Composable | ✅ Guardrails | ❌ |
| **Framework Support** | React, Vue, Svelte, Angular | Python, Any HTTP | Next.js only |
| **GitHub Stars** | 12K+ | 20K+ | N/A |
| **Maintenance** | Vercel (active) | BerriAI/Y Combinator | Custom |
| **Model Context Protocol** | ✅ | ❌ | ❌ |

### Recommendation: **Vercel AI SDK** (Primary) + **LiteLLM** (Optional)

**Use Vercel AI SDK for:**
- ✅ TypeScript/Next.js projects (perfect fit for Slicely)
- ✅ Frontend streaming & UI components
- ✅ Structured outputs & tool calling
- ✅ Agent workflows (agentic loop control)
- ✅ Model Context Protocol integrations
- ✅ Better developer experience

**Use LiteLLM for:**
- ✅ Python-based processing pipelines
- ✅ Cost tracking & analytics (built-in)
- ✅ Load balancing across multiple providers
- ✅ Proxy server (AI Gateway) for centralized management
- ✅ Advanced guardrails

**Hybrid Approach (Recommended):**
```typescript
// Frontend & interactive features: Vercel AI SDK
import { streamText } from 'ai';

// Backend batch processing: LiteLLM (via Python microservice)
// Cost tracking, load balancing, guardrails
```

---

## 2. Updated Multi-LLM Implementation with Vercel AI SDK

### 2.1 Installation & Setup

```bash
npm install ai @ai-sdk/openai @ai-sdk/anthropic @ai-sdk/google @ai-sdk/mistral
```

### 2.2 Provider Configuration

```typescript
// src/lib/llm/providers.ts

import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai'; // For Azure, custom endpoints

// OpenAI
export const openaiProvider = openai;

// Anthropic Claude
export const claudeProvider = anthropic;

// Google Gemini
export const geminiProvider = google;

// Azure OpenAI (custom endpoint)
export const azureProvider = createOpenAI({
  baseURL: process.env.AZURE_OPENAI_ENDPOINT,
  apiKey: process.env.AZURE_OPENAI_KEY,
  organization: '',
});

// Ollama (local/self-hosted)
export const ollamaProvider = createOpenAI({
  baseURL: 'http://localhost:11434/v1',
  apiKey: 'ollama', // Ollama doesn't require real API key
});

// AWS Bedrock (via custom provider)
export const bedrockProvider = createOpenAI({
  baseURL: process.env.BEDROCK_ENDPOINT,
  apiKey: process.env.AWS_ACCESS_KEY,
  // Note: Bedrock requires AWS signature, may need middleware
});
```

### 2.3 Unified Interface

```typescript
// src/lib/llm/llm-service.ts

import { generateText, streamText, generateObject } from 'ai';
import { z } from 'zod';

interface LLMConfig {
  provider: 'openai' | 'anthropic' | 'google' | 'azure' | 'ollama';
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export class LLMService {
  private getModel(config: LLMConfig) {
    const providerMap = {
      openai: openaiProvider,
      anthropic: claudeProvider,
      google: geminiProvider,
      azure: azureProvider,
      ollama: ollamaProvider,
    };

    const provider = providerMap[config.provider];
    return provider(config.model);
  }

  // Simple text generation
  async generateCompletion(
    prompt: string,
    config: LLMConfig
  ): Promise<string> {
    const { text } = await generateText({
      model: this.getModel(config),
      prompt,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
    });

    return text;
  }

  // Streaming text generation (for real-time UI)
  async streamCompletion(
    prompt: string,
    config: LLMConfig
  ) {
    const result = await streamText({
      model: this.getModel(config),
      prompt,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
    });

    return result.toAIStream(); // Compatible with Vercel AI SDK UI hooks
  }

  // Structured output with type safety
  async generateStructuredOutput<T>(
    prompt: string,
    schema: z.ZodSchema<T>,
    config: LLMConfig
  ): Promise<T> {
    const { object } = await generateObject({
      model: this.getModel(config),
      schema,
      prompt,
      temperature: config.temperature,
    });

    return object;
  }

  // Tool calling (for agents)
  async generateWithTools(
    prompt: string,
    tools: Record<string, any>,
    config: LLMConfig
  ) {
    const result = await generateText({
      model: this.getModel(config),
      prompt,
      tools,
      maxSteps: 5, // Multi-step tool execution
    });

    return result;
  }
}

export const llmService = new LLMService();
```

### 2.4 Real-World Usage Examples

```typescript
// Example 1: Extract invoice data with structured output
const InvoiceSchema = z.object({
  invoiceNumber: z.string(),
  date: z.string(),
  vendor: z.string(),
  totalAmount: z.number(),
  lineItems: z.array(z.object({
    description: z.string(),
    quantity: z.number(),
    unitPrice: z.number(),
    amount: z.number(),
  })),
});

const invoice = await llmService.generateStructuredOutput(
  `Extract invoice data from this text: ${pdfText}`,
  InvoiceSchema,
  { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' }
);

// Example 2: Streaming response for chat interface
const stream = await llmService.streamCompletion(
  `Summarize this document: ${pdfText}`,
  { provider: 'openai', model: 'gpt-4o-mini' }
);

// Use with React (Vercel AI SDK UI hooks)
// In React component:
import { useChat } from 'ai/react';

const { messages, input, handleInputChange, handleSubmit } = useChat({
  api: '/api/chat',
});

// Example 3: Multi-step agent with tool calling
const result = await llmService.generateWithTools(
  'Process this invoice and update our accounting system',
  {
    extractInvoiceData: {
      description: 'Extract structured data from invoice',
      parameters: InvoiceSchema,
      execute: async (params) => {
        // Extract invoice data
        return extractedData;
      },
    },
    updateAccountingSystem: {
      description: 'Update accounting system with invoice data',
      parameters: z.object({ invoice: InvoiceSchema }),
      execute: async ({ invoice }) => {
        // Update accounting system
        await updateAccounting(invoice);
        return { success: true };
      },
    },
  },
  { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' }
);
```

### 2.5 Automatic Fallback with Vercel AI SDK

```typescript
// Fallback logic with multiple providers
async function generateWithFallback(prompt: string) {
  const providers = [
    { provider: 'openai', model: 'gpt-4o-mini' },
    { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' },
    { provider: 'google', model: 'gemini-1.5-flash' },
  ];

  for (const config of providers) {
    try {
      const result = await llmService.generateCompletion(prompt, config);
      return result;
    } catch (error) {
      console.error(`Provider ${config.provider} failed:`, error);
      // Continue to next provider
    }
  }

  throw new Error('All providers failed');
}
```

### 2.6 Cost Tracking (Add Custom Middleware)

```typescript
// Middleware for cost tracking
import { experimental_wrapLanguageModel as wrapLanguageModel } from 'ai';

function withCostTracking(model: any, providerId: string) {
  return wrapLanguageModel({
    model,
    middleware: {
      transformParams: async ({ params }) => params,
      wrapGenerate: async ({ doGenerate, params }) => {
        const startTime = Date.now();
        const result = await doGenerate();

        // Track usage
        await supabase.from('llm_usage').insert({
          provider: providerId,
          model: params.model,
          input_tokens: result.usage.promptTokens,
          output_tokens: result.usage.completionTokens,
          cost: calculateCost(providerId, result.usage),
          duration_ms: Date.now() - startTime,
        });

        return result;
      },
    },
  });
}

// Usage
const trackedModel = withCostTracking(
  openai('gpt-4o-mini'),
  'openai'
);
```

---

## 3. LiteLLM Integration (Optional - for Backend)

### 3.1 When to Use LiteLLM

**Use LiteLLM if you need:**
- ✅ Built-in cost tracking (no custom code)
- ✅ Load balancing across multiple providers/keys
- ✅ Python-based processing pipelines
- ✅ Proxy server (AI Gateway) for centralized management
- ✅ Advanced guardrails (content filtering, rate limiting)

### 3.2 LiteLLM Proxy Server Setup

```bash
# Install LiteLLM
pip install litellm[proxy]

# Create config file
cat > litellm_config.yaml <<EOF
model_list:
  # OpenAI Models
  - model_name: gpt-4o-mini
    litellm_params:
      model: openai/gpt-4o-mini
      api_key: os.environ/OPENAI_API_KEY

  # Anthropic Models
  - model_name: claude-sonnet
    litellm_params:
      model: anthropic/claude-3-5-sonnet-20241022
      api_key: os.environ/ANTHROPIC_API_KEY

  # Azure OpenAI
  - model_name: azure-gpt4
    litellm_params:
      model: azure/gpt-4o
      api_base: os.environ/AZURE_OPENAI_ENDPOINT
      api_key: os.environ/AZURE_OPENAI_KEY

  # Ollama (self-hosted)
  - model_name: llama3
    litellm_params:
      model: ollama/llama3
      api_base: http://localhost:11434

# Load balancing
router_settings:
  routing_strategy: least-busy
  num_retries: 3
  timeout: 600

# Cost tracking (built-in)
litellm_settings:
  success_callback: ["langfuse"]  # Track all requests
  failure_callback: ["langfuse"]
  set_verbose: true

# Guardrails
guardrails:
  - guardrail_name: "content-filter"
    litellm_params:
      mode: during_call
      guardrail: "azure-content-filter"
EOF

# Start proxy server
litellm --config litellm_config.yaml --port 4000
```

### 3.3 Using LiteLLM from Next.js

```typescript
// Call LiteLLM proxy (OpenAI-compatible)
import OpenAI from 'openai';

const litellmClient = new OpenAI({
  baseURL: 'http://localhost:4000', // LiteLLM proxy
  apiKey: 'anything', // Proxy handles auth
});

// Use like OpenAI
const response = await litellmClient.chat.completions.create({
  model: 'claude-sonnet', // Model name from config
  messages: [{ role: 'user', content: 'Hello!' }],
});

// Cost tracking is automatic via LiteLLM
```

### 3.4 LiteLLM Architecture

```
┌─────────────────────────────────────────┐
│         Next.js Application             │
└─────────────┬───────────────────────────┘
              │
              │ HTTP (OpenAI format)
              │
┌─────────────▼───────────────────────────┐
│         LiteLLM Proxy Server            │
│  (Load Balancing, Cost Tracking,        │
│   Guardrails, Retry Logic)              │
└─────────────┬───────────────────────────┘
              │
    ┌─────────┼─────────┐
    │         │         │
┌───▼───┐ ┌──▼───┐ ┌──▼────┐
│OpenAI │ │Claude│ │Azure  │
└───────┘ └──────┘ └───────┘
```

---

## 4. OCR Solutions: Multi-Layered Approach

### Recommendation: **DeepSeek-OCR** + **LLMWhisperer** + **AWS Textract**

Use different OCR solutions based on document type and requirements:

| Solution | Best For | Cost | Accuracy | Speed |
|----------|----------|------|----------|-------|
| **LLMWhisperer** | LLM preprocessing, layout preservation | Free (100pg/day) | ⭐⭐⭐⭐ | Fast |
| **DeepSeek-OCR** | High-volume, self-hosted, complex layouts | $0 (self-host) | ⭐⭐⭐⭐⭐ | Very Fast |
| **AWS Textract** | Forms, tables, enterprise reliability | Pay-per-use | ⭐⭐⭐⭐⭐ | Fast |
| **Tesseract** | Fallback, simple text | Free | ⭐⭐⭐ | Medium |

### 4.1 Implementation Strategy

```typescript
// src/lib/ocr/ocr-service.ts

interface OCRResult {
  text: string;
  layout?: string; // Markdown with layout
  confidence: number;
  method: 'llmwhisperer' | 'deepseek' | 'textract' | 'tesseract';
  processingTime: number;
}

export class OCRService {
  async extractText(pdfBuffer: Buffer, options?: {
    preserveLayout?: boolean;
    detectForms?: boolean;
    highAccuracy?: boolean;
  }): Promise<OCRResult> {
    // Decision tree based on requirements

    // 1. LLMWhisperer (default for LLM preprocessing)
    if (options?.preserveLayout) {
      return this.extractWithLLMWhisperer(pdfBuffer);
    }

    // 2. AWS Textract (for forms and tables)
    if (options?.detectForms) {
      return this.extractWithTextract(pdfBuffer);
    }

    // 3. DeepSeek-OCR (for high-volume, complex layouts)
    if (options?.highAccuracy && this.isDeepSeekAvailable()) {
      return this.extractWithDeepSeek(pdfBuffer);
    }

    // 4. Fallback to Tesseract
    return this.extractWithTesseract(pdfBuffer);
  }

  private async extractWithLLMWhisperer(pdfBuffer: Buffer): Promise<OCRResult> {
    // Upload to LLMWhisperer API
    const formData = new FormData();
    formData.append('file', new Blob([pdfBuffer]), 'document.pdf');
    formData.append('processing_mode', 'high_quality');
    formData.append('output_mode', 'layout_preserving');

    const response = await fetch('https://api.unstract.com/v1/llmwhisperer/extract', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.LLMWHISPERER_API_KEY}`,
      },
      body: formData,
    });

    const result = await response.json();

    return {
      text: result.extracted_text,
      layout: result.markdown, // Markdown with layout
      confidence: result.confidence || 0.95,
      method: 'llmwhisperer',
      processingTime: result.processing_time_ms,
    };
  }

  private async extractWithDeepSeek(pdfBuffer: Buffer): Promise<OCRResult> {
    // Convert PDF pages to images first
    const images = await this.pdfToImages(pdfBuffer);

    // Call DeepSeek-OCR API (self-hosted)
    const response = await fetch('http://localhost:8000/ocr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        images: images.map(img => img.toString('base64')),
        output_format: 'markdown',
        resolution_mode: '1024x1024',
      }),
    });

    const result = await response.json();

    return {
      text: result.text,
      layout: result.markdown,
      confidence: 0.97, // DeepSeek reports 97% accuracy at 10x compression
      method: 'deepseek',
      processingTime: result.processing_time_ms,
    };
  }

  private async extractWithTextract(pdfBuffer: Buffer): Promise<OCRResult> {
    // AWS Textract (existing implementation)
    const textract = new TextractClient({ region: 'us-east-1' });

    const command = new DetectDocumentTextCommand({
      Document: { Bytes: pdfBuffer },
    });

    const response = await textract.send(command);

    const text = response.Blocks
      ?.filter(block => block.BlockType === 'LINE')
      .map(block => block.Text)
      .join('\n') || '';

    return {
      text,
      confidence: 0.95,
      method: 'textract',
      processingTime: 0, // Not tracked by Textract
    };
  }

  private async extractWithTesseract(pdfBuffer: Buffer): Promise<OCRResult> {
    // Tesseract fallback (existing implementation)
    const images = await this.pdfToImages(pdfBuffer);
    const text = await tesseract.recognize(images[0]);

    return {
      text,
      confidence: 0.80,
      method: 'tesseract',
      processingTime: 0,
    };
  }

  private isDeepSeekAvailable(): boolean {
    // Check if DeepSeek-OCR service is running
    return !!process.env.DEEPSEEK_OCR_ENDPOINT;
  }
}

export const ocrService = new OCRService();
```

### 4.2 LLMWhisperer Integration

```typescript
// src/lib/ocr/llmwhisperer.ts

export class LLMWhispererClient {
  private apiKey: string;
  private baseUrl = 'https://api.unstract.com/v1/llmwhisperer';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async extractText(pdfBuffer: Buffer, options?: {
    mode?: 'native_text' | 'low_cost' | 'high_quality' | 'form';
    preserveLayout?: boolean;
  }): Promise<{
    text: string;
    markdown: string;
    confidence: number;
    pageCount: number;
  }> {
    const formData = new FormData();
    formData.append('file', new Blob([pdfBuffer]), 'document.pdf');
    formData.append('processing_mode', options?.mode || 'high_quality');
    formData.append('output_mode', options?.preserveLayout ? 'layout_preserving' : 'text');

    const response = await fetch(`${this.baseUrl}/extract`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`LLMWhisperer API error: ${response.statusText}`);
    }

    const result = await response.json();

    return {
      text: result.extracted_text,
      markdown: result.markdown || result.extracted_text,
      confidence: result.confidence || 0.95,
      pageCount: result.page_count,
    };
  }

  // Check quota (100 free pages/day)
  async getQuota(): Promise<{
    used: number;
    limit: number;
    remaining: number;
  }> {
    const response = await fetch(`${this.baseUrl}/quota`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    return response.json();
  }
}
```

### 4.3 DeepSeek-OCR Setup (Self-Hosted)

```bash
# Clone DeepSeek-OCR repository
git clone https://github.com/deepseek-ai/DeepSeek-OCR.git
cd DeepSeek-OCR

# Install dependencies
pip install -r requirements.txt

# Download model weights
python scripts/download_weights.py

# Start API server (requires NVIDIA GPU)
python serve.py --port 8000 --model deepseek-ocr-vlm2 --device cuda

# Docker deployment (recommended for production)
docker build -t deepseek-ocr .
docker run -d --gpus all -p 8000:8000 deepseek-ocr
```

**Hardware Requirements:**
- **Minimum:** NVIDIA A100-40G (for production speed)
- **Budget:** RTX 4090 (slower but works)
- **Performance:** 2500 tokens/s on A100, 200K+ pages/day

### 4.4 OCR Decision Matrix

```typescript
// Automatic OCR method selection
function selectOCRMethod(document: {
  size: number;
  hasText: boolean;
  hasForms: boolean;
  complexity: 'simple' | 'medium' | 'complex';
}): 'llmwhisperer' | 'deepseek' | 'textract' | 'tesseract' {
  // 1. Native text PDFs - skip OCR
  if (document.hasText) {
    return null; // Use PDF.js text extraction
  }

  // 2. Forms and tables - use Textract
  if (document.hasForms) {
    return 'textract';
  }

  // 3. Complex layouts, formulas - use DeepSeek if available
  if (document.complexity === 'complex' && isDeepSeekAvailable()) {
    return 'deepseek';
  }

  // 4. LLM preprocessing (default)
  if (quota.llmwhisperer.remaining > 0) {
    return 'llmwhisperer';
  }

  // 5. Fallback to Tesseract
  return 'tesseract';
}
```

---

## 5. Updated Database Schema

```sql
-- LLM Provider Configurations
ALTER TABLE llm_configurations ADD COLUMN IF NOT EXISTS sdk VARCHAR(50) DEFAULT 'vercel-ai';
-- Values: 'vercel-ai', 'litellm', 'custom'

-- OCR Method Tracking
CREATE TABLE ocr_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pdf_id UUID REFERENCES pdfs(id),

  method VARCHAR(50) NOT NULL,  -- 'llmwhisperer', 'deepseek', 'textract', 'tesseract'
  confidence NUMERIC(5,4),
  processing_time_ms INTEGER,
  page_count INTEGER,

  cost NUMERIC(10,6) DEFAULT 0,  -- USD

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ocr_usage_method ON ocr_usage(method);
CREATE INDEX idx_ocr_usage_created_at ON ocr_usage(created_at DESC);
```

---

## 6. Cost Comparison

### LLM Costs (per 1M tokens)

| Provider | Model | Input | Output | Via |
|----------|-------|-------|--------|-----|
| OpenAI | GPT-4o | $2.50 | $10.00 | Direct / Vercel AI / LiteLLM |
| OpenAI | GPT-4o-mini | $0.15 | $0.60 | Direct / Vercel AI / LiteLLM |
| Anthropic | Claude 3.5 Sonnet | $3.00 | $15.00 | Direct / Vercel AI / LiteLLM |
| Anthropic | Claude 3 Haiku | $0.25 | $1.25 | Direct / Vercel AI / LiteLLM |
| Google | Gemini 1.5 Flash | $0.075 | $0.30 | Vercel AI / LiteLLM |
| Ollama | Llama 3 (self-hosted) | $0 | $0 | Vercel AI / LiteLLM |

**SDK Overhead:** None (Vercel AI SDK and LiteLLM don't add costs)

### OCR Costs

| Method | Cost | Accuracy | Speed | Best For |
|--------|------|----------|-------|----------|
| **LLMWhisperer** | Free (100pg/day), then $0.01/page | 95% | Fast | LLM preprocessing |
| **DeepSeek-OCR** | $0 (self-hosted) + GPU (~$3/hr A100) | 97% | Very Fast | High-volume |
| **AWS Textract** | $0.0015/page | 95% | Fast | Forms, enterprise |
| **Tesseract** | $0 | 80% | Medium | Fallback |

**Cost Optimization:**
- Use LLMWhisperer free tier (100 pages/day)
- Deploy DeepSeek-OCR on own GPU for high-volume
- Reserve AWS Textract for forms/tables only
- **Estimated savings:** 60-80% vs AWS Textract only

---

## 7. Updated Implementation Timeline

### Phase 1: Multi-LLM with Vercel AI SDK (Week 1-2)
- ✅ Install Vercel AI SDK
- ✅ Refactor existing OpenAI code to use Vercel AI SDK
- ✅ Add Anthropic Claude support
- ✅ Add Google Gemini support
- ✅ Add Ollama support (self-hosted)
- ✅ Implement cost tracking middleware
- ✅ UI for provider selection

**Effort:** 2 weeks, 2 engineers
**Cost:** $50K

### Phase 2: OCR Multi-Method (Week 3-4)
- ✅ Integrate LLMWhisperer API
- ✅ Deploy DeepSeek-OCR (Docker on GPU)
- ✅ Implement OCR decision logic
- ✅ Add OCR method tracking
- ✅ Performance benchmarking

**Effort:** 2 weeks, 2 engineers
**Cost:** $50K

### Phase 3: Optional LiteLLM Backend (Week 5)
- ✅ Deploy LiteLLM proxy server
- ✅ Configure load balancing
- ✅ Set up cost tracking (Langfuse)
- ✅ Implement guardrails

**Effort:** 1 week, 1 engineer (optional)
**Cost:** $25K

**Total:** 4-5 weeks, $100-125K (vs $150K previous)

---

## 8. Recommended Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Next.js Application (Frontend)             │
│                                                         │
│  ┌──────────────────────┐    ┌─────────────────────┐  │
│  │   Vercel AI SDK      │    │   React UI Hooks    │  │
│  │  (Multi-provider)    │◄───│   (useChat, etc.)   │  │
│  └──────────┬───────────┘    └─────────────────────┘  │
└─────────────┼───────────────────────────────────────────┘
              │
    ┌─────────┼─────────┐
    │         │         │
┌───▼──┐  ┌──▼───┐  ┌──▼────┐
│OpenAI│  │Claude│  │Gemini │
└──────┘  └──────┘  └───────┘


┌─────────────────────────────────────────────────────────┐
│           Next.js Application (Backend API)             │
│                                                         │
│  ┌──────────────────────┐    ┌─────────────────────┐  │
│  │    OCR Service       │    │   PDF Processing    │  │
│  │  (Multi-method)      │◄───│    Pipeline         │  │
│  └──────────┬───────────┘    └─────────────────────┘  │
└─────────────┼───────────────────────────────────────────┘
              │
    ┌─────────┼─────────┬──────────┐
    │         │         │          │
┌───▼────────┐│     ┌──▼───────┐ ┌▼─────────┐
│LLMWhisperer││     │DeepSeek  │ │Textract  │
│(API)       ││     │(Self-host│ │(AWS)     │
└────────────┘│     └──────────┘ └──────────┘
              │
         ┌────▼────────┐
         │  Tesseract  │
         │  (Fallback) │
         └─────────────┘


Optional: LiteLLM Proxy (for advanced features)
┌─────────────────────────────────────────────────────────┐
│              LiteLLM Proxy Server                       │
│  (Load Balancing, Cost Tracking, Guardrails)           │
└─────────────┬───────────────────────────────────────────┘
    ┌─────────┼─────────┬──────────┐
    │         │         │          │
┌───▼──┐  ┌──▼───┐  ┌──▼────┐  ┌──▼───┐
│OpenAI│  │Claude│  │Azure  │  │Ollama│
└──────┘  └──────┘  └───────┘  └──────┘
```

---

## 9. Migration Path from Current Implementation

### Step 1: Add Vercel AI SDK (Week 1)
```bash
npm install ai @ai-sdk/openai @ai-sdk/anthropic
```

### Step 2: Refactor Existing OpenAI Code (Week 1)
```typescript
// Before (direct OpenAI)
const openai = new OpenAI({ apiKey });
const response = await openai.chat.completions.create({...});

// After (Vercel AI SDK)
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

const { text } = await generateText({
  model: openai('gpt-4o-mini'),
  prompt: '...',
});
```

### Step 3: Add New Providers (Week 1-2)
```typescript
// Add Claude
import { anthropic } from '@ai-sdk/anthropic';
const claude = anthropic('claude-3-5-sonnet-20241022');

// Add Gemini
import { google } from '@ai-sdk/google';
const gemini = google('gemini-1.5-flash');
```

### Step 4: Integrate LLMWhisperer (Week 3)
```typescript
// Add to OCR pipeline
const llmwhisperer = new LLMWhispererClient(process.env.LLMWHISPERER_API_KEY);
const result = await llmwhisperer.extractText(pdfBuffer, {
  mode: 'high_quality',
  preserveLayout: true,
});
```

### Step 5: Deploy DeepSeek-OCR (Week 4, if high-volume)
```bash
docker run -d --gpus all -p 8000:8000 deepseek-ocr
```

---

## 10. Conclusion & Next Steps

### Key Takeaways

1. **Vercel AI SDK** is the better choice for Slicely (TypeScript/Next.js)
   - Better maintained (Vercel backing)
   - Native streaming & tool calling
   - Perfect fit for existing stack
   - Model Context Protocol support

2. **LiteLLM** is complementary (optional)
   - Use for Python pipelines or advanced features
   - Built-in cost tracking & load balancing
   - Can run as separate proxy server

3. **Multi-method OCR** approach is more robust
   - LLMWhisperer for layout preservation (free tier)
   - DeepSeek-OCR for high-volume self-hosted
   - AWS Textract for forms/tables
   - 60-80% cost savings vs Textract-only

### Immediate Actions

1. ✅ **Install Vercel AI SDK** and refactor OpenAI code
2. ✅ **Sign up for LLMWhisperer** (free 100 pages/day)
3. ✅ **Test DeepSeek-OCR** on sample documents
4. ✅ **Update implementation plans** with these tools
5. ✅ **Begin migration** (estimated 4-5 weeks)

### Expected Benefits

- **Better Developer Experience:** Unified API across all providers
- **Lower Costs:** 60-80% OCR savings, flexible LLM pricing
- **Higher Accuracy:** DeepSeek-OCR (97%) + LLMWhisperer layout preservation
- **Future-Proof:** Easy to add new providers/models as they emerge
- **Production-Ready:** Battle-tested tools (20K+ stars, Y Combinator backed)

---

**Document Owner:** Engineering Team
**Last Updated:** November 5, 2025
**Status:** RECOMMENDED FOR ADOPTION
**Supersedes:** Previous multi-LLM and OCR implementation plans
