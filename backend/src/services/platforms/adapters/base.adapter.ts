/**
 * Base Platform Adapter Interface
 * Defines the contract that all platform adapters must implement
 */

export interface PlatformCredentials {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  accountId?: string;
  accountName?: string;
}

export interface PlatformContent {
  title: string;
  description: string;
  mediaUrls: string[];
  tags?: string[];
  category?: string;
  visibility?: 'public' | 'private' | 'unlisted';
}

export interface PublishResult {
  success: boolean;
  platformPostId?: string;
  platformUrl?: string;
  error?: string;
  publishedAt?: Date;
}

export interface PlatformConfig {
  platformCode: string;
  platformName: string;
  maxTitleLength: number;
  maxDescriptionLength: number;
  supportedMediaTypes: ('image' | 'video' | 'text')[];
  maxMediaCount: number;
  maxVideoDuration?: number; // in seconds
  maxImageSize?: number; // in bytes
  maxVideoSize?: number; // in bytes
}

/**
 * Abstract base class for platform adapters
 */
export abstract class BasePlatformAdapter {
  protected credentials: PlatformCredentials;
  protected config: PlatformConfig;

  constructor(credentials: PlatformCredentials, config: PlatformConfig) {
    this.credentials = credentials;
    this.config = config;
  }

  /**
   * Get platform code
   */
  getPlatformCode(): string {
    return this.config.platformCode;
  }

  /**
   * Get platform configuration
   */
  getConfig(): PlatformConfig {
    return this.config;
  }

  /**
   * Validate credentials
   */
  abstract validateCredentials(): Promise<boolean>;

  /**
   * Refresh access token if expired
   */
  abstract refreshCredentials(): Promise<void>;

  /**
   * Upload media to platform
   * @param mediaFile - Buffer or file path
   * @param mediaType - 'image' or 'video'
   * @returns Platform media ID or URL
   */
  abstract uploadMedia(mediaFile: Buffer | string, mediaType: 'image' | 'video'): Promise<string>;

  /**
   * Publish content to platform
   * @param content - Content to publish
   * @returns Publish result with post ID and URL
   */
  abstract publishContent(content: PlatformContent): Promise<PublishResult>;

  /**
   * Delete content from platform
   * @param platformPostId - Platform-specific post ID
   * @returns Success status
   */
  abstract deleteContent(platformPostId: string): Promise<boolean>;

  /**
   * Get content status/analytics
   * @param platformPostId - Platform-specific post ID
   * @returns Analytics data
   */
  abstract getContentStatus(platformPostId: string): Promise<{
    views: number;
    likes: number;
    comments: number;
    shares: number;
  }>;

  /**
   * Adapt content to platform specifications
   * Truncates or formats content to fit platform limits
   */
  protected adaptContent(content: PlatformContent): PlatformContent {
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
  protected validateContent(content: PlatformContent): void {
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
      throw new Error(
        `Maximum ${this.config.maxMediaCount} media files allowed, got ${content.mediaUrls.length}`
      );
    }
  }

  /**
   * Check if credentials are expired
   */
  protected isCredentialsExpired(): boolean {
    if (!this.credentials.expiresAt) {
      return false;
    }
    return new Date() > this.credentials.expiresAt;
  }

  /**
   * Ensure credentials are valid before operations
   */
  protected async ensureValidCredentials(): Promise<void> {
    if (this.isCredentialsExpired()) {
      await this.refreshCredentials();
    }
  }
}
