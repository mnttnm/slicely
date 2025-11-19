/**
 * OCR Service Types
 *
 * Type definitions for the multi-method OCR service.
 */

// =============================================================================
// OCR Method Types
// =============================================================================

export type OCRMethod = 'llmwhisperer' | 'deepseek' | 'textract' | 'tesseract' | 'pdfjs';

export type OCRProcessingMode = 'native_text' | 'low_cost' | 'high_quality' | 'form';

// =============================================================================
// OCR Request/Response Types
// =============================================================================

export interface OCRRequest {
  /** PDF file buffer or URL */
  input: Buffer | string;

  /** OCR processing options */
  options?: {
    /** Preferred OCR method (auto-select if not specified) */
    method?: OCRMethod;

    /** Processing mode for LLMWhisperer */
    processingMode?: OCRProcessingMode;

    /** Preserve document layout as markdown */
    preserveLayout?: boolean;

    /** Detect forms and extract key-value pairs */
    detectForms?: boolean;

    /** Extract tables from document */
    extractTables?: boolean;

    /** Specific pages to process (1-indexed) */
    pages?: number[];

    /** Language hint for OCR (default: 'eng') */
    language?: string;

    /** Password for protected PDFs */
    password?: string;
  };
}

export interface OCRResult {
  /** Extracted text content */
  text: string;

  /** Markdown with preserved layout (if requested) */
  markdown?: string;

  /** Confidence score (0-1) */
  confidence: number;

  /** OCR method used */
  method: OCRMethod;

  /** Processing time in milliseconds */
  processingTimeMs: number;

  /** Number of pages processed */
  pageCount: number;

  /** Per-page results */
  pages?: OCRPageResult[];

  /** Detected tables (if extractTables enabled) */
  tables?: OCRTable[];

  /** Detected forms/key-value pairs (if detectForms enabled) */
  formFields?: OCRFormField[];
}

export interface OCRPageResult {
  pageNumber: number;
  text: string;
  markdown?: string;
  confidence: number;
}

export interface OCRTable {
  pageNumber: number;
  headers: string[];
  rows: string[][];
  confidence: number;
}

export interface OCRFormField {
  pageNumber: number;
  key: string;
  value: string;
  confidence: number;
  boundingBox?: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
}

// =============================================================================
// Provider-Specific Types
// =============================================================================

export interface LLMWhispererConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface LLMWhispererResponse {
  extracted_text: string;
  markdown?: string;
  confidence?: number;
  page_count: number;
  processing_time_ms?: number;
  status: string;
}

export interface LLMWhispererQuota {
  used: number;
  limit: number;
  remaining: number;
  reset_at?: string;
}

export interface DeepSeekOCRConfig {
  endpoint: string;
  model?: string;
  resolutionMode?: '512x512' | '768x768' | '1024x1024' | '1280x1280' | 'dynamic';
}

export interface DeepSeekOCRResponse {
  text: string;
  markdown: string;
  processing_time_ms: number;
  tokens_used: number;
}

// =============================================================================
// Error Types
// =============================================================================

export class OCRError extends Error {
  constructor(
    message: string,
    public code: string,
    public method: OCRMethod,
    public statusCode?: number,
    public retryable?: boolean
  ) {
    super(message);
    this.name = 'OCRError';
  }
}

// =============================================================================
// Usage Tracking Types
// =============================================================================

export interface OCRUsageRecord {
  id?: string;
  method: OCRMethod;
  pageCount: number;
  processingTimeMs: number;
  confidence: number;
  cost: number;
  pdfId?: string;
  timestamp: Date;
}
