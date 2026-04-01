# Implementation Plan: RESTful & GraphQL API Layer

**Priority:** 🔴 CRITICAL
**Impact:** 95/100
**Effort:** Medium (4-6 weeks)
**Owner:** Backend Engineering
**Dependencies:** None

---

## 1. Overview

### Objective
Build a production-ready RESTful and GraphQL API layer to enable programmatic access to Slicely's core functionality, unlocking ecosystem integrations and enterprise adoption.

### Success Criteria
- ✅ RESTful API with full CRUD operations for all resources
- ✅ GraphQL endpoint for complex queries
- ✅ API authentication with rate limiting
- ✅ Comprehensive API documentation (Swagger/OpenAPI)
- ✅ API versioning strategy (v1 → v2)
- ✅ Client SDKs for Python and JavaScript
- ✅ 99.9% uptime, <200ms p95 response time

### Business Impact
- **Unlocks:** Ecosystem integrations, automation, CI/CD pipelines
- **Enables:** $50K+ ACV enterprise deals
- **Required by:** 90%+ of enterprise customers

---

## 2. Technical Architecture

### 2.1 Technology Stack

```typescript
// Core API Framework
- Next.js 14 API Routes (existing)
- tRPC v11 (type-safe APIs, replaces traditional REST)
  OR
- Hono.js (lightweight, fast, good for standalone API server)

// GraphQL
- Pothos GraphQL (code-first, type-safe)
- GraphQL Yoga (GraphQL server)

// Validation & Types
- Zod (request/response validation, shared with tRPC)
- TypeScript (end-to-end type safety)

// Authentication
- API Key authentication (primary)
- JWT tokens (for user sessions)
- Supabase Auth (existing, backend validation)

// Rate Limiting
- Upstash Rate Limit (Redis-based, edge-compatible)
- OR @unkey/ratelimit (dedicated API key management)

// Documentation
- Swagger/OpenAPI 3.0
- Scalar or Stoplight Elements (beautiful API docs)

// SDK Generation
- openapi-typescript-codegen (TypeScript/JavaScript SDK)
- openapi-python-client (Python SDK)
```

### 2.2 Architecture Decision: tRPC vs REST

**Recommendation: Hybrid Approach**

```
┌─────────────────────────────────────────────────────────┐
│                    API Gateway Layer                    │
│                 (Rate Limiting, Auth)                   │
└─────────────────────┬───────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
  ┌─────▼────┐  ┌────▼─────┐  ┌───▼────┐
  │   tRPC   │  │   REST   │  │GraphQL │
  │ (Internal)│  │(External)│  │(Complex)│
  └──────────┘  └──────────┘  └────────┘
        │             │             │
        └─────────────┼─────────────┘
                      │
        ┌─────────────▼─────────────┐
        │    Business Logic Layer    │
        │  (Shared Services)        │
        └─────────────┬─────────────┘
                      │
        ┌─────────────▼─────────────┐
        │     Data Access Layer      │
        │    (Supabase Client)       │
        └────────────────────────────┘
```

**Rationale:**
- **tRPC:** Keep for internal Next.js app (type-safe, fast)
- **REST:** Add for external API consumers (standard, language-agnostic)
- **GraphQL:** Add for complex queries (flexible, efficient)

### 2.3 API Structure

```
/api
  /v1                          # Version 1 (stable)
    /rest                      # RESTful endpoints
      /pdfs
      /slicers
      /outputs
      /search
      /webhooks
    /graphql                   # GraphQL endpoint
    /docs                      # API documentation
  /v2                          # Future version (breaking changes)

/internal                      # Internal tRPC routes (existing)
```

---

## 3. Detailed Implementation

### 3.1 Database Changes

