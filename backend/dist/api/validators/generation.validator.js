"use strict";
/**
 * Generation Request Validators
 * Zod validation schemas for text generation API endpoints
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskIdParamsSchema = exports.estimateCostSchema = exports.generateTextSchema = void 0;
const zod_1 = require("zod");
const ai_types_1 = require("../../types/ai.types");
/**
 * Generation options schema
 */
const generationOptionsSchema = zod_1.z.object({
    temperature: zod_1.z.number().min(0).max(2).optional(),
    maxTokens: zod_1.z.number().min(100).max(8000).optional(),
    topP: zod_1.z.number().min(0).max(1).optional(),
}).optional();
/**
 * Generate text request schema
 */
exports.generateTextSchema = zod_1.z.object({
    prompt: zod_1.z.string()
        .min(10, 'Prompt must be at least 10 characters')
        .max(5000, 'Prompt must not exceed 5000 characters'),
    provider: zod_1.z.nativeEnum(ai_types_1.AIProvider).default(ai_types_1.AIProvider.GLM_4),
    options: generationOptionsSchema,
    userId: zod_1.z.string().optional(), // TODO: authentication
});
/**
 * Estimate cost request schema
 */
exports.estimateCostSchema = zod_1.z.object({
    prompt: zod_1.z.string()
        .min(1, 'Prompt is required')
        .max(5000, 'Prompt must not exceed 5000 characters'),
    provider: zod_1.z.nativeEnum(ai_types_1.AIProvider).default(ai_types_1.AIProvider.GLM_4),
    options: generationOptionsSchema.optional(),
});
/**
 * Task ID params schema
 */
exports.taskIdParamsSchema = zod_1.z.object({
    taskId: zod_1.z.string().min(1, 'Task ID is required'),
});
