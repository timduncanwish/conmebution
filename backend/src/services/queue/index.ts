/**
 * Bull Queue Setup and Task Progress Management
 * Provides queue configuration and progress tracking for async tasks
 */

import Bull, { Job, Queue } from 'bull';
import config from '../../config';
import logger from '../../utils/logger';
import { TaskProgress, TaskStatus } from '../../types/task.types';

/**
 * Text generation queue
 */
export const textGenerationQueue: Queue = new Bull('text-generation', {
  redis: {
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password || undefined,
    maxRetriesPerRequest: 3,
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

/**
 * Task progress store
 * In-memory storage for task progress (will be replaced with database in Task 8)
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
 * Setup queue event logging
 */
textGenerationQueue.on('completed', (job: Job, result: any) => {
  logger.info('Text generation job completed', {
    jobId: job.id,
    taskId: job.data.taskId,
    result,
  });
});

textGenerationQueue.on('failed', (job: Job | undefined, error: Error) => {
  logger.error('Text generation job failed', {
    jobId: job?.id,
    taskId: job?.data.taskId,
    error: error.message,
  });

  if (job?.data.taskId) {
    // Update task progress to failed
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

textGenerationQueue.on('progress', (job: Job, progress: number) => {
  logger.info('Text generation job progress', {
    jobId: job.id,
    taskId: job.data.taskId,
    progress,
  });
});

/**
 * Auto-cleanup interval
 * Removes tasks older than 1 hour, runs every hour
 */
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
const TASK_AGE_MS = 60 * 60 * 1000; // 1 hour

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

logger.info('Bull queue system initialized', {
  queueName: 'text-generation',
  redisHost: config.redis.host,
  redisPort: config.redis.port,
});