```sql
-- API Keys Table
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE, -- future

  name VARCHAR(255) NOT NULL,           -- "Production API Key"
  key_prefix VARCHAR(8) NOT NULL,       -- "sk_live_" or "sk_test_"
  key_hash TEXT NOT NULL,               -- bcrypt hash of full key

  scopes TEXT[] DEFAULT ARRAY['read'], -- ['read', 'write', 'admin']

  rate_limit_tier VARCHAR(50) DEFAULT 'standard', -- 'standard', 'premium', 'enterprise'
  requests_per_minute INTEGER DEFAULT 60,
  requests_per_day INTEGER DEFAULT 10000,

  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
CREATE UNIQUE INDEX idx_api_keys_key_prefix ON api_keys(key_prefix);

-- API Request Logs (for rate limiting and analytics)
CREATE TABLE api_request_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  method VARCHAR(10) NOT NULL,          -- GET, POST, PUT, DELETE
  path TEXT NOT NULL,                   -- /api/v1/pdfs/123
  status_code INTEGER NOT NULL,         -- 200, 404, 500

  response_time_ms INTEGER,             -- milliseconds
  request_size_bytes INTEGER,
  response_size_bytes INTEGER,

  ip_address INET,
  user_agent TEXT,

  error_message TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partition by month for performance
CREATE INDEX idx_api_request_logs_created_at ON api_request_logs(created_at);
CREATE INDEX idx_api_request_logs_api_key_id ON api_request_logs(api_key_id);
CREATE INDEX idx_api_request_logs_user_id ON api_request_logs(user_id);

-- Webhooks Table (already exists, enhance)
ALTER TABLE slicers ADD COLUMN IF NOT EXISTS webhook_events TEXT[] DEFAULT ARRAY['processing.completed'];
-- Events: 'processing.started', 'processing.completed', 'processing.failed', 'output.created'

CREATE TABLE webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slicer_id UUID REFERENCES slicers(id) ON DELETE CASCADE,
  webhook_url TEXT NOT NULL,

  event_type VARCHAR(100) NOT NULL,     -- 'processing.completed'
  payload JSONB NOT NULL,

  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'delivered', 'failed'
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,

  last_attempt_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ,

  response_status_code INTEGER,
  response_body TEXT,
  error_message TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ
);

CREATE INDEX idx_webhook_deliveries_status ON webhook_deliveries(status);
CREATE INDEX idx_webhook_deliveries_next_retry ON webhook_deliveries(next_retry_at) WHERE status = 'pending';
```

### 3.2 REST API Endpoints

#### A. PDF Management

```typescript
// POST /api/v1/pdfs - Upload PDF
interface UploadPDFRequest {
  file: File;                    // multipart/form-data
  is_template?: boolean;
  metadata?: Record<string, any>;
}

interface UploadPDFResponse {
  id: string;
  file_name: string;
  file_size: number;
  page_count: number;
  file_processing_status: 'pending';
  created_at: string;
}

// GET /api/v1/pdfs - List PDFs
interface ListPDFsRequest {
  page?: number;                 // default: 1
  limit?: number;                // default: 50, max: 100
  sort?: 'created_at' | 'updated_at' | 'file_name';
  order?: 'asc' | 'desc';
  is_template?: boolean;
  status?: 'pending' | 'processing' | 'processed';
}

interface ListPDFsResponse {
  pdfs: PDF[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// GET /api/v1/pdfs/:id - Get PDF details
interface GetPDFResponse {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  page_count: number;
  file_processing_status: string;
  is_template: boolean;
  metadata: Record<string, any>;
  linked_slicers: {
    id: string;
    name: string;
    processed_at?: string;
  }[];
  created_at: string;
  updated_at: string;
}

// DELETE /api/v1/pdfs/:id - Delete PDF
interface DeletePDFResponse {
  id: string;
  deleted: boolean;
}

// GET /api/v1/pdfs/:id/download - Download PDF file
// Returns PDF file stream
```

#### B. Slicer Management

```typescript
// POST /api/v1/slicers - Create Slicer
interface CreateSlicerRequest {
  name: string;
  description?: string;
  processing_rules?: ProcessingRules;
  llm_prompts?: LLMPrompt[];
  pdf_prompts?: Record<string, LLMPrompt[]>;
  output_mode?: string;
  webhook_url?: string;
  webhook_events?: string[];
}

interface CreateSlicerResponse {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

// GET /api/v1/slicers - List Slicers
// PUT /api/v1/slicers/:id - Update Slicer
// DELETE /api/v1/slicers/:id - Delete Slicer
// GET /api/v1/slicers/:id - Get Slicer details

// POST /api/v1/slicers/:id/pdfs - Link PDF to Slicer
interface LinkPDFRequest {
  pdf_id: string;
}

// POST /api/v1/slicers/:id/process - Process Slicer
interface ProcessSlicerRequest {
  pdf_ids?: string[];            // specific PDFs, or all if omitted
  priority?: number;             // 1-10, default: 5
  webhook_url?: string;          // override default webhook
}

interface ProcessSlicerResponse {
  job_id: string;
  slicer_id: string;
  pdf_count: number;
  estimated_completion: string;  // ISO 8601 timestamp
  status_url: string;            // GET /api/v1/jobs/:job_id
}
```

#### C. Outputs & Search

