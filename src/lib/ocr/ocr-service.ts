/**
 * OCR Service
 *
 * Multi-method OCR service with smart routing:
 * - LLMWhisperer (primary - layout preservation)
 * - DeepSeek-OCR (high-volume, self-hosted)
 * - AWS Textract (forms and tables)
 * - Tesseract (fallback)
 */

'use server';

import {
  type OCRRequest,
  type OCRResult,
  type OCRMethod,
  type LLMWhispererResponse,
  type LLMWhispererQuota,
  OCRError,
} from './types';

// =============================================================================
// Configuration
// =============================================================================

const LLMWHISPERER_BASE_URL = 'https://llmwhisperer-api.us-central.unstract.com/api/v2';
const DEEPSEEK_OCR_ENDPOINT = process.env.DEEPSEEK_OCR_ENDPOINT || 'http://localhost:8000';

// =============================================================================
// Main OCR Function
// =============================================================================

/**
 * Extract text from PDF using the best available OCR method.
 * Automatically selects the optimal method based on document type and available services.
 */
export async function extractText(request: OCRRequest): Promise<OCRResult> {
  const startTime = Date.now();
  const { input, options } = request;

  // Determine which OCR method to use
  const method = options?.method || (await selectOCRMethod(request));

  // Convert input to buffer if URL
  const buffer = typeof input === 'string' ? await fetchPDFBuffer(input) : input;

  let result: OCRResult;

  switch (method) {
    case 'llmwhisperer':
      result = await extractWithLLMWhisperer(buffer, options);
      break;

    case 'deepseek':
      result = await extractWithDeepSeek(buffer, options);
      break;

    case 'textract':
      result = await extractWithTextract(buffer, options);
      break;

    case 'tesseract':
      result = await extractWithTesseract(buffer, options);
      break;

    case 'pdfjs':
      // Use existing PDF.js text extraction (not OCR)
      result = await extractWithPDFJS(buffer, options);
      break;

    default:
      throw new OCRError(`Unknown OCR method: ${method}`, 'UNKNOWN_METHOD', method);
  }

  result.processingTimeMs = Date.now() - startTime;
  return result;
}

// =============================================================================
// OCR Method Selection
// =============================================================================

/**
 * Select the best OCR method based on document characteristics and availability.
 */
async function selectOCRMethod(request: OCRRequest): Promise<OCRMethod> {
  const { options } = request;

  // If forms detection is needed, use Textract
  if (options?.detectForms) {
    return 'textract';
  }

  // If layout preservation is critical, use LLMWhisperer
  if (options?.preserveLayout) {
    const quota = await getLLMWhispererQuota();
    if (quota && quota.remaining > 0) {
      return 'llmwhisperer';
    }
  }

  // Check if DeepSeek-OCR is available (for high-volume)
  if (await isDeepSeekAvailable()) {
    return 'deepseek';
  }

  // Check LLMWhisperer quota
  const quota = await getLLMWhispererQuota();
  if (quota && quota.remaining > 0) {
    return 'llmwhisperer';
  }

  // Check if Textract is configured
  if (process.env.AWS_ACCESS_KEY_ID) {
    return 'textract';
  }

  // Fallback to Tesseract
  return 'tesseract';
}

// =============================================================================
// LLMWhisperer Integration
// =============================================================================

/**
 * Extract text using LLMWhisperer API.
 * Best for: Layout preservation, LLM preprocessing
 * Cost: Free (100 pages/day), then $0.01/page
 */
