/**
 * Multi-Platform Batch Publishing API Routes
 * API endpoints for batch publishing to multiple platforms
 */

import { Router } from 'express';
import { BatchPublisherService } from '../../services/platforms/batch-publisher.service';
import { PlatformContent, PlatformCredentials } from '../../services/platforms/adapters/base.adapter';
import { PlatformType } from '../../services/platforms/adapters';

const router = Router();
const batchPublisher = new BatchPublisherService();

/**
 * POST /api/platforms/batch/publish
 * Create and execute a batch publishing task
 */
router.post('/publish', async (req, res) => {
  try {
    const {
      content,
      platforms,
      credentials,
      options = {},
    } = req.body;

    // Validate required fields
    if (!content || !content.title || !content.description) {
      return res.status(400).json({
        success: false,
        error: 'Missing required content fields (title, description)',
      });
    }

    if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one platform must be specified',
      });
    }

    if (!credentials || typeof credentials !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Credentials must be provided for each platform',
      });
    }

    // Convert credentials object to Map
    const credentialsMap = new Map<PlatformType, PlatformCredentials>();
    platforms.forEach((platform: PlatformType) => {
      if (credentials[platform]) {
        credentialsMap.set(platform, credentials[platform]);
      }
    });

    // Create batch publish task
    const taskId = await batchPublisher.createBatchPublishTask(
      content as PlatformContent,
      platforms,
      credentialsMap,
      options
    );

    res.json({
      success: true,
      data: {
        taskId,
        message: 'Batch publishing task created successfully',
        platforms,
        options,
      },
    });
  } catch (error: any) {
    console.error('Error creating batch publish task:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create batch publish task',
    });
  }
});

/**
 * GET /api/platforms/batch/status/:taskId
 * Get status of a batch publishing task
 */
router.get('/status/:taskId', (req, res) => {
  try {
    const { taskId } = req.params;
    const task = batchPublisher.getTaskStatus(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
      });
    }

    // Convert Map to Object for JSON serialization
    const results: any = {};
    task.results.forEach((value, key) => {
      results[key] = value;
    });

    res.json({
      success: true,
      data: {
        id: task.id,
        status: task.status,
        progress: task.progress,
        results,
        startTime: task.startTime,
        endTime: task.endTime,
      },
    });
  } catch (error: any) {
    console.error('Error getting task status:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get task status',
    });
  }
});

/**
 * GET /api/platforms/batch/active
 * Get all active batch publishing tasks
 */
router.get('/active', (req, res) => {
  try {
    const activeTasks = batchPublisher.getActiveTasks();

    // Convert Maps to Objects
    const tasks = activeTasks.map(task => ({
      id: task.id,
      status: task.status,
      platforms: task.platforms,
      progress: task.progress,
      startTime: task.startTime,
    }));

    res.json({
      success: true,
      data: {
        tasks,
        count: tasks.length,
      },
    });
  } catch (error: any) {
    console.error('Error getting active tasks:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get active tasks',
    });
  }
});

/**
 * POST /api/platforms/batch/cancel/:taskId
 * Cancel a batch publishing task
 */
router.post('/cancel/:taskId', (req, res) => {
  try {
    const { taskId } = req.params;
    const cancelled = batchPublisher.cancelTask(taskId);

    if (!cancelled) {
      return res.status(404).json({
        success: false,
        error: 'Task not found or cannot be cancelled',
      });
    }

    res.json({
      success: true,
      data: {
        taskId,
        message: 'Task cancelled successfully',
      },
    });
  } catch (error: any) {
    console.error('Error cancelling task:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to cancel task',
    });
  }
});

/**
 * GET /api/platforms/batch/statistics
 * Get batch publishing statistics
 */
router.get('/statistics', (req, res) => {
  try {
    const stats = batchPublisher.getStatistics();
    const platformRates = batchPublisher.getPlatformSuccessRates();

    // Convert Map to Object
    const platformRatesObj: any = {};
    platformRates.forEach((value, key) => {
      platformRatesObj[key] = value;
    });

    res.json({
      success: true,
      data: {
        ...stats,
        platformRates: platformRatesObj,
      },
    });
  } catch (error: any) {
    console.error('Error getting statistics:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get statistics',
    });
  }
});

/**
 * GET /api/platforms/batch/history
 * Get batch publishing task history
 */
router.get('/history', (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const history = batchPublisher.getTaskHistory(limit);

    // Convert Maps to Objects
    const tasks = history.map(task => {
      const results: any = {};
      task.results.forEach((value, key) => {
        results[key] = value;
      });

      return {
        id: task.id,
        status: task.status,
        platforms: task.platforms,
        progress: task.progress,
        results,
        startTime: task.startTime,
        endTime: task.endTime,
      };
    });

    res.json({
      success: true,
      data: {
        tasks,
        count: tasks.length,
      },
    });
  } catch (error: any) {
    console.error('Error getting history:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get history',
    });
  }
});

/**
 * DELETE /api/platforms/batch/history
 * Clear batch publishing task history
 */
router.delete('/history', (req, res) => {
  try {
    const { olderThan } = req.body;
    const date = olderThan ? new Date(olderThan) : undefined;

    batchPublisher.clearHistory(date);

    res.json({
      success: true,
      data: {
        message: 'History cleared successfully',
      },
    });
  } catch (error: any) {
    console.error('Error clearing history:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to clear history',
    });
  }
});

export default router;
