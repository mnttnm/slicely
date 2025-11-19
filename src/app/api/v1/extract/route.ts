/**
 * Document Extraction Endpoint
 *
 * POST /api/v1/extract
 *
 * Extract text from PDF documents using OCR.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { extractText, type OCRMethod } from '@/lib/ocr';
import {
  validateAPIKey,
  hasPermission,
  checkRateLimit,
  authError,
  rateLimitError,
} from '../utils/auth';
import { ErrorResponses, handleError } from '../utils/errors';

// Request validation schema
const ExtractRequestSchema = z.object({
  // Either file (base64) or url must be provided
  file: z.string().optional(),
  url: z.string().url().optional(),
  // OCR options
  method: z.enum(['llmwhisperer', 'deepseek', 'textract', 'tesseract', 'pdfjs']).optional(),
  preserveLayout: z.boolean().optional(),
  detectForms: z.boolean().optional(),
  extractTables: z.boolean().optional(),
  pages: z.array(z.number().positive()).optional(),
  language: z.string().optional(),
  password: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Authenticate
    const keyInfo = await validateAPIKey(request);
    if (!keyInfo) {
      return authError('Invalid or missing API key');
    }

    // Check permission
    if (!hasPermission(keyInfo, 'extract')) {
      return authError('API key does not have extraction permission', 403);
    }

    // Check rate limit
    const rateLimit = checkRateLimit(keyInfo);
    if (!rateLimit.allowed) {
      return rateLimitError(rateLimit.resetAt);
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = ExtractRequestSchema.safeParse(body);

    if (!validation.success) {
      return ErrorResponses.validationError('Invalid request body', {
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const { file, url, method, preserveLayout, detectForms, extractTables, pages, language, password } =
      validation.data;

    // Ensure either file or url is provided
    if (!file && !url) {
      return ErrorResponses.validationError('Either file (base64) or url must be provided');
    }

    // Convert base64 to buffer if file provided
    let input: Buffer | string;
    if (file) {
      try {
        input = Buffer.from(file, 'base64');
      } catch {
        return ErrorResponses.validationError('Invalid base64 file data');
      }
    } else {
      input = url!;
    }

    // Extract text
    const result = await extractText({
      input,
      options: {
        method: method as OCRMethod,
        preserveLayout,
        detectForms,
        extractTables,
        pages,
        language,
        password,
      },
    });

    // Return result with rate limit headers
    return Response.json(
      {
        success: true,
        data: {
          text: result.text,
          markdown: result.markdown,
          confidence: result.confidence,
          method: result.method,
          pageCount: result.pageCount,
          processingTimeMs: result.processingTimeMs,
          tables: result.tables,
          formFields: result.formFields,
        },
      },
      {
        headers: {
          'X-RateLimit-Remaining': String(rateLimit.remaining),
          'X-RateLimit-Reset': String(rateLimit.resetAt),
        },
      }
    );
  } catch (error) {
    return handleError(error);
  }
}