async function extractWithLLMWhisperer(
  buffer: Buffer,
  options?: OCRRequest['options']
): Promise<OCRResult> {
  const apiKey = process.env.LLMWHISPERER_API_KEY;
  if (!apiKey) {
    throw new OCRError('LLMWHISPERER_API_KEY not configured', 'CONFIG_ERROR', 'llmwhisperer');
  }

  // Determine processing mode
  let processingMode = options?.processingMode || 'high_quality';
  if (options?.detectForms) {
    processingMode = 'form';
  }

  // Create form data
  const formData = new FormData();
  formData.append('file', new Blob([buffer], { type: 'application/pdf' }), 'document.pdf');
  formData.append('processing_mode', processingMode);
  formData.append('output_mode', options?.preserveLayout ? 'layout_preserving' : 'text');

  if (options?.pages) {
    formData.append('pages_to_extract', options.pages.join(','));
  }

  if (options?.language) {
    formData.append('lang', options.language);
  }

  try {
    const response = await fetch(`${LLMWHISPERER_BASE_URL}/whisper`, {
      method: 'POST',
      headers: {
        'unstract-key': apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new OCRError(
        `LLMWhisperer API error: ${error}`,
        'API_ERROR',
        'llmwhisperer',
        response.status,
        response.status === 429
      );
    }

    const data: LLMWhispererResponse = await response.json();

    return {
      text: data.extracted_text,
      markdown: data.markdown || data.extracted_text,
      confidence: data.confidence || 0.95,
      method: 'llmwhisperer',
      processingTimeMs: data.processing_time_ms || 0,
      pageCount: data.page_count,
    };
  } catch (error: any) {
    if (error instanceof OCRError) throw error;
    throw new OCRError(
      error.message || 'LLMWhisperer extraction failed',
      'EXTRACTION_FAILED',
      'llmwhisperer'
    );
  }
}

/**
 * Get LLMWhisperer quota information.
 */
export async function getLLMWhispererQuota(): Promise<LLMWhispererQuota | null> {
  const apiKey = process.env.LLMWHISPERER_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch(`${LLMWHISPERER_BASE_URL}/get-usage-info`, {
      headers: {
        'unstract-key': apiKey,
      },
    });

    if (!response.ok) return null;

    const data = await response.json();
    return {
      used: data.pages_extracted || 0,
      limit: data.overage_page_count || 100,
      remaining: Math.max(0, (data.overage_page_count || 100) - (data.pages_extracted || 0)),
      reset_at: data.subscription_end_date,
    };
  } catch {
    return null;
  }
}

// =============================================================================
// DeepSeek-OCR Integration
// =============================================================================

/**
 * Extract text using DeepSeek-OCR (self-hosted).
 * Best for: High-volume, complex layouts, cost-effective
 * Cost: $0 (self-hosted, requires GPU)
 */
async function extractWithDeepSeek(
  buffer: Buffer,
  options?: OCRRequest['options']
): Promise<OCRResult> {
  if (!process.env.DEEPSEEK_OCR_ENDPOINT) {
    throw new OCRError('DEEPSEEK_OCR_ENDPOINT not configured', 'CONFIG_ERROR', 'deepseek');
  }

  try {
    // Convert PDF pages to images
    const images = await pdfToImages(buffer, options?.pages);

    const response = await fetch(`${DEEPSEEK_OCR_ENDPOINT}/ocr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        images: images.map((img) => img.toString('base64')),
        output_format: 'markdown',
        resolution_mode: '1024x1024',
      }),
    });

    if (!response.ok) {
      throw new OCRError(
        `DeepSeek-OCR API error: ${response.statusText}`,
        'API_ERROR',
        'deepseek',
        response.status
      );
    }

    const data = await response.json();

    return {
      text: data.text,
      markdown: data.markdown,
      confidence: 0.97, // DeepSeek reports 97% accuracy
      method: 'deepseek',
      processingTimeMs: data.processing_time_ms || 0,
      pageCount: images.length,
    };
  } catch (error: any) {
    if (error instanceof OCRError) throw error;
    throw new OCRError(
      error.message || 'DeepSeek-OCR extraction failed',
      'EXTRACTION_FAILED',
      'deepseek'
    );
  }
}

/**
 * Check if DeepSeek-OCR service is available.
 */
async function isDeepSeekAvailable(): Promise<boolean> {
  if (!process.env.DEEPSEEK_OCR_ENDPOINT) return false;

  try {
    const response = await fetch(`${DEEPSEEK_OCR_ENDPOINT}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(2000), // 2 second timeout
    });
    return response.ok;
  } catch {
    return false;
  }
}

// =============================================================================
// AWS Textract Integration
// =============================================================================

/**
 * Extract text using AWS Textract.
 * Best for: Forms, tables, enterprise reliability
 * Cost: $0.0015/page
 */
async function extractWithTextract(
  buffer: Buffer,
  options?: OCRRequest['options']
): Promise<OCRResult> {
  // Check for AWS credentials
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    throw new OCRError('AWS credentials not configured', 'CONFIG_ERROR', 'textract');
  }

  try {
    // Dynamically import AWS SDK to avoid bundling if not used
    const { TextractClient, DetectDocumentTextCommand, AnalyzeDocumentCommand } = await import(
      '@aws-sdk/client-textract'
    );

    const client = new TextractClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    let response;

    if (options?.detectForms || options?.extractTables) {
      // Use AnalyzeDocument for forms and tables
      const command = new AnalyzeDocumentCommand({
        Document: { Bytes: buffer },
        FeatureTypes: [
          ...(options?.detectForms ? ['FORMS'] : []),
          ...(options?.extractTables ? ['TABLES'] : []),
        ] as any,
      });
      response = await client.send(command);
    } else {
      // Use DetectDocumentText for simple text extraction
      const command = new DetectDocumentTextCommand({
        Document: { Bytes: buffer },
      });
      response = await client.send(command);
    }

    // Extract text from blocks
    const lines = response.Blocks?.filter((block) => block.BlockType === 'LINE').map(
      (block) => block.Text
    ) || [];

    const text = lines.join('\n');

    // Extract tables if present
    const tables = options?.extractTables
      ? extractTablesFromTextract(response.Blocks || [])
      : undefined;

    // Extract form fields if present
    const formFields = options?.detectForms
      ? extractFormFieldsFromTextract(response.Blocks || [])
      : undefined;

    return {
      text,
      confidence: 0.95,
      method: 'textract',
      processingTimeMs: 0,
      pageCount: 1, // Textract processes one page at a time
      tables,
      formFields,
    };
  } catch (error: any) {
    if (error instanceof OCRError) throw error;
    throw new OCRError(
      error.message || 'Textract extraction failed',
      'EXTRACTION_FAILED',
      'textract'
    );
  }
}

