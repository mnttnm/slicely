/**
 * API Authentication Utilities
 *
 * Handles API key validation and rate limiting for v1 API.
 */

import { NextRequest } from 'next/server';

export interface APIKeyInfo {
  keyId: string;
  userId: string;
  organizationId?: string;
  permissions: string[];
  rateLimit: {
    requestsPerMinute: number;
    requestsPerDay: number;
  };
}

/**
 * Validate API key from request headers.
 * Returns key info if valid, null otherwise.
 */
export async function validateAPIKey(request: NextRequest): Promise<APIKeyInfo | null> {
  const authHeader = request.headers.get('authorization');
  const apiKeyHeader = request.headers.get('x-api-key');

  const apiKey = apiKeyHeader || (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null);

  if (!apiKey) {
    return null;
  }

  // TODO: Implement actual API key validation against database
  // For now, validate against environment variable for development
  const validKey = process.env.API_KEY;
  if (apiKey === validKey) {
    return {
      keyId: 'dev-key',
      userId: 'dev-user',
      permissions: ['read', 'write', 'extract', 'chat'],
      rateLimit: {
        requestsPerMinute: 60,
        requestsPerDay: 10000,
      },
    };
  }

  return null;
}

/**
 * Check if API key has required permission.
 */
export function hasPermission(keyInfo: APIKeyInfo, permission: string): boolean {
  return keyInfo.permissions.includes(permission) || keyInfo.permissions.includes('*');
}

// In-memory rate limit store (replace with Redis in production)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Check and update rate limit for an API key.
 * Returns true if request is allowed, false if rate limited.
 */
export function checkRateLimit(keyInfo: APIKeyInfo): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
} {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  const key = `rate:${keyInfo.keyId}`;

  let record = rateLimitStore.get(key);

  // Reset if window expired
  if (!record || record.resetAt < now) {
    record = {
      count: 0,
      resetAt: now + windowMs,
    };
  }

  record.count++;
  rateLimitStore.set(key, record);

  const remaining = Math.max(0, keyInfo.rateLimit.requestsPerMinute - record.count);

  return {
    allowed: record.count <= keyInfo.rateLimit.requestsPerMinute,
    remaining,
    resetAt: record.resetAt,
  };
}

/**
 * Create authentication error response.
 */
export function authError(message: string, status: number = 401) {
  return Response.json(
    {
      error: {
        code: status === 401 ? 'UNAUTHORIZED' : 'FORBIDDEN',
        message,
      },
    },
    { status }
  );
}

/**
 * Create rate limit error response.
 */
export function rateLimitError(resetAt: number) {
  return Response.json(
    {
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many requests',
        retryAfter: Math.ceil((resetAt - Date.now()) / 1000),
      },
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000)),
      },
    }
  );
}
