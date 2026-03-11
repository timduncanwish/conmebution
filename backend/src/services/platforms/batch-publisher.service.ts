/**
 * Multi-Platform Batch Publishing Service
 * Handles publishing content to multiple platforms simultaneously
 */

import { PlatformAdapterFactory, PlatformType } from './adapters';
import { BasePlatformAdapter, PlatformContent, PlatformCredentials } from './adapters/base.adapter';

export interface BatchPublishTask {
  id: string;
  content: PlatformContent;
  platforms: PlatformType[];
  credentials: Map<PlatformType, PlatformCredentials>;
  status: 'pending' | 'publishing' | 'completed' | 'failed' | 'partial';
  results: Map<PlatformType, PublishResult>;
  startTime?: Date;
  endTime?: Date;
  progress: {
    total: number;
    completed: number;
    failed: number;
  };
}

export interface PublishResult {
  platform: PlatformType;
  success: boolean;
  platformPostId?: string;
  platformUrl?: string;
  error?: string;
  publishedAt?: Date;
}

export interface BatchPublishOptions {
  parallel?: boolean; // Whether to publish in parallel
  maxConcurrency?: number; // Max concurrent platforms
  retryFailed?: boolean; // Whether to retry failed platforms
  maxRetries?: number; // Max retry attempts
  retryDelay?: number; // Delay between retries (ms)
}

export class BatchPublisherService {
  private activeTasks: Map<string, BatchPublishTask> = new Map();
  private taskHistory: BatchPublishTask[] = [];

  /**
   * Create a new batch publishing task
   */
  async createBatchPublishTask(
    content: PlatformContent,
    platforms: PlatformType[],
    credentials: Map<PlatformType, PlatformCredentials>,
    options: BatchPublishOptions = {}
  ): Promise<string> {
    const taskId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const task: BatchPublishTask = {
      id: taskId,
      content,
      platforms,
      credentials,
      status: 'pending',
      results: new Map(),
      progress: {
        total: platforms.length,
        completed: 0,
        failed: 0,
      },
    };

    this.activeTasks.set(taskId, task);

    // Start publishing asynchronously
    this.executeBatchPublish(taskId, options).catch(error => {
      console.error(`Batch publish task ${taskId} failed:`, error);
    });

    return taskId;
  }

  /**
   * Execute batch publishing
   */
  private async executeBatchPublish(
    taskId: string,
    options: BatchPublishOptions
  ): Promise<void> {
    const task = this.activeTasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    task.status = 'publishing';
    task.startTime = new Date();

    const { parallel = true, maxConcurrency = 3, retryFailed = true, maxRetries = 3, retryDelay = 5000 } = options;

    try {
      if (parallel) {
        // Publish in parallel with concurrency limit
        await this.publishParallel(task, maxConcurrency, retryFailed, maxRetries, retryDelay);
      } else {
        // Publish sequentially
        await this.publishSequential(task, retryFailed, maxRetries, retryDelay);
      }

      // Determine final status
      const allResults = Array.from(task.results.values());
      const successCount = allResults.filter(r => r.success).length;
      const failCount = allResults.filter(r => !r.success).length;

      if (successCount === task.platforms.length) {
        task.status = 'completed';
      } else if (failCount === task.platforms.length) {
        task.status = 'failed';
      } else {
        task.status = 'partial';
      }

      task.endTime = new Date();
    } catch (error) {
      task.status = 'failed';
      task.endTime = new Date();
      console.error(`Batch publish task ${taskId} error:`, error);
    } finally {
      // Move to history
      this.taskHistory.push(task);
      this.activeTasks.delete(taskId);
    }
  }

