/**
 * Text Generation Job Processor
 * Processes text generation jobs from the Bull queue
 */

import { Job } from 'bull';
import { aiServiceManager } from '../../ai/ai-manager.service';
import { updateTaskProgress } from '../index';
import logger from '../../../utils/logger';
import { TextGenerationTaskData, TaskStatus } from '../../../types/task.types';
import { AIProvider } from '../../../types/ai.types';

/**
 * Text generation processor function
 * Processes jobs from the text generation queue
 */
const textGenerationProcessor = async (job: Job<TextGenerationTaskData>) => {
  const { userId, prompt, provider, options } = job.data;

  logger.info('Processing text generation job', {
    jobId: job.id,
    userId,
    provider,
    promptLength: prompt.length,
  });

  try {
    // Step 1: Initialize task (10%)
    updateTaskProgress(job.data.taskId, {
      status: TaskStatus.PROCESSING,
      progress: 10,
      currentStep: 'Initializing text generation',
    });
    job.progress(10);

    // Step 2: Call AI service (30%)
    updateTaskProgress(job.data.taskId, {
      progress: 30,
      currentStep: 'Calling AI service',
    });
    job.progress(30);

    // Validate provider enum
    const validatedProvider = provider in AIProvider
      ? provider as AIProvider
      : AIProvider.GLM_4; // fallback to default

    const result = await aiServiceManager.generateText({
      prompt,
      provider: validatedProvider,
      options,
    });

    // Step 3: Save result (80%)
    updateTaskProgress(job.data.taskId, {
      progress: 80,
      currentStep: 'Saving result',
    });
    job.progress(80);

    // TODO: Save to database using Prisma (will be integrated in Task 8)
    // For now, just return the result

    // Step 4: Complete (100%)
    updateTaskProgress(job.data.taskId, {
      progress: 100,
      currentStep: 'Text generation completed',
    });
    job.progress(100);

    logger.info('Text generation job completed successfully', {
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

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode = error && typeof error === 'object' && 'code' in error
      ? (error as any).code
      : 'PROCESSING_ERROR';

    logger.error('Text generation job failed', {
      jobId: job.id,
      userId,
      provider,
      error: errorMessage,
      code: errorCode,
    });

    // Update task progress with error
    updateTaskProgress(job.data.taskId, {
      status: TaskStatus.FAILED,
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
import { textGenerationQueue } from '../index';

textGenerationQueue.process(textGenerationProcessor);

logger.info('Text generation processor registered');
