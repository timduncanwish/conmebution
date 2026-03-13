"use strict";
/**
 * Multi-Platform Batch Publishing Service
 * Handles publishing content to multiple platforms simultaneously
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BatchPublisherService = void 0;
const adapters_1 = require("./adapters");
class BatchPublisherService {
    constructor() {
        this.activeTasks = new Map();
        this.taskHistory = [];
    }
    /**
     * Create a new batch publishing task
     */
    async createBatchPublishTask(content, platforms, credentials, options = {}) {
        const taskId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const task = {
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
    async executeBatchPublish(taskId, options) {
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
            }
            else {
                // Publish sequentially
                await this.publishSequential(task, retryFailed, maxRetries, retryDelay);
            }
            // Determine final status
            const allResults = Array.from(task.results.values());
            const successCount = allResults.filter(r => r.success).length;
            const failCount = allResults.filter(r => !r.success).length;
            if (successCount === task.platforms.length) {
                task.status = 'completed';
            }
            else if (failCount === task.platforms.length) {
                task.status = 'failed';
            }
            else {
                task.status = 'partial';
            }
            task.endTime = new Date();
        }
        catch (error) {
            task.status = 'failed';
            task.endTime = new Date();
            console.error(`Batch publish task ${taskId} error:`, error);
        }
        finally {
            // Move to history
            this.taskHistory.push(task);
            this.activeTasks.delete(taskId);
        }
    }
    /**
     * Publish to platforms in parallel
     */
    async publishParallel(task, maxConcurrency, retryFailed, maxRetries, retryDelay) {
        const { platforms, credentials, content } = task;
        // Create publish promises
        const publishPromises = platforms.map(async (platform) => {
            for (let attempt = 0; attempt <= maxRetries; attempt++) {
                try {
                    const result = await this.publishToPlatform(platform, content, credentials.get(platform));
                    task.results.set(platform, result);
                    task.progress.completed++;
                    if (result.success) {
                        return; // Success, no retry needed
                    }
                    else if (attempt < maxRetries && retryFailed) {
                        // Wait before retry
                        await this.delay(retryDelay);
                    }
                    else {
                        // Final attempt failed
                        task.progress.failed++;
                        return;
                    }
                }
                catch (error) {
                    if (attempt < maxRetries && retryFailed) {
                        await this.delay(retryDelay);
                    }
                    else {
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
    async publishSequential(task, retryFailed, maxRetries, retryDelay) {
        const { platforms, credentials, content } = task;
        for (const platform of platforms) {
            for (let attempt = 0; attempt <= maxRetries; attempt++) {
                try {
                    const result = await this.publishToPlatform(platform, content, credentials.get(platform));
                    task.results.set(platform, result);
                    task.progress.completed++;
                    if (result.success) {
                        break; // Success, move to next platform
                    }
                    else if (attempt < maxRetries && retryFailed) {
                        await this.delay(retryDelay);
                    }
                    else {
                        // All attempts failed
                        task.progress.failed++;
                        break;
                    }
                }
                catch (error) {
                    if (attempt < maxRetries && retryFailed) {
                        await this.delay(retryDelay);
                    }
                    else {
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
    async publishToPlatform(platform, content, credentials) {
        try {
            const adapter = adapters_1.PlatformAdapterFactory.createAdapter(platform, credentials);
            const result = await adapter.publishContent(content);
            return {
                platform,
                success: result.success,
                platformPostId: result.platformPostId,
                platformUrl: result.platformUrl,
                error: result.error,
                publishedAt: result.publishedAt,
            };
        }
        catch (error) {
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
    async executeWithConcurrency(promises, maxConcurrency) {
        let index = 0;
        const executing = [];
        const enqueue = async () => {
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
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
     * Get task status
     */
    getTaskStatus(taskId) {
        return this.activeTasks.get(taskId) || this.taskHistory.find(t => t.id === taskId);
    }
    /**
     * Get all active tasks
     */
    getActiveTasks() {
        return Array.from(this.activeTasks.values());
    }
    /**
     * Get task history
     */
    getTaskHistory(limit) {
        if (limit) {
            return this.taskHistory.slice(-limit);
        }
        return [...this.taskHistory];
    }
    /**
     * Cancel a task
     */
    cancelTask(taskId) {
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
    getStatistics() {
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
    clearHistory(olderThan) {
        if (olderThan) {
            this.taskHistory = this.taskHistory.filter(t => t.endTime && t.endTime > olderThan);
        }
        else {
            this.taskHistory = [];
        }
    }
    /**
     * Get platform success rates
     */
    getPlatformSuccessRates() {
        const platformStats = new Map();
        // Collect statistics from all tasks
        [...this.activeTasks.values(), ...this.taskHistory].forEach(task => {
            task.results.forEach((result, platform) => {
                if (!platformStats.has(platform)) {
                    platformStats.set(platform, { success: 0, failed: 0 });
                }
                const stats = platformStats.get(platform);
                if (result.success) {
                    stats.success++;
                }
                else {
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
exports.BatchPublisherService = BatchPublisherService;
exports.default = BatchPublisherService;
