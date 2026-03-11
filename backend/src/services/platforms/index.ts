/**
 * Platform Distribution Service
 * Orchestrates content publishing to multiple platforms
 */

import { PlatformAdapterFactory, PlatformType } from './adapters';
import { PlatformCredentials, PlatformContent } from './adapters/base.adapter';
import logger from '../../utils/logger';

export interface DistributionTask {
  contentId: string;
  platforms: PlatformType[];
  content: PlatformContent;
  credentialsMap: Map<PlatformType, PlatformCredentials>;
}

export interface DistributionResult {
  platform: PlatformType;
  success: boolean;
  platformPostId?: string;
  platformUrl?: string;
  error?: string;
  publishedAt?: Date;
}

export class PlatformDistributionService {
  /**
   * Distribute content to multiple platforms
   */
  async distributeToPlatforms(task: DistributionTask): Promise<DistributionResult[]> {
    const results: DistributionResult[] = [];

    logger.info('Starting platform distribution', {
      contentId: task.contentId,
      platforms: task.platforms,
    });

    // Publish to each platform in parallel
    const publishPromises = task.platforms.map(platform =>
      this.publishToSinglePlatform(platform, task.content, task.credentialsMap.get(platform)!)
    );

    const publishResults = await Promise.allSettled(publishPromises);

    // Process results
    publishResults.forEach((result, index) => {
      const currentPlatform = task.platforms[index];

      if (result.status === 'fulfilled') {
        results.push(result.value);
        logger.info(`Successfully published to ${currentPlatform}`, {
          contentId: task.contentId,
          platformUrl: result.value.platformUrl,
        });
      } else {
        results.push({
          platform: currentPlatform,
          success: false,
          error: result.reason?.message || 'Unknown error',
        });
        logger.error(`Failed to publish to ${currentPlatform}`, {
          contentId: task.contentId,
          error: result.reason,
        });
      }
    });

    return results;
  }

  /**
   * Publish content to a single platform
   */
  private async publishToSinglePlatform(
    platform: PlatformType,
    content: PlatformContent,
    credentials: PlatformCredentials
  ): Promise<DistributionResult> {
    try {
      // Create adapter instance
      const adapter = PlatformAdapterFactory.createAdapter(platform, credentials);

      // Validate credentials
      const isValid = await adapter.validateCredentials();
      if (!isValid) {
        throw new Error('Invalid platform credentials');
      }

      // Publish content
      const adapterResult = await adapter.publishContent(content);

      return {
        platform,
        success: adapterResult.success,
        platformPostId: adapterResult.platformPostId,
        platformUrl: adapterResult.platformUrl,
        error: adapterResult.error,
        publishedAt: adapterResult.publishedAt,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get content status from multiple platforms
   */
  async getContentStatus(
    platform: PlatformType,
    platformPostId: string,
    credentials: PlatformCredentials
  ) {
    try {
      const adapter = PlatformAdapterFactory.createAdapter(platform, credentials);
      return await adapter.getContentStatus(platformPostId);
    } catch (error) {
      logger.error(`Failed to get content status from ${platform}`, { error });
      return null;
    }
  }

  /**
   * Delete content from platform
   */
  async deleteContent(
    platform: PlatformType,
    platformPostId: string,
    credentials: PlatformCredentials
  ): Promise<boolean> {
    try {
      const adapter = PlatformAdapterFactory.createAdapter(platform, credentials);
      return await adapter.deleteContent(platformPostId);
    } catch (error) {
      logger.error(`Failed to delete content from ${platform}`, { error });
      return false;
    }
  }
}

export default PlatformDistributionService;