```typescript
// GET /api/v1/slicers/:id/outputs - Get Slicer Outputs
interface GetSlicerOutputsRequest {
  page?: number;
  limit?: number;
  pdf_id?: string;               // filter by PDF
  page_number?: number;          // filter by page
}

interface GetSlicerOutputsResponse {
  outputs: {
    id: string;
    pdf_id: string;
    pdf_name: string;
    page_number: number;
    text_content: string;
    section_info: object;
    created_at: string;
  }[];
  pagination: Pagination;
}

// GET /api/v1/slicers/:id/llm-outputs - Get LLM Outputs
interface GetLLMOutputsResponse {
  llm_outputs: {
    id: string;
    prompt: string;
    output: {
      type: 'single_value' | 'chart' | 'table' | 'text';
      data: any;
      confidence?: number;
    };
    created_at: string;
  }[];
}

// POST /api/v1/search - Search across all documents
interface SearchRequest {
  query: string;
  slicer_ids?: string[];         // filter by slicers
  pdf_ids?: string[];            // filter by PDFs
  search_type?: 'keyword' | 'semantic' | 'hybrid';
  limit?: number;
  threshold?: number;            // for semantic search, 0-1
}

interface SearchResponse {
  results: {
    id: string;
    slicer_id: string;
    slicer_name: string;
    pdf_id: string;
    pdf_name: string;
    page_number: number;
    text_content: string;
    similarity_score?: number;   // for semantic search
    highlights?: string[];       // matched snippets
  }[];
  took_ms: number;               // query time
}

// GET /api/v1/search/suggest - Autocomplete suggestions
interface SuggestRequest {
  query: string;
  limit?: number;                // default: 10
}

interface SuggestResponse {
  suggestions: string[];
}
```

#### D. Webhooks

```typescript
// POST /api/v1/webhooks - Register Webhook
interface RegisterWebhookRequest {
  url: string;
  events: string[];              // ['processing.completed', 'processing.failed']
  slicer_ids?: string[];         // specific slicers, or all if omitted
  secret?: string;               // for signature verification
}

interface RegisterWebhookResponse {
  id: string;
  url: string;
  events: string[];
  created_at: string;
}

// GET /api/v1/webhooks - List Webhooks
// DELETE /api/v1/webhooks/:id - Delete Webhook

// Webhook Payload Format
interface WebhookPayload {
  event: string;                 // 'processing.completed'
  timestamp: string;             // ISO 8601
  data: {
    slicer_id: string;
    slicer_name: string;
    pdf_id: string;
    pdf_name: string;
    status: 'completed' | 'failed';
    outputs_count?: number;
    error?: string;
  };
  signature: string;             // HMAC-SHA256(secret, payload)
}
```

#### E. Jobs & Status

```typescript
// GET /api/v1/jobs/:id - Get Job Status
interface GetJobResponse {
  id: string;
  type: 'pdf_processing';
  slicer_id: string;
  pdf_ids: string[];
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;              // 0-100
  total: number;
  completed: number;
  failed: number;
  error?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

// GET /api/v1/jobs - List Jobs
// POST /api/v1/jobs/:id/cancel - Cancel Job
```

### 3.3 GraphQL Schema

