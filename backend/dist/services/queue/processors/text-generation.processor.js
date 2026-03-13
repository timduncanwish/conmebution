"use strict";
/**
 * Text Generation Job Processor
 * Processes text generation jobs from the Bull queue
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ai_manager_service_1 = require("../../ai/ai-manager.service");
const index_1 = require("../index");
const logger_1 = __importDefault(require("../../../utils/logger"));
const task_types_1 = require("../../../types/task.types");
const ai_types_1 = require("../../../types/ai.types");
/**
 * Text generation processor function
 * Processes jobs from the text generation queue
 */
const textGenerationProcessor = async (job) => {
    const { userId, prompt, provider, options } = job.data;
    logger_1.default.info('Processing text generation job', {
        jobId: job.id,
        userId,
        provider,
        promptLength: prompt.length,
    });
    try {
        // Step 1: Initialize task (10%)
        (0, index_1.updateTaskProgress)(job.data.taskId, {
            status: task_types_1.TaskStatus.PROCESSING,
            progress: 10,
            currentStep: 'Initializing text generation',
        });
        job.progress(10);
        // Step 2: Call AI service (30%)
        (0, index_1.updateTaskProgress)(job.data.taskId, {
            progress: 30,
            currentStep: 'Calling AI service',
        });
        job.progress(30);
        // Validate provider enum
        const validatedProvider = provider in ai_types_1.AIProvider
            ? provider
            : ai_types_1.AIProvider.GLM_4; // fallback to default
        const result = await ai_manager_service_1.aiServiceManager.generateText({
            prompt,
            provider: validatedProvider,
            options,
        });
        // Step 3: Save result (80%)
        (0, index_1.updateTaskProgress)(job.data.taskId, {
            progress: 80,
            currentStep: 'Saving result',
        });
        job.progress(80);
        // TODO: Save to database using Prisma (will be integrated in Task 8)
        // For now, just return the result
        // Step 4: Complete (100%)
        (0, index_1.updateTaskProgress)(job.data.taskId, {
            progress: 100,
            currentStep: 'Text generation completed',
        });
        job.progress(100);
        logger_1.default.info('Text generation job completed successfully', {
            jobId: job.id,
            userId,
            provider: result.provider,
            tokensUsed: result.tokensUsed.total,
            cost: result.cost,
        });
        return {
            content: result.content,
            provider: result.provider,
            model: result.model,
            tokensUsed: result.tokensUsed,
            cost: result.cost,
            timestamp: result.timestamp,
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorCode = error && typeof error === 'object' && 'code' in error
            ? error.code
            : 'PROCESSING_ERROR';
        logger_1.default.error('Text generation job failed', {
            jobId: job.id,
            userId,
            provider,
            error: errorMessage,
            code: errorCode,
        });
        // Update task progress with error
        (0, index_1.updateTaskProgress)(job.data.taskId, {
            status: task_types_1.TaskStatus.FAILED,
            currentStep: 'Failed',
            error: {
                code: errorCode,
                message: errorMessage,
            },
        });
        // Throw error to mark job as failed
        throw error;
    }
};
/**
 * Register the processor with the text generation queue
 */
const index_2 = require("../index");
index_2.textGenerationQueue.process(textGenerationProcessor);
logger_1.default.info('Text generation processor registered');
