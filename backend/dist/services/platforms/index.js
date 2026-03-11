"use strict";
/**
 * Platform Distribution Service
 * Orchestrates content publishing to multiple platforms
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlatformDistributionService = void 0;
const adapters_1 = require("./adapters");
const logger_1 = __importDefault(require("../../utils/logger"));
class PlatformDistributionService {
    /**
     * Distribute content to multiple platforms
     */
    async distributeToPlatforms(task) {
        const results = [];
        logger_1.default.info('Starting platform distribution', {
            contentId: task.contentId,
            platforms: task.platforms,
        });
        // Publish to each platform in parallel
        const publishPromises = task.platforms.map(platform => this.publishToSinglePlatform(platform, task.content, task.credentialsMap.get(platform)));
        const publishResults = await Promise.allSettled(publishPromises);
        // Process results
        publishResults.forEach((result, index) => {
            const currentPlatform = task.platforms[index];
            if (result.status === 'fulfilled') {
                results.push(result.value);
                logger_1.default.info(`Successfully published to ${currentPlatform}`, {
                    contentId: task.contentId,
                    platformUrl: result.value.platformUrl,
                });
            }
            else {
                results.push({
                    platform: currentPlatform,
                    success: false,
                    error: result.reason?.message || 'Unknown error',
                });
                logger_1.default.error(`Failed to publish to ${currentPlatform}`, {
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
    async publishToSinglePlatform(platform, content, credentials) {
        try {
            // Create adapter instance
            const adapter = adapters_1.PlatformAdapterFactory.createAdapter(platform, credentials);
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
        }
        catch (error) {
            throw error;
        }
    }
    /**
     * Get content status from multiple platforms
     */
    async getContentStatus(platform, platformPostId, credentials) {
        try {
            const adapter = adapters_1.PlatformAdapterFactory.createAdapter(platform, credentials);
            return await adapter.getContentStatus(platformPostId);
        }
        catch (error) {
            logger_1.default.error(`Failed to get content status from ${platform}`, { error });
            return null;
        }
    }
    /**
     * Delete content from platform
     */
    async deleteContent(platform, platformPostId, credentials) {
        try {
            const adapter = adapters_1.PlatformAdapterFactory.createAdapter(platform, credentials);
            return await adapter.deleteContent(platformPostId);
        }
        catch (error) {
            logger_1.default.error(`Failed to delete content from ${platform}`, { error });
            return false;
        }
    }
}
exports.PlatformDistributionService = PlatformDistributionService;
exports.default = PlatformDistributionService;
