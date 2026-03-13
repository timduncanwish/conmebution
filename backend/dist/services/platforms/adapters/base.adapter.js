"use strict";
/**
 * Base Platform Adapter Interface
 * Defines the contract that all platform adapters must implement
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BasePlatformAdapter = void 0;
/**
 * Abstract base class for platform adapters
 */
class BasePlatformAdapter {
    constructor(credentials, config) {
        this.credentials = credentials;
        this.config = config;
    }
    /**
     * Get platform code
     */
    getPlatformCode() {
        return this.config.platformCode;
    }
    /**
     * Get platform configuration
     */
    getConfig() {
        return this.config;
    }
    /**
     * Adapt content to platform specifications
     * Truncates or formats content to fit platform limits
     */
    adaptContent(content) {
        let { title, description } = content;
        // Truncate title if needed
        if (title.length > this.config.maxTitleLength) {
            title = title.substring(0, this.config.maxTitleLength - 3) + '...';
        }
        // Truncate description if needed
        if (description.length > this.config.maxDescriptionLength) {
            description = description.substring(0, this.config.maxDescriptionLength - 3) + '...';
        }
        // Limit media count
        const limitedMediaUrls = content.mediaUrls.slice(0, this.config.maxMediaCount);
        return {
            ...content,
            title,
            description,
            mediaUrls: limitedMediaUrls,
        };
    }
    /**
     * Validate content against platform requirements
     */
    validateContent(content) {
        if (!content.title || content.title.trim().length === 0) {
            throw new Error('Title is required');
        }
        if (!content.description || content.description.trim().length === 0) {
            throw new Error('Description is required');
        }
        if (content.mediaUrls.length === 0) {
            throw new Error('At least one media file is required');
        }
        if (content.mediaUrls.length > this.config.maxMediaCount) {
            throw new Error(`Maximum ${this.config.maxMediaCount} media files allowed, got ${content.mediaUrls.length}`);
        }
    }
    /**
     * Check if credentials are expired
     */
    isCredentialsExpired() {
        if (!this.credentials.expiresAt) {
            return false;
        }
        return new Date() > this.credentials.expiresAt;
    }
    /**
     * Ensure credentials are valid before operations
     */
    async ensureValidCredentials() {
        if (this.isCredentialsExpired()) {
            await this.refreshCredentials();
        }
    }
}
exports.BasePlatformAdapter = BasePlatformAdapter;
