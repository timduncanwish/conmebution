/**
 * Bull Queue Setup and Task Progress Management
 * Provides queue configuration and progress tracking for async tasks
 *
 * Queue initialization is lazy — Redis connection is only attempted
 * when the first job is added. This allows the server to start
 * without Redis (sync endpoints still work).
 */

import config from '../../config';
import logger from '../../utils/logger';
import { TaskProgress, TaskStatus } from '../../types/task.types';

// Lazy-loaded queue reference
let _textGenerationQueue: any = null;
let _queueAvailable: boolean | null = null;

/**
 * Get or create the text generation queue.
 * Returns null if Redis is unavailable.
 */
async function getQueue(): Promise<any> {
  if (_queueAvailable === false) return null;
  if (_textGenerationQueue) return _textGenerationQueue;

  try {
    const Bull = (await import('bull')).default;
    _textGenerationQueue = new Bull('text-generation', {
      redis: {
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password || undefined,
        maxRetriesPerRequest: 3,
        connectTimeout: 3000,
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    });

    // Quick connectivity check
    await _textGenerationQueue.isReady();

    setupQueueEvents(_textGenerationQueue);

    _queueAvailable = true;
    logger.info('Bull queue system initialized', {
      queueName: 'text-generation',
      redisHost: config.redis.host,
      redisPort: config.redis.port,
    });

    // Import processor module — it self-registers via side effect
    try {
      await import('./processors/text-generation.processor');
    } catch (err) {
      logger.warn('Failed to load text generation processor', {
        error: err instanceof Error ? err.message : String(err),
      });
    }

    return _textGenerationQueue;
  } catch (error) {
    _queueAvailable = false;
    logger.warn('Redis unavailable — async job queue disabled. Sync endpoints still work.', {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Setup queue event logging
 */
function setupQueueEvents(queue: any): void {
  queue.on('completed', (job: any, result: any) => {
    logger.info('Text generation job completed', {
      jobId: job.id,
      taskId: job.data.taskId,
      result,
    });
  });

  queue.on('failed', (job: any | undefined, error: Error) => {
    logger.error('Text generation job failed', {
      jobId: job?.id,
      taskId: job?.data.taskId,
      error: error.message,
    });

    if (job?.data.taskId) {
      updateTaskProgress(job.data.taskId, {
        status: TaskStatus.FAILED,
        currentStep: 'Failed',
        error: {
          code: 'JOB_FAILED',
          message: error.message,
        },
        completedAt: new Date(),
      });
    }
  });

  queue.on('progress', (job: any, progress: number) => {
    logger.info('Text generation job progress', {
      jobId: job.id,
      taskId: job.data.taskId,
      progress,
    });
  });
}

/**
 * Exported queue proxy for backward compatibility.
 * Usage: `const queue = await textGenerationQueue;`
 * Will be null if Redis is unavailable.
 */
export const textGenerationQueue = new Proxy({} as any, {
  get(_, prop) {
    // When code does `await textGenerationQueue.add(...)`,
    // it first awaits the proxy target. We return the real queue.
    if (prop === 'then') {
      return (resolve: any) => resolve(getQueue());
    }
    return undefined;
  },
});

/**
 * Task progress store (in-memory)
 */
export const taskProgressStore = new Map<string, TaskProgress>();

/**
 * Update task progress in store
 */
export const updateTaskProgress = (
  taskId: string,
  updates: Partial<TaskProgress>
): void => {
  const current = taskProgressStore.get(taskId) || {
    taskId,
    status: TaskStatus.PENDING,
    progress: 0,
    currentStep: '',
    startedAt: new Date(),
  };

  const updated: TaskProgress = {
    ...current,
    ...updates,
  };

  taskProgressStore.set(taskId, updated);

  logger.info('Task progress updated', {
    taskId,
    status: updated.status,
    progress: updated.progress,
    currentStep: updated.currentStep,
  });
};

/**
 * Get task progress from store
 */
export const getTaskProgress = (taskId: string): TaskProgress | undefined => {
  return taskProgressStore.get(taskId);
};

/**
 * Auto-cleanup interval
 * Removes tasks older than 1 hour, runs every hour
 */
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000;
const TASK_AGE_MS = 60 * 60 * 1000;

setInterval(() => {
  const now = Date.now();
  let cleanedCount = 0;

  for (const [taskId, progress] of taskProgressStore.entries()) {
    const taskAge = now - new Date(progress.startedAt).getTime();

    if (taskAge > TASK_AGE_MS) {
      taskProgressStore.delete(taskId);
      cleanedCount++;
    }
  }

  if (cleanedCount > 0) {
    logger.info('Task progress cleanup completed', {
      cleanedCount,
      remainingTasks: taskProgressStore.size,
    });
  }
}, CLEANUP_INTERVAL_MS);

logger.info('Queue module loaded (lazy initialization — Redis connection deferred)');