```graphql
# Schema Definition
type Query {
  # PDFs
  pdf(id: ID!): PDF
  pdfs(filter: PDFFilter, pagination: PaginationInput): PDFConnection!

  # Slicers
  slicer(id: ID!): Slicer
  slicers(filter: SlicerFilter, pagination: PaginationInput): SlicerConnection!

  # Search
  search(query: String!, filter: SearchFilter, limit: Int): [SearchResult!]!

  # Jobs
  job(id: ID!): Job
  jobs(filter: JobFilter, pagination: PaginationInput): JobConnection!
}

type Mutation {
  # PDFs
  uploadPDF(input: UploadPDFInput!): UploadPDFPayload!
  deletePDF(id: ID!): DeletePDFPayload!

  # Slicers
  createSlicer(input: CreateSlicerInput!): CreateSlicerPayload!
  updateSlicer(id: ID!, input: UpdateSlicerInput!): UpdateSlicerPayload!
  deleteSlicer(id: ID!): DeleteSlicerPayload!

  # Processing
  processSlicer(id: ID!, input: ProcessSlicerInput!): ProcessSlicerPayload!

  # Webhooks
  registerWebhook(input: RegisterWebhookInput!): RegisterWebhookPayload!
  deleteWebhook(id: ID!): DeleteWebhookPayload!
}

# Types
type PDF {
  id: ID!
  fileName: String!
  filePath: String!
  fileSize: Int!
  pageCount: Int
  fileProcessingStatus: ProcessingStatus!
  isTemplate: Boolean!
  metadata: JSON
  linkedSlicers: [Slicer!]!
  outputs(filter: OutputFilter, pagination: PaginationInput): OutputConnection!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Slicer {
  id: ID!
  name: String!
  description: String
  processingRules: JSON
  llmPrompts: [LLMPrompt!]!
  webhookUrl: String
  linkedPDFs(pagination: PaginationInput): PDFConnection!
  outputs(filter: OutputFilter, pagination: PaginationInput): OutputConnection!
  llmOutputs(pagination: PaginationInput): [LLMOutput!]!
  createdAt: DateTime!
  updatedAt: DateTime!
  lastProcessedAt: DateTime
}

type Output {
  id: ID!
  pdf: PDF!
  slicer: Slicer!
  pageNumber: Int!
  textContent: String!
  sectionInfo: JSON
  embedding: [Float!]  # vector embedding
  createdAt: DateTime!
}

type LLMOutput {
  id: ID!
  pdf: PDF
  slicer: Slicer!
  prompt: String!
  output: JSON!
  createdAt: DateTime!
}

type SearchResult {
  id: ID!
  slicer: Slicer!
  pdf: PDF!
  pageNumber: Int!
  textContent: String!
  similarityScore: Float
  highlights: [String!]
}

type Job {
  id: ID!
  type: JobType!
  slicer: Slicer!
  pdfs: [PDF!]!
  status: JobStatus!
  progress: Int!
  total: Int!
  completed: Int!
  failed: Int!
  error: String
  createdAt: DateTime!
  startedAt: DateTime
  completedAt: DateTime
}

# Enums
enum ProcessingStatus {
  PENDING
  PROCESSING
  PROCESSED
  FAILED
}

enum JobType {
  PDF_PROCESSING
  BATCH_PROCESSING
}

enum JobStatus {
  QUEUED
  PROCESSING
  COMPLETED
  FAILED
  CANCELLED
}

# Inputs
input PDFFilter {
  isTemplate: Boolean
  status: ProcessingStatus
  slicerId: ID
}

input SlicerFilter {
  name: String
}

input SearchFilter {
  slicerIds: [ID!]
  pdfIds: [ID!]
  searchType: SearchType
  threshold: Float
}

enum SearchType {
  KEYWORD
  SEMANTIC
  HYBRID
}

input PaginationInput {
  page: Int
  limit: Int
}

# Connections (Relay-style pagination)
type PDFConnection {
  edges: [PDFEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type PDFEdge {
  node: PDF!
  cursor: String!
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}

# Scalars
scalar DateTime
scalar JSON
```

### 3.4 Authentication & Authorization

```typescript
// API Key Middleware
import { createHash } from 'crypto';

export async function authenticateAPIKey(request: Request): Promise<User | null> {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    throw new APIError('Missing or invalid Authorization header', 401);
  }

  const apiKey = authHeader.replace('Bearer ', '');

  // Validate API key format: sk_live_xxxxx or sk_test_xxxxx
  if (!apiKey.startsWith('sk_live_') && !apiKey.startsWith('sk_test_')) {
    throw new APIError('Invalid API key format', 401);
  }

  // Extract prefix (first 8 chars)
  const keyPrefix = apiKey.substring(0, 8);

  // Hash the full key
  const keyHash = await hashAPIKey(apiKey);

  // Look up API key in database
  const apiKeyRecord = await supabase
    .from('api_keys')
    .select('*, user:users(*)')
    .eq('key_hash', keyHash)
    .eq('is_active', true)
    .single();

  if (!apiKeyRecord) {
    throw new APIError('Invalid API key', 401);
  }

  // Check expiration
  if (apiKeyRecord.expires_at && new Date(apiKeyRecord.expires_at) < new Date()) {
    throw new APIError('API key expired', 401);
  }

  // Update last_used_at (async, don't await)
  supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', apiKeyRecord.id)
    .then();

  return apiKeyRecord.user;
}

// Generate API Key
export async function generateAPIKey(userId: string, name: string, environment: 'live' | 'test'): Promise<string> {
  // Generate random key: sk_live_32_random_chars
  const prefix = environment === 'live' ? 'sk_live_' : 'sk_test_';
  const randomPart = crypto.randomBytes(16).toString('hex'); // 32 chars
  const apiKey = `${prefix}${randomPart}`;

  // Hash for storage
  const keyHash = await hashAPIKey(apiKey);

  // Store in database
  await supabase.from('api_keys').insert({
    user_id: userId,
    name,
    key_prefix: prefix,
    key_hash: keyHash,
    scopes: ['read', 'write'],
    expires_at: null, // no expiration by default
  });

  // Return the unhashed key (only time user sees it)
  return apiKey;
}

async function hashAPIKey(key: string): Promise<string> {
  // Use SHA-256 for fast hashing (bcrypt too slow for high-volume API)
  return createHash('sha256').update(key).digest('hex');
}
```