  /**
   * Publish to platforms in parallel
   */
  private async publishParallel(
    task: BatchPublishTask,
    maxConcurrency: number,
    retryFailed: boolean,
    maxRetries: number,
    retryDelay: number
  ): Promise<void> {
    const { platforms, credentials, content } = task;

    // Create publish promises
    const publishPromises = platforms.map(async (platform) => {
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const result = await this.publishToPlatform(platform, content, credentials.get(platform)!);
          task.results.set(platform, result);
          task.progress.completed++;

          if (result.success) {
            return; // Success, no retry needed
          } else if (attempt < maxRetries && retryFailed) {
            // Wait before retry
            await this.delay(retryDelay);
          } else {
            // Final attempt failed
            task.progress.failed++;
            return;
          }
        } catch (error: any) {
          if (attempt < maxRetries && retryFailed) {
            await this.delay(retryDelay);
          } else {
            // All attempts failed
            task.results.set(platform, {
              platform,
              success: false,
              error: error.message || 'Unknown error',
            });
            task.progress.failed++;
            task.progress.completed++;
          }
        }
      }
    });

    // Execute with concurrency limit
    await this.executeWithConcurrency(publishPromises, maxConcurrency);
  }

  /**
   * Publish to platforms sequentially
   */
  private async publishSequential(
    task: BatchPublishTask,
    retryFailed: boolean,
    maxRetries: number,
    retryDelay: number
  ): Promise<void> {
    const { platforms, credentials, content } = task;

    for (const platform of platforms) {
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const result = await this.publishToPlatform(platform, content, credentials.get(platform)!);
          task.results.set(platform, result);
          task.progress.completed++;

          if (result.success) {
            break; // Success, move to next platform
          } else if (attempt < maxRetries && retryFailed) {
            await this.delay(retryDelay);
          } else {
            // All attempts failed
            task.progress.failed++;
            break;
          }
        } catch (error: any) {
          if (attempt < maxRetries && retryFailed) {
            await this.delay(retryDelay);
          } else {
            // All attempts failed
            task.results.set(platform, {
              platform,
              success: false,
              error: error.message || 'Unknown error',
            });
            task.progress.failed++;
            task.progress.completed++;
            break;
          }
        }
      }
    }
  }

  /**
   * Publish content to a single platform
   */
  private async publishToPlatform(
    platform: PlatformType,
    content: PlatformContent,
    credentials: PlatformCredentials
  ): Promise<PublishResult> {
    try {
      const adapter = PlatformAdapterFactory.createAdapter(platform, credentials);
      const result = await adapter.publishContent(content);

      return {
        platform,
        success: result.success,
        platformPostId: result.platformPostId,
        platformUrl: result.platformUrl,
        error: result.error,
        publishedAt: result.publishedAt,
      };
    } catch (error: any) {
      return {
        platform,
        success: false,
        error: error.message || 'Unknown error',
      };
    }
  }

  /**
   * Execute promises with concurrency limit
   */
  private async executeWithConcurrency<T>(
    promises: Promise<T>[],
    maxConcurrency: number
  ): Promise<void> {
    let index = 0;
    const executing: Promise<void>[] = [];

    const enqueue = async (): Promise<void | undefined> => {
      if (index >= promises.length) {
        return;
      }

      const promise = promises[index++];
      const executingPromise = promise.then(() => {
        executing.splice(executing.indexOf(executingPromise), 1);
      });

      executing.push(executingPromise);

      if (executing.length >= maxConcurrency) {
        await Promise.race(executing);
      }

      return enqueue();
    };

    await enqueue();
    await Promise.all(executing);
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get task status
   */
  getTaskStatus(taskId: string): BatchPublishTask | undefined {
    return this.activeTasks.get(taskId) || this.taskHistory.find(t => t.id === taskId);
  }

  /**
   * Get all active tasks
   */
  getActiveTasks(): BatchPublishTask[] {
    return Array.from(this.activeTasks.values());
  }

  /**
   * Get task history
   */
  getTaskHistory(limit?: number): BatchPublishTask[] {
    if (limit) {
      return this.taskHistory.slice(-limit);
    }
    return [...this.taskHistory];
  }

  /**
   * Cancel a task
   */
  cancelTask(taskId: string): boolean {
    const task = this.activeTasks.get(taskId);
    if (task && task.status === 'publishing') {
      task.status = 'failed';
      task.endTime = new Date();
      this.taskHistory.push(task);
      this.activeTasks.delete(taskId);
      return true;
    }
    return false;
  }

  /**
   * Get publishing statistics
   */
  getStatistics(): {
    totalTasks: number;
    activeTasks: number;
    completedTasks: number;
    failedTasks: number;
    partialTasks: number;
    successRate: number;
  } {
    const totalTasks = this.taskHistory.length + this.activeTasks.size;
    const completedTasks = this.taskHistory.filter(t => t.status === 'completed').length;
    const failedTasks = this.taskHistory.filter(t => t.status === 'failed').length;
    const partialTasks = this.taskHistory.filter(t => t.status === 'partial').length;

    return {
      totalTasks,
      activeTasks: this.activeTasks.size,
      completedTasks,
      failedTasks,
      partialTasks,
      successRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
    };
  }

  /**
   * Clear task history
   */
  clearHistory(olderThan?: Date): void {
    if (olderThan) {
      this.taskHistory = this.taskHistory.filter(t =>
        t.endTime && t.endTime > olderThan
      );
    } else {
      this.taskHistory = [];
    }
  }

  /**
   * Get platform success rates
   */
  getPlatformSuccessRates(): Map<PlatformType, { success: number; failed: number; rate: number }> {
    const platformStats = new Map<PlatformType, { success: number; failed: number }>();

    // Collect statistics from all tasks
    [...this.activeTasks.values(), ...this.taskHistory].forEach(task => {
      task.results.forEach((result, platform) => {
        if (!platformStats.has(platform)) {
          platformStats.set(platform, { success: 0, failed: 0 });
        }

        const stats = platformStats.get(platform)!;
        if (result.success) {
          stats.success++;
        } else {
          stats.failed++;
        }
      });
    });

    // Calculate success rates
    const successRates = new Map();
    platformStats.forEach((stats, platform) => {
      const total = stats.success + stats.failed;
      successRates.set(platform, {
        success: stats.success,
        failed: stats.failed,
        rate: total > 0 ? (stats.success / total) * 100 : 0,
      });
    });

    return successRates;
  }
}

export default BatchPublisherService;
