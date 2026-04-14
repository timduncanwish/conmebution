/**
 * Content CRUD Request Validators
 */

import { z } from 'zod';

export const createContentSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required').max(10000),
  type: z.enum(['text', 'image', 'video', 'all']).default('text'),
  generatedContent: z.any(),
  aiProvider: z.string().max(50).default('unknown'),
  cost: z.number().int().min(0).optional(),
  templateId: z.string().optional(),
  status: z.enum(['draft', 'generated', 'published']).default('draft'),
});

export const updateContentSchema = z.object({
  generatedContent: z.any().optional(),
  status: z.enum(['draft', 'generated', 'published']).optional(),
});

export const contentIdParamsSchema = z.object({
  id: z.string().min(1, 'Content ID is required'),
});

export const contentListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  status: z.enum(['draft', 'generated', 'published']).optional(),
});