### 3.5 Rate Limiting

```typescript
// Rate Limiting Middleware
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Define rate limit tiers
const rateLimiters = {
  standard: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, '1 m'), // 60 requests per minute
    analytics: true,
    prefix: 'ratelimit:standard',
  }),

  premium: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(300, '1 m'), // 300 requests per minute
    analytics: true,
    prefix: 'ratelimit:premium',
  }),

  enterprise: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(1000, '1 m'), // 1000 requests per minute
    analytics: true,
    prefix: 'ratelimit:enterprise',
  }),
};

export async function checkRateLimit(apiKeyId: string, tier: string): Promise<void> {
  const limiter = rateLimiters[tier] || rateLimiters.standard;

  const { success, limit, reset, remaining } = await limiter.limit(apiKeyId);

  if (!success) {
    throw new APIError('Rate limit exceeded', 429, {
      'X-RateLimit-Limit': limit.toString(),
      'X-RateLimit-Remaining': '0',
      'X-RateLimit-Reset': reset.toString(),
      'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
    });
  }

  // Set rate limit headers (return these in response)
  return {
    'X-RateLimit-Limit': limit.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': reset.toString(),
  };
}
```

### 3.6 API Versioning Strategy

```typescript
// Versioning approach: URL-based (/api/v1, /api/v2)

// Version detection middleware
export function getAPIVersion(request: Request): number {
  const url = new URL(request.url);
  const match = url.pathname.match(/^\/api\/v(\d+)\//);

  if (!match) {
    throw new APIError('API version not specified', 400);
  }

  const version = parseInt(match[1]);

  // Check if version is supported
  const supportedVersions = [1]; // v1 only for now

  if (!supportedVersions.includes(version)) {
    throw new APIError(`API version v${version} is not supported`, 400);
  }

  return version;
}

// Deprecation warnings (for v1 when v2 is released)
export function addDeprecationWarnings(response: Response, version: number): Response {
  if (version === 1) {
    response.headers.set('Deprecation', 'true');
    response.headers.set('Sunset', '2026-12-31T23:59:59Z'); // v1 sunset date
    response.headers.set('Link', '</api/v2>; rel="successor-version"');
  }

  return response;
}
```

### 3.7 Error Handling

```typescript
// Standardized error responses
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public headers: Record<string, string> = {},
    public code?: string,
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Error response format (RFC 7807 - Problem Details)
interface ErrorResponse {
  type: string;           // URI identifying the problem type
  title: string;          // Short, human-readable summary
  status: number;         // HTTP status code
  detail: string;         // Human-readable explanation
  instance: string;       // URI reference that identifies the specific occurrence
  errors?: Array<{        // Validation errors
    field: string;
    message: string;
  }>;
  request_id: string;     // For debugging
}

// Example error responses:
// 400 Bad Request
{
  "type": "https://docs.slicely.com/errors/validation-error",
  "title": "Validation Error",
  "status": 400,
  "detail": "Request validation failed",
  "instance": "/api/v1/pdfs",
  "errors": [
    {
      "field": "file",
      "message": "File is required"
    }
  ],
  "request_id": "req_1234567890"
}

// 401 Unauthorized
{
  "type": "https://docs.slicely.com/errors/unauthorized",
  "title": "Unauthorized",
  "status": 401,
  "detail": "Invalid API key",
  "instance": "/api/v1/slicers",
  "request_id": "req_1234567890"
}

// 429 Rate Limit Exceeded
{
  "type": "https://docs.slicely.com/errors/rate-limit-exceeded",
  "title": "Rate Limit Exceeded",
  "status": 429,
  "detail": "You have exceeded your rate limit of 60 requests per minute",
  "instance": "/api/v1/search",
  "request_id": "req_1234567890"
}

// 500 Internal Server Error
{
  "type": "https://docs.slicely.com/errors/internal-error",
  "title": "Internal Server Error",
  "status": 500,
  "detail": "An unexpected error occurred",
  "instance": "/api/v1/slicers/123/process",
  "request_id": "req_1234567890"
}

// Global error handler
export function handleAPIError(error: unknown, request: Request): Response {
  const requestId = request.headers.get('X-Request-ID') || generateRequestId();

  // Log error (send to Sentry)
  console.error('API Error:', { error, requestId, path: request.url });

  if (error instanceof APIError) {
    return new Response(
      JSON.stringify({
        type: `https://docs.slicely.com/errors/${error.code || 'api-error'}`,
        title: error.message,
        status: error.statusCode,
        detail: error.message,
        instance: new URL(request.url).pathname,
        request_id: requestId,
      } as ErrorResponse),
      {
        status: error.statusCode,
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': requestId,
          ...error.headers,
        },
      }
    );
  }

  // Unknown error - return 500
  return new Response(
    JSON.stringify({
      type: 'https://docs.slicely.com/errors/internal-error',
      title: 'Internal Server Error',
      status: 500,
      detail: 'An unexpected error occurred',
      instance: new URL(request.url).pathname,
      request_id: requestId,
    } as ErrorResponse),
    {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
      },
    }
  );
}
```

---

## 4. API Documentation

### 4.1 OpenAPI/Swagger Spec

```yaml
openapi: 3.0.0
info:
  title: Slicely API
  description: |
    The Slicely API allows you to programmatically upload PDFs, create slicers,
    process documents, and search extracted data.

    ## Authentication
    All API requests require authentication using an API key. Include your API key
    in the Authorization header:

    ```
    Authorization: Bearer sk_live_your_api_key_here
    ```

    ## Rate Limiting
    API requests are rate limited based on your plan:
    - Standard: 60 requests/minute
    - Premium: 300 requests/minute
    - Enterprise: 1000 requests/minute

    ## Webhooks
    Configure webhooks to receive real-time notifications when processing completes.

  version: 1.0.0
  contact:
    name: API Support
    email: api@slicely.com
    url: https://docs.slicely.com

