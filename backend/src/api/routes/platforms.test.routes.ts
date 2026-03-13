/**
 * Platform Publishing Test API Routes
 * 用于测试平台发布功能的API端点
 */

import { Router, Request, Response } from 'express';
import { PlatformAdapterFactory, createMockCredentials } from '../../services/platforms/adapters';
import logger from '../../utils/logger';

const router = Router();

/**
 * POST /api/platforms/test/publish
 * Test single platform publishing with mock credentials
 */
router.post('/publish', async (req: Request, res: Response) => {
  try {
    const { platform, content, accountName } = req.body;

    // Validate required fields
    if (!platform) {
      return res.status(400).json({
        success: false,
        error: 'Platform is required'
      });
    }

    if (!content || !content.title || !content.description) {
      return res.status(400).json({
        success: false,
        error: 'Content title and description are required'
      });
    }

    logger.info('Test publishing requested', {
      platform,
      contentTitle: content.title,
      accountName
    });

    // Create mock credentials for the platform
    const credentials = createMockCredentials(platform, accountName);

    // Create platform adapter with mock mode
    const adapter = PlatformAdapterFactory.createAdapter(platform, credentials, true);

    // Validate credentials
    const isValid = await adapter.validateCredentials();
    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: 'Credential validation failed'
      });
    }

    // Publish content
    const result = await adapter.publishContent(content);

    logger.info('Test publishing completed', {
      platform,
      success: result.success,
      postId: result.platformPostId
    });

    if (result.success) {
      res.json({
        success: true,
        data: {
          platform,
          platformPostId: result.platformPostId,
          platformUrl: result.platformUrl,
          publishedAt: result.publishedAt,
          accountName: credentials.accountName,
          message: `Successfully published to ${platform}`
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Publishing failed'
      });
    }
  } catch (error: any) {
    logger.error('Test publishing failed', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

/**
 * GET /api/platforms/test/status
 * Get test platform status and statistics
 */
router.get('/status/:platform', async (req: Request, res: Response) => {
  try {
    const { platform } = req.params;
    const platformType = platform as any; // Type assertion for flexibility

    // Create mock credentials
    const credentials = createMockCredentials(platformType);

    // Create adapter
    const adapter = PlatformAdapterFactory.createAdapter(platformType, credentials, true);

    // Get platform config
    const config = adapter.getConfig();

    // Get mock statistics (if supported)
    let stats = null;
    try {
      stats = await (adapter as any).getPlatformStats();
    } catch (e) {
      // Method might not exist, ignore
    }

    res.json({
      success: true,
      data: {
        platform: platformType,
        platformName: config.platformName,
        supportedMediaTypes: config.supportedMediaTypes,
        maxTitleLength: config.maxTitleLength,
        maxDescriptionLength: config.maxDescriptionLength,
        maxMediaCount: config.maxMediaCount,
        statistics: stats,
        credentials: {
          accountId: credentials.accountId,
          accountName: credentials.accountName,
          hasAccessToken: !!credentials.accessToken
        }
      }
    });
  } catch (error: any) {
    logger.error('Get platform status failed', {
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get platform status'
    });
  }
});

/**
 * GET /api/platforms/test/list
 * List all supported platforms with mock credentials
 */
router.get('/list', async (req: Request, res: Response) => {
  try {
    const platforms = PlatformAdapterFactory.getSupportedPlatforms();

    const platformList = platforms.map(platform => {
      const credentials = createMockCredentials(platform);
      const config = PlatformAdapterFactory.getPlatformConfig(platform);

      return {
        platform,
        platformName: config.name,
        category: config.category,
        mediaTypes: config.mediaTypes,
        requiresAuth: config.requiresAuth,
        mockAccount: {
          accountId: credentials.accountId,
          accountName: credentials.accountName
        }
      };
    });

    res.json({
      success: true,
      data: {
        platforms: platformList,
        total: platformList.length,
        domestic: PlatformAdapterFactory.getDomesticPlatforms(),
        international: PlatformAdapterFactory.getInternationalPlatforms()
      }
    });
  } catch (error: any) {
    logger.error('List platforms failed', {
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to list platforms'
    });
  }
});

export default router;
