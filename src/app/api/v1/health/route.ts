/**
 * Health Check Endpoint
 *
 * GET /api/v1/health
 *
 * Returns service health status and available features.
 */

import { NextRequest } from 'next/server';
import { isProviderAvailable, getAvailableProviders } from '@/lib/llm';
import { getLLMWhispererQuota } from '@/lib/ocr';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  // Check service health
  const [llmProviders, ocrQuota] = await Promise.all([
    getAvailableProviders(),
    getLLMWhispererQuota(),
  ]);

  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    responseTimeMs: Date.now() - startTime,
    services: {
      llm: {
        status: llmProviders.length > 0 ? 'available' : 'degraded',
        providers: llmProviders,
      },
      ocr: {
        status: ocrQuota ? 'available' : 'limited',
        llmwhisperer: ocrQuota
          ? {
              remaining: ocrQuota.remaining,
              limit: ocrQuota.limit,
            }
          : null,
        textract: !!process.env.AWS_ACCESS_KEY_ID,
        deepseek: !!process.env.DEEPSEEK_OCR_ENDPOINT,
      },
      database: {
        status: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'configured' : 'not_configured',
      },
    },
  };

  // Determine overall status
  if (llmProviders.length === 0 && !ocrQuota) {
    health.status = 'degraded';
  }

  return Response.json(health);
}
