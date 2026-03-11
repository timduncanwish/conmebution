"use strict";
/**
 * Bull Queue Setup and Task Progress Management
 * Provides queue configuration and progress tracking for async tasks
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTaskProgress = exports.updateTaskProgress = exports.taskProgressStore = exports.textGenerationQueue = void 0;
const bull_1 = __importDefault(require("bull"));
const config_1 = __importDefault(require("../../config"));
const logger_1 = __importDefault(require("../../utils/logger"));
const task_types_1 = require("../../types/task.types");
/**
 * Text generation queue
 */
exports.textGenerationQueue = new bull_1.default('text-generation', {
    redis: {
        host: config_1.default.redis.host,
        port: config_1.default.redis.port,
        password: config_1.default.redis.password || undefined,
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
exports.taskProgressStore = new Map();
/**
 * Update task progress in store
 */
const updateTaskProgress = (taskId, updates) => {
    const current = exports.taskProgressStore.get(taskId) || {
        taskId,
        status: task_types_1.TaskStatus.PENDING,
        progress: 0,
        currentStep: '',
        startedAt: new Date(),
    };
    const updated = {
        ...current,
        ...updates,
    };
    exports.taskProgressStore.set(taskId, updated);
    logger_1.default.info('Task progress updated', {
        taskId,
        status: updated.status,
        progress: updated.progress,
        currentStep: updated.currentStep,
    });
};
exports.updateTaskProgress = updateTaskProgress;
/**
 * Get task progress from store
 */
const getTaskProgress = (taskId) => {
    return exports.taskProgressStore.get(taskId);
};
exports.getTaskProgress = getTaskProgress;
/**
 * Setup queue event logging
 */
exports.textGenerationQueue.on('completed', (job, result) => {
    logger_1.default.info('Text generation job completed', {
        jobId: job.id,
        taskId: job.data.taskId,
        result,
    });
});
exports.textGenerationQueue.on('failed', (job, error) => {
    logger_1.default.error('Text generation job failed', {
        jobId: job?.id,
        taskId: job?.data.taskId,
        error: error.message,
    });
    if (job?.data.taskId) {
        // Update task progress to failed
        (0, exports.updateTaskProgress)(job.data.taskId, {
            status: task_types_1.TaskStatus.FAILED,
            currentStep: 'Failed',
            error: {
                code: 'JOB_FAILED',
                message: error.message,
            },
            completedAt: new Date(),
        });
    }
});
exports.textGenerationQueue.on('progress', (job, progress) => {
    logger_1.default.info('Text generation job progress', {
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
    for (const [taskId, progress] of exports.taskProgressStore.entries()) {
        const taskAge = now - new Date(progress.startedAt).getTime();
        if (taskAge > TASK_AGE_MS) {
            exports.taskProgressStore.delete(taskId);
            cleanedCount++;
        }
    }
    if (cleanedCount > 0) {
        logger_1.default.info('Task progress cleanup completed', {
            cleanedCount,
            remainingTasks: exports.taskProgressStore.size,
        });
    }
}, CLEANUP_INTERVAL_MS);
logger_1.default.info('Bull queue system initialized', {
    queueName: 'text-generation',
    redisHost: config_1.default.redis.host,
    redisPort: config_1.default.redis.port,
});