servers:
  - url: https://api.slicely.com/v1
    description: Production server
  - url: https://staging-api.slicely.com/v1
    description: Staging server

security:
  - ApiKeyAuth: []

paths:
  /pdfs:
    get:
      summary: List PDFs
      description: Retrieve a paginated list of all PDFs
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 1
        - name: limit
          in: query
          schema:
            type: integer
            default: 50
            maximum: 100
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                type: object
                properties:
                  pdfs:
                    type: array
                    items:
                      $ref: '#/components/schemas/PDF'
                  pagination:
                    $ref: '#/components/schemas/Pagination'

    post:
      summary: Upload PDF
      description: Upload a new PDF document
      requestBody:
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              properties:
                file:
                  type: string
                  format: binary
                is_template:
                  type: boolean
              required:
                - file
      responses:
        '201':
          description: PDF uploaded successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PDF'

components:
  securitySchemes:
    ApiKeyAuth:
      type: http
      scheme: bearer
      bearerFormat: API Key

  schemas:
    PDF:
      type: object
      properties:
        id:
          type: string
          format: uuid
        file_name:
          type: string
        file_size:
          type: integer
        page_count:
          type: integer
        file_processing_status:
          type: string
          enum: [pending, processing, processed, failed]
        is_template:
          type: boolean
        created_at:
          type: string
          format: date-time

    Pagination:
      type: object
      properties:
        page:
          type: integer
        limit:
          type: integer
        total:
          type: integer
        total_pages:
          type: integer
```

### 4.2 Documentation Site

**Tool:** Scalar or Stoplight Elements (beautiful, interactive API docs)

**Features:**
- Interactive API explorer (test endpoints in browser)
- Code examples in multiple languages (curl, Python, JavaScript, Go)
- Authentication playground
- Webhook testing
- Changelog (track API changes)

**URL:** `https://docs.slicely.com/api`

---

## 5. Client SDKs

### 5.1 JavaScript/TypeScript SDK

```typescript
// @slicely/sdk

import { SlicelyClient } from '@slicely/sdk';

const client = new SlicelyClient({
  apiKey: 'sk_live_xxxxx',
  baseURL: 'https://api.slicely.com/v1', // optional
});

// Upload PDF
const pdf = await client.pdfs.upload({
  file: fileBuffer,
  isTemplate: false,
});

// Create slicer
const slicer = await client.slicers.create({
  name: 'Invoice Processor',
  description: 'Extract invoice data',
  llmPrompts: [
    {
      id: 'extract_total',
      prompt: 'Extract the total amount from this invoice',
      outputType: 'single_value',
    },
  ],
});

// Link PDF to slicer
await client.slicers.linkPDF(slicer.id, pdf.id);

// Process slicer
const job = await client.slicers.process(slicer.id, {
  pdfIds: [pdf.id],
});

// Wait for completion
const result = await client.jobs.waitFor(job.id, {
  timeout: 60000, // 60 seconds
  pollInterval: 2000, // check every 2 seconds
});

// Get outputs
const outputs = await client.slicers.getOutputs(slicer.id);

// Search
const searchResults = await client.search({
  query: 'invoice total',
  searchType: 'hybrid',
  slicerIds: [slicer.id],
});
```

### 5.2 Python SDK

