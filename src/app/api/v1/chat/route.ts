/**
 * Chat Completion Endpoint
 *
 * POST /api/v1/chat
 *
 * Generate chat completions using multi-provider LLM.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { generateCompletion, generateStreamingCompletion, type LLMProviderType } from '@/lib/llm';
import {
  validateAPIKey,
  hasPermission,
  checkRateLimit,
  authError,
  rateLimitError,
} from '../utils/auth';
import { ErrorResponses, handleError } from '../utils/errors';

// Request validation schema
const ChatRequestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['system', 'user', 'assistant']),
      content: z.string(),
    })
  ),
  provider: z.enum(['openai', 'anthropic', 'google', 'azure', 'ollama']).optional(),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().positive().optional(),
  stream: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Authenticate
    const keyInfo = await validateAPIKey(request);
    if (!keyInfo) {
      return authError('Invalid or missing API key');
    }

    // Check permission
    if (!hasPermission(keyInfo, 'chat')) {
      return authError('API key does not have chat permission', 403);
    }

    // Check rate limit
    const rateLimit = checkRateLimit(keyInfo);
    if (!rateLimit.allowed) {
      return rateLimitError(rateLimit.resetAt);
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = ChatRequestSchema.safeParse(body);

    if (!validation.success) {
      return ErrorResponses.validationError('Invalid request body', {
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const { messages, provider, model, temperature, maxTokens, stream } = validation.data;

    // Determine provider and model
    const llmProvider = (provider || 'openai') as LLMProviderType;
    const llmModel = model || (llmProvider === 'openai' ? 'gpt-4o' : undefined);

    if (!llmModel) {
      return ErrorResponses.validationError('Model must be specified for this provider');
    }

    // Build prompt from messages
    const systemMessage = messages.find((m) => m.role === 'system')?.content;
    const conversationMessages = messages.filter((m) => m.role !== 'system');

    // Format conversation for prompt
    const prompt = conversationMessages
      .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n\n');

    const config = {
      provider: llmProvider,
      model: llmModel,
      temperature,
      maxTokens,
    };

    if (stream) {
      // Streaming response
      const textStream = await generateStreamingCompletion({
        prompt,
        config,
        systemPrompt: systemMessage,
      });

      // Return the stream with appropriate headers
      return new Response(textStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
          'X-RateLimit-Remaining': String(rateLimit.remaining),
          'X-RateLimit-Reset': String(rateLimit.resetAt),
        },
      });
    } else {
      // Non-streaming response
      const result = await generateCompletion({
        prompt,
        config,
        systemPrompt: systemMessage,
      });

      return Response.json(
        {
          success: true,
          data: {
            content: result.text,
            usage: result.usage,
            model: llmModel,
            provider: llmProvider,
          },
        },
        {
          headers: {
            'X-RateLimit-Remaining': String(rateLimit.remaining),
            'X-RateLimit-Reset': String(rateLimit.resetAt),
          },
        }
      );
    }
  } catch (error) {
    return handleError(error);
  }
}
