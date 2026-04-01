/**
 * API Error Handling Utilities
 *
 * Standardized error responses for v1 API.
 */

export type APIErrorCode =
  | 'INVALID_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'RATE_LIMITED'
  | 'VALIDATION_ERROR'
  | 'PROCESSING_ERROR'
  | 'SERVICE_UNAVAILABLE'
  | 'INTERNAL_ERROR';

export interface APIError {
  code: APIErrorCode;
  message: string;
  details?: Record<string, any>;
}

export interface APIErrorResponse {
  error: APIError;
  requestId?: string;
}

/**
 * Create a standardized error response.
 */
export function createErrorResponse(
  code: APIErrorCode,
  message: string,
  status: number,
  details?: Record<string, any>
): Response {
  const response: APIErrorResponse = {
    error: {
      code,
      message,
      ...(details && { details }),
    },
  };

  return Response.json(response, { status });
}

/**
 * Common error responses.
 */
export const ErrorResponses = {
  invalidRequest: (message: string = 'Invalid request', details?: Record<string, any>) =>
    createErrorResponse('INVALID_REQUEST', message, 400, details),

  unauthorized: (message: string = 'Authentication required') =>
    createErrorResponse('UNAUTHORIZED', message, 401),

  forbidden: (message: string = 'Permission denied') =>
    createErrorResponse('FORBIDDEN', message, 403),

  notFound: (message: string = 'Resource not found') =>
    createErrorResponse('NOT_FOUND', message, 404),

  validationError: (message: string, details?: Record<string, any>) =>
    createErrorResponse('VALIDATION_ERROR', message, 422, details),

  processingError: (message: string = 'Processing failed', details?: Record<string, any>) =>
    createErrorResponse('PROCESSING_ERROR', message, 500, details),

  serviceUnavailable: (message: string = 'Service temporarily unavailable') =>
    createErrorResponse('SERVICE_UNAVAILABLE', message, 503),

  internalError: (message: string = 'Internal server error') =>
    createErrorResponse('INTERNAL_ERROR', message, 500),
};

/**
 * Handle unknown errors and return appropriate response.
 */
export function handleError(error: unknown): Response {
  console.error('API Error:', error);

  if (error instanceof Error) {
    // Don't expose internal error details in production
    const message =
      process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred';

    return ErrorResponses.internalError(message);
  }

  return ErrorResponses.internalError();
}