```python
# slicely-python

from slicely import SlicelyClient

client = SlicelyClient(api_key='sk_live_xxxxx')

# Upload PDF
with open('invoice.pdf', 'rb') as f:
    pdf = client.pdfs.upload(file=f, is_template=False)

# Create slicer
slicer = client.slicers.create(
    name='Invoice Processor',
    description='Extract invoice data',
    llm_prompts=[
        {
            'id': 'extract_total',
            'prompt': 'Extract the total amount from this invoice',
            'output_type': 'single_value',
        }
    ]
)

# Link PDF to slicer
client.slicers.link_pdf(slicer.id, pdf.id)

# Process slicer
job = client.slicers.process(slicer.id, pdf_ids=[pdf.id])

# Wait for completion
result = client.jobs.wait_for(job.id, timeout=60, poll_interval=2)

# Get outputs
outputs = client.slicers.get_outputs(slicer.id)

# Search
search_results = client.search(
    query='invoice total',
    search_type='hybrid',
    slicer_ids=[slicer.id]
)
```

---

## 6. Testing Strategy

### 6.1 Unit Tests

```typescript
// Example: API Key Authentication Tests

describe('API Key Authentication', () => {
  test('should authenticate valid API key', async () => {
    const request = new Request('https://api.slicely.com/v1/pdfs', {
      headers: { Authorization: 'Bearer sk_live_valid_key' },
    });

    const user = await authenticateAPIKey(request);
    expect(user).toBeDefined();
    expect(user.id).toBe('user-123');
  });

  test('should reject invalid API key', async () => {
    const request = new Request('https://api.slicely.com/v1/pdfs', {
      headers: { Authorization: 'Bearer sk_live_invalid_key' },
    });

    await expect(authenticateAPIKey(request)).rejects.toThrow('Invalid API key');
  });

  test('should reject expired API key', async () => {
    const request = new Request('https://api.slicely.com/v1/pdfs', {
      headers: { Authorization: 'Bearer sk_live_expired_key' },
    });

    await expect(authenticateAPIKey(request)).rejects.toThrow('API key expired');
  });
});

describe('Rate Limiting', () => {
  test('should allow requests within rate limit', async () => {
    for (let i = 0; i < 60; i++) {
      await expect(checkRateLimit('api-key-123', 'standard')).resolves.not.toThrow();
    }
  });

  test('should reject requests exceeding rate limit', async () => {
    // Make 60 requests (at limit)
    for (let i = 0; i < 60; i++) {
      await checkRateLimit('api-key-456', 'standard');
    }

    // 61st request should fail
    await expect(checkRateLimit('api-key-456', 'standard')).rejects.toThrow('Rate limit exceeded');
  });
});
```

### 6.2 Integration Tests

```typescript
// Example: End-to-End API Tests

describe('PDF Upload and Processing', () => {
  let apiKey: string;
  let client: SlicelyClient;

  beforeAll(async () => {
    // Create test API key
    apiKey = await generateTestAPIKey();
    client = new SlicelyClient({ apiKey });
  });

  test('should upload PDF, create slicer, and process', async () => {
    // 1. Upload PDF
    const pdf = await client.pdfs.upload({
      file: testPDFBuffer,
      isTemplate: false,
    });

    expect(pdf.id).toBeDefined();
    expect(pdf.file_processing_status).toBe('pending');

    // 2. Create slicer
    const slicer = await client.slicers.create({
      name: 'Test Slicer',
      llmPrompts: [
        {
          id: 'test_prompt',
          prompt: 'Extract key information',
          outputType: 'text',
        },
      ],
    });

    expect(slicer.id).toBeDefined();

    // 3. Link PDF to slicer
    await client.slicers.linkPDF(slicer.id, pdf.id);

    // 4. Process slicer
    const job = await client.slicers.process(slicer.id, {
      pdfIds: [pdf.id],
    });

    expect(job.id).toBeDefined();
    expect(job.status).toBe('queued');

    // 5. Wait for completion
    const result = await client.jobs.waitFor(job.id, {
      timeout: 60000,
    });

    expect(result.status).toBe('completed');

    // 6. Get outputs
    const outputs = await client.slicers.getOutputs(slicer.id);

    expect(outputs.length).toBeGreaterThan(0);
  });
});
```

### 6.3 Load Testing

```typescript
// k6 load testing script

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 50 },   // Ramp up to 50 users
    { duration: '3m', target: 50 },   // Stay at 50 users
    { duration: '1m', target: 100 },  // Ramp up to 100 users
    { duration: '3m', target: 100 },  // Stay at 100 users
    { duration: '1m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.01'],   // Less than 1% errors
  },
};

export default function () {
  const url = 'https://api.slicely.com/v1/pdfs';
  const headers = {
    Authorization: 'Bearer sk_test_loadtest',
  };

  const res = http.get(url, { headers });

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}
```

