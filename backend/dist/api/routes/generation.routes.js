"use strict";
/**
 * Text Generation API Routes
 * REST endpoints for text generation and cost estimation
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const uuid_1 = require("uuid");
const queue_1 = require("../../services/queue");
const ai_1 = require("../../services/ai");
const ai_types_1 = require("../../types/ai.types");
const generation_validator_1 = require("../validators/generation.validator");
const logger_1 = __importDefault(require("../../utils/logger"));
const task_types_1 = require("../../types/task.types");
const router = (0, express_1.Router)();
/**
 * POST /api/generate/text
 * Queue text generation job
 */
router.post('/text', async (req, res) => {
    try {
        // Validate request body
        const validatedData = generation_validator_1.generateTextSchema.parse(req.body);
        const { prompt, provider, options, userId } = validatedData;
        logger_1.default.info('Text generation request received', {
            promptLength: prompt.length,
            provider,
            userId,
        });
        // Generate task ID
        const taskId = (0, uuid_1.v4)();
        // Add job to queue
        const job = await queue_1.textGenerationQueue.add(task_types_1.TaskType.GENERATE_TEXT, {
            taskId,
            userId: userId || 'anonymous', // TODO: replace with authenticated user ID
            prompt,
            provider,
            options,
        }, {
            jobId: taskId,
            priority: 5, // Normal priority
        });
        logger_1.default.info('Text generation job queued', {
            taskId: job.id,
            jobId: job.id,
            provider,
        });
        res.status(202).json({
            success: true,
            data: {
                taskId: job.id,
                status: 'pending',
                message: 'Text generation job queued successfully',
            },
        });
    }
    catch (error) {
        logger_1.default.error('Failed to queue text generation job', {
            error: error.message,
            body: req.body,
        });
        // Let error middleware handle the response
        throw error;
    }
});
/**
 * POST /api/generate/text/sync
 * Synchronous text generation (testing only)
 */
router.post('/text/sync', async (req, res) => {
    try {
        // Validate request body
        const validatedData = generation_validator_1.generateTextSchema.parse(req.body);
        const { prompt, provider, options, userId } = validatedData;
        logger_1.default.info('Synchronous text generation request received', {
            promptLength: prompt.length,
            provider,
            userId,
        });
        // Generate text synchronously
        const result = await ai_1.aiServiceManager.generateText({
            prompt,
            provider: provider || ai_types_1.AIProvider.GLM_4,
            options,
        });
        logger_1.default.info('Synchronous text generation completed', {
            provider: result.provider,
            tokensUsed: result.tokensUsed.total,
            cost: result.cost,
        });
        res.status(200).json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        logger_1.default.error('Synchronous text generation failed', {
            error: error.message,
            body: req.body,
        });
        // Let error middleware handle the response
        throw error;
    }
});
/**
 * GET /api/generate/cost
 * Estimate text generation cost
 */
router.get('/cost', async (req, res) => {
    try {
        // Validate query parameters
        const validatedData = generation_validator_1.estimateCostSchema.parse(req.query);
        const { prompt, provider, options } = validatedData;
        logger_1.default.info('Cost estimation request received', {
            promptLength: prompt.length,
            provider,
        });
        // Estimate cost
        const estimate = await ai_1.aiServiceManager.estimateCost(prompt, provider || ai_types_1.AIProvider.GLM_4, options);
        logger_1.default.info('Cost estimation completed', {
            provider,
            estimatedTokens: estimate.estimatedTokens,
            estimatedCost: estimate.estimatedCost,
        });
        res.status(200).json({
            success: true,
            data: estimate,
        });
    }
    catch (error) {
        logger_1.default.error('Cost estimation failed', {
            error: error.message,
            query: req.query,
        });
        // Let error middleware handle the response
        throw error;
    }
});
/**
 * GET /api/tasks/:taskId
 * Get task status
 */
router.get('/tasks/:taskId', async (req, res) => {
    try {
        // Validate task ID parameter
        const validatedParams = generation_validator_1.taskIdParamsSchema.parse(req.params);
        const { taskId } = validatedParams;
        logger_1.default.info('Task status request received', {
            taskId,
        });
        // Get task progress
        const progress = (0, queue_1.getTaskProgress)(taskId);
        if (!progress) {
            logger_1.default.warn('Task not found', {
                taskId,
            });
            res.status(404).json({
                success: false,
                error: {
                    type: 'TASK_NOT_FOUND',
                    message: `Task ${taskId} not found`,
                    retryable: false,
                },
            });
            return;
        }
        logger_1.default.info('Task status retrieved', {
            taskId,
            status: progress.status,
            progress: progress.progress,
        });
        res.status(200).json({
            success: true,
            data: progress,
        });
    }
    catch (error) {
        logger_1.default.error('Failed to get task status', {
            error: error.message,
            params: req.params,
        });
        // Let error middleware handle the response
        throw error;
    }
});
exports.default = router;