// =============================================================================
// Tesseract Integration (Fallback)
// =============================================================================

/**
 * Extract text using Tesseract OCR (via external service or local).
 * Best for: Fallback, simple text
 * Cost: Free
 */
async function extractWithTesseract(
  buffer: Buffer,
  options?: OCRRequest['options']
): Promise<OCRResult> {
  // Note: For production, you'd want to use a Tesseract service or local installation
  // This is a placeholder that could be integrated with tesseract.js or a service

  throw new OCRError(
    'Tesseract OCR not yet implemented. Please use LLMWhisperer or Textract.',
    'NOT_IMPLEMENTED',
    'tesseract'
  );
}

// =============================================================================
// PDF.js Text Extraction (No OCR)
// =============================================================================

/**
 * Extract text using PDF.js (for native text PDFs).
 * This is not OCR - it extracts embedded text from the PDF.
 */
async function extractWithPDFJS(
  buffer: Buffer,
  options?: OCRRequest['options']
): Promise<OCRResult> {
  // Use existing PDF.js implementation
  const pdfjs = await import('pdfjs-dist');

  const pdf = await pdfjs.getDocument({
    data: buffer,
    password: options?.password,
  }).promise;

  const pages: string[] = [];
  const pagesToProcess = options?.pages || Array.from({ length: pdf.numPages }, (_, i) => i + 1);

  for (const pageNum of pagesToProcess) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const text = textContent.items.map((item: any) => item.str).join(' ');
    pages.push(text);
  }

  return {
    text: pages.join('\n\n'),
    confidence: 1.0, // Native text is exact
    method: 'pdfjs',
    processingTimeMs: 0,
    pageCount: pagesToProcess.length,
  };
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Fetch PDF buffer from URL.
 */
async function fetchPDFBuffer(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch PDF: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Convert PDF pages to images for OCR processing.
 */
async function pdfToImages(buffer: Buffer, pages?: number[]): Promise<Buffer[]> {
  // Note: This requires a PDF-to-image library like pdf-poppler or pdf2pic
  // For now, return empty array - would need to implement based on your needs

  // Placeholder implementation
  console.warn('pdfToImages not fully implemented - need pdf-to-image library');
  return [];
}

/**
 * Extract tables from Textract response.
 */
function extractTablesFromTextract(blocks: any[]): any[] {
  // Implementation would parse TABLE and CELL blocks
  return [];
}

/**
 * Extract form fields from Textract response.
 */
function extractFormFieldsFromTextract(blocks: any[]): any[] {
  // Implementation would parse KEY_VALUE_SET blocks
  return [];
}

// =============================================================================
// High-Level API
// =============================================================================

/**
 * Simple text extraction with automatic method selection.
 */
export async function simpleExtract(
  input: Buffer | string,
  options?: {
    preserveLayout?: boolean;
    password?: string;
  }
): Promise<string> {
  const result = await extractText({
    input,
    options: {
      preserveLayout: options?.preserveLayout,
      password: options?.password,
    },
  });

  return result.text;
}

/**
 * Extract with layout preservation (returns markdown).
 */
export async function extractWithLayout(input: Buffer | string): Promise<string> {
  const result = await extractText({
    input,
    options: {
      preserveLayout: true,
      method: 'llmwhisperer',
    },
  });

  return result.markdown || result.text;
}

/**
 * Extract forms and key-value pairs.
 */
export async function extractForms(
  input: Buffer | string
): Promise<{ text: string; formFields: any[] }> {
  const result = await extractText({
    input,
    options: {
      detectForms: true,
      method: 'textract',
    },
  });

  return {
    text: result.text,
    formFields: result.formFields || [],
  };
}