---

## 7. Rollout Plan

### Phase 1: Internal Beta (Week 1-2)
- ✅ Deploy API to staging environment
- ✅ Test with internal team
- ✅ Fix critical bugs
- ✅ Finalize API documentation

### Phase 2: Private Beta (Week 3-4)
- ✅ Invite 5-10 trusted customers
- ✅ Gather feedback
- ✅ Iterate on API design
- ✅ Monitor performance and errors

### Phase 3: Public Launch (Week 5-6)
- ✅ Deploy to production
- ✅ Publish API documentation
- ✅ Release client SDKs (npm, PyPI)
- ✅ Announce on blog, social media
- ✅ Update pricing page (API access tiers)

### Phase 4: Post-Launch (Week 7+)
- ✅ Monitor adoption metrics
- ✅ Collect feedback via support tickets
- ✅ Plan v2 features based on usage patterns
- ✅ Write integration guides (Zapier, Snowflake, etc.)

---

## 8. Success Metrics

### Technical Metrics
- **Uptime:** 99.9% (< 43 minutes downtime/month)
- **Response Time:** p95 < 200ms, p99 < 500ms
- **Error Rate:** < 0.5%
- **API Key Usage:** 40%+ of users create API keys
- **Rate Limit Hit Rate:** < 5% (most users stay within limits)

### Business Metrics
- **API Adoption:** 40%+ of usage via API (vs UI)
- **Integration Usage:** 30%+ of API users build integrations
- **Upgrade Rate:** 20%+ of API users upgrade to paid plans
- **Developer NPS:** 60+ (strong developer satisfaction)

### Monitoring Dashboards
1. **API Health:** Uptime, response times, error rates
2. **Usage:** Requests per endpoint, top users, rate limit hits
3. **Business:** API key creation, SDK downloads, integration usage

---

## 9. Risk Mitigation

### Risk 1: Breaking Changes
**Mitigation:** Use versioning (/api/v1, /api/v2), deprecation warnings, 6-month sunset period

### Risk 2: API Abuse
**Mitigation:** Rate limiting, API key scopes, usage monitoring, automated abuse detection

### Risk 3: Performance Degradation
**Mitigation:** Load testing, caching (Redis), database optimization, horizontal scaling

### Risk 4: Security Vulnerabilities
**Mitigation:** Regular security audits, dependency scanning, bug bounty program

---

## 10. Dependencies & Prerequisites

### Infrastructure
- ✅ Upstash Redis (rate limiting)
- ✅ Supabase (database, already exists)
- ✅ Domain: api.slicely.com (DNS setup)
- ✅ SSL certificate (Let's Encrypt or Cloudflare)

### Tools
- ✅ Swagger/OpenAPI editor
- ✅ Scalar or Stoplight (API docs hosting)
- ✅ k6 (load testing)
- ✅ Postman (API testing)

### Skills Needed
- ✅ Backend engineer (TypeScript, Next.js)
- ✅ DevOps engineer (API deployment, monitoring)
- ✅ Technical writer (API documentation)

---

## 11. Timeline & Effort

| Task | Effort | Owner | Week |
|------|--------|-------|------|
| Database schema (API keys, logs) | 2 days | Backend | 1 |
| REST API endpoints (core CRUD) | 5 days | Backend | 1-2 |
| Authentication & rate limiting | 3 days | Backend | 2 |
| GraphQL schema & resolvers | 3 days | Backend | 2-3 |
| API documentation (OpenAPI) | 2 days | Backend | 3 |
| JavaScript SDK | 3 days | Backend | 3-4 |
| Python SDK | 3 days | Backend | 4 |
| Testing (unit, integration, load) | 3 days | Backend | 4-5 |
| Deployment & monitoring | 2 days | DevOps | 5 |
| Internal beta testing | 1 week | Team | 5-6 |
| Public launch | - | All | 6 |

**Total:** 6 weeks (1.5 months) with 1 full-time backend engineer

---

## 12. Next Steps

1. ✅ Review and approve this implementation plan
2. ✅ Set up project tracking (Linear, Jira, or GitHub Projects)
3. ✅ Provision infrastructure (Upstash Redis, DNS)
4. ✅ Create database migrations (API keys, logs)
5. ✅ Begin Phase 1 development (REST API endpoints)
6. ✅ Schedule weekly check-ins (demo progress, gather feedback)

---

**Document Owner:** Backend Engineering Team
**Last Updated:** November 5, 2025
**Status:** Ready for Implementation
**Approvers:** Product, Engineering Lead, CTO
