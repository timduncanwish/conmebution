/**
 * Generation Request Validators
 * Zod validation schemas for text generation API endpoints
 */

import { z } from 'zod';
import { AIProvider } from '../../types/ai.types';

/**
 * Generation options schema
 */
const generationOptionsSchema = z.object({
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(100).max(8000).optional(),
  topP: z.number().min(0).max(1).optional(),
}).optional();

/**
 * Generate text request schema
 */
export const generateTextSchema = z.object({
  prompt: z.string()
    .min(10, 'Prompt must be at least 10 characters')
    .max(5000, 'Prompt must not exceed 5000 characters'),
  provider: z.nativeEnum(AIProvider).default(AIProvider.GLM_4),
  options: generationOptionsSchema,
  userId: z.string().optional(), // TODO: authentication
});

/**
 * Estimate cost request schema
 */
export const estimateCostSchema = z.object({
  prompt: z.string()
    .min(1, 'Prompt is required')
    .max(5000, 'Prompt must not exceed 5000 characters'),
  provider: z.nativeEnum(AIProvider).default(AIProvider.GLM_4),
  options: generationOptionsSchema.optional(),
});

/**
 * Task ID params schema
 */
export const taskIdParamsSchema = z.object({
  taskId: z.string().min(1, 'Task ID is required'),
});

/**
 * Validation error type
 */
export type ValidationError = z.ZodError;
