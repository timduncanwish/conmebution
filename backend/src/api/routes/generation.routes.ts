/**
 * Text Generation API Routes
 * REST endpoints for text generation and cost estimation
 */

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { textGenerationQueue, getTaskProgress } from '../../services/queue';
import { aiServiceManager } from '../../services/ai';
import { AIProvider } from '../../types/ai.types';
import {
  generateTextSchema,
  estimateCostSchema,
  taskIdParamsSchema,
} from '../validators/generation.validator';
import logger from '../../utils/logger';
import { TaskType } from '../../types/task.types';

const router = Router();

/**
 * POST /api/generate/text
 * Queue text generation job
 */
router.post('/text', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validatedData = generateTextSchema.parse(req.body);
    const { prompt, provider, options, userId } = validatedData;

    logger.info('Text generation request received', {
      promptLength: prompt.length,
      provider,
      userId,
    });

    // Generate task ID
    const taskId = uuidv4();

    // Add job to queue
    const job = await textGenerationQueue.add(
      TaskType.GENERATE_TEXT,
      {
        taskId,
        userId: userId || 'anonymous', // TODO: replace with authenticated user ID
        prompt,
        provider,
        options,
      },
      {
        jobId: taskId,
        priority: 5, // Normal priority
      }
    );

    logger.info('Text generation job queued', {
      taskId: job.id,
      jobId: job.id,
      provider,
    });

    res.status(202).json({
      success: true,
      data: {
        taskId: job.id as string,
        status: 'pending',
        message: 'Text generation job queued successfully',
      },
    });
  } catch (error: any) {
    logger.error('Failed to queue text generation job', {
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
router.post('/text/sync', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validatedData = generateTextSchema.parse(req.body);
    const { prompt, provider, options, userId } = validatedData;

    logger.info('Synchronous text generation request received', {
      promptLength: prompt.length,
      provider,
      userId,
    });

    // Generate text synchronously
    const result = await aiServiceManager.generateText({
      prompt,
      provider: provider || AIProvider.GLM_4,
      options,
    });

    logger.info('Synchronous text generation completed', {
      provider: result.provider,
      tokensUsed: result.tokensUsed.total,
      cost: result.cost,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error('Synchronous text generation failed', {
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
router.get('/cost', async (req: Request, res: Response) => {
  try {
    // Validate query parameters
    const validatedData = estimateCostSchema.parse(req.query);
    const { prompt, provider, options } = validatedData;

    logger.info('Cost estimation request received', {
      promptLength: prompt.length,
      provider,
    });

    // Estimate cost
    const estimate = await aiServiceManager.estimateCost(
      prompt,
      provider || AIProvider.GLM_4,
      options
    );

    logger.info('Cost estimation completed', {
      provider,
      estimatedTokens: estimate.estimatedTokens,
      estimatedCost: estimate.estimatedCost,
    });

    res.status(200).json({
      success: true,
      data: estimate,
    });
  } catch (error: any) {
    logger.error('Cost estimation failed', {
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
router.get('/tasks/:taskId', async (req: Request, res: Response) => {
  try {
    // Validate task ID parameter
    const validatedParams = taskIdParamsSchema.parse(req.params);
    const { taskId } = validatedParams;

    logger.info('Task status request received', {
      taskId,
    });

    // Get task progress
    const progress = getTaskProgress(taskId);

    if (!progress) {
      logger.warn('Task not found', {
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

    logger.info('Task status retrieved', {
      taskId,
      status: progress.status,
      progress: progress.progress,
    });

    res.status(200).json({
      success: true,
      data: progress,
    });
  } catch (error: any) {
    logger.error('Failed to get task status', {
      error: error.message,
      params: req.params,
    });

    // Let error middleware handle the response
    throw error;
  }
});

export default router;
