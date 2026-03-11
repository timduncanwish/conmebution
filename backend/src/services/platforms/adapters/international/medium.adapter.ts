/**
 * Medium Platform Adapter
 * Implements content publishing to Medium using Medium API
 */

import axios, { AxiosInstance } from 'axios';
import {
  BasePlatformAdapter,
  PlatformCredentials,
  PlatformContent,
  PublishResult,
  PlatformConfig,
} from '../base.adapter';

export interface MediumCredentials extends PlatformCredentials {
  accessToken: string;
  userId?: string;
  username?: string;
}

export interface MediumPostResult {
  id: string;
  title: string;
  authorId: string;
  tags: string[];
  url: string;
  publishedAt: string;
}

/**
 * Medium API Configuration
 */
const MEDIUM_CONFIG: PlatformConfig = {
  platformCode: 'medium',
  platformName: 'Medium',
  maxTitleLength: 100,
  maxDescriptionLength: 10000,
  supportedMediaTypes: ['text'],
  maxMediaCount: 0,
};

/**
 * Medium API Endpoints
 */
const MEDIUM_API = {
  base: 'https://api.medium.com/v1',
  users: 'https://api.medium.com/v1/users',
};

export class MediumAdapter extends BasePlatformAdapter {
  private apiClient: AxiosInstance;
  private mediumCredentials: MediumCredentials;
  private userId?: string;

  constructor(credentials: MediumCredentials) {
    super(credentials, MEDIUM_CONFIG);
    this.mediumCredentials = credentials;

    // Create axios instance for Medium API
    this.apiClient = axios.create({
      baseURL: MEDIUM_API.base,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.credentials.accessToken}`,
      },
      timeout: 30000,
    });
  }

  /**
   * Get user ID from access token
   */
  private async getUserId(): Promise<string> {
    if (this.userId) {
      return this.userId;
    }

    try {
      const response = await this.apiClient.get('/me');
      if (response.data && response.data.data) {
        this.userId = response.data.data.id || '';
        return this.userId!;
      } else {
        throw new Error('Failed to get user ID');
      }
    } catch (error: any) {
      throw new Error(`Failed to get user ID: ${error.message}`);
    }
  }

  /**
   * Validate Medium credentials
   */
  async validateCredentials(): Promise<boolean> {
    try {
      await this.getUserId();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Refresh access token
   */
  async refreshCredentials(): Promise<void> {
    // Medium tokens are long-lived (60 days), refresh is not typically needed
    throw new Error('Token refresh not supported. Please re-authenticate.');
  }

  /**
   * Upload media to Medium
   * Medium doesn't support direct media upload through API
   */
  async uploadMedia(mediaFile: Buffer | string, mediaType: 'image' | 'video'): Promise<string> {
    throw new Error('Medium API does not support direct media upload. Media must be hosted externally and referenced in content.');
  }

  /**
   * Publish content to Medium
   * @param content - Content to publish
   * @returns Publish result with post ID
   */
  async publishContent(content: PlatformContent): Promise<PublishResult> {
    await this.ensureValidCredentials();

    try {
      // Validate content
      if (!content.title || !content.description) {
        throw new Error('Title and description are required for Medium posts');
      }

      const userId = await this.getUserId();

      // Medium requires content in HTML format
      const htmlContent = this.formatAsMediumPost(content);

      const postData = {
        title: content.title,
        contentFormat: 'html',
        content: htmlContent,
        tags: content.tags || [],
        publishStatus: content.visibility === 'public' ? 'public' : 'draft',
      };

      const response = await this.apiClient.post(`/users/${userId}/posts`, postData);

      if (response.data && response.data.data) {
        const post = response.data.data;

        return {
          success: true,
          platformPostId: post.id,
          platformUrl: post.url,
          publishedAt: new Date(post.publishedAt),
        };
      } else {
        throw new Error('Invalid post response');
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Format content as Medium post (HTML)
   */
  private formatAsMediumPost(content: PlatformContent): string {
    // Convert description to HTML format
    let htmlContent = content.description;

    // Convert line breaks to <p> tags
    const paragraphs = htmlContent.split('\n').filter(p => p.trim());
    htmlContent = paragraphs.map(p => `<p>${p.trim()}</p>`).join('');

    // Add title if not in description
    if (!htmlContent.includes(content.title)) {
      htmlContent = `<h1>${content.title}</h1>\n${htmlContent}`;
    }

    return htmlContent;
  }

  /**
   * Delete content from Medium
   * @param platformPostId - Platform-specific post ID
   * @returns Success status
   */
  async deleteContent(platformPostId: string): Promise<boolean> {
    await this.ensureValidCredentials();

    try {
      const userId = await this.getUserId();
      await this.apiClient.delete(`/users/${userId}/posts/${platformPostId}`);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get content status/analytics
   * @param platformPostId - Platform-specific post ID
   * @returns Analytics data
   */
  async getContentStatus(platformPostId: string): Promise<{
    views: number;
    likes: number;
    comments: number;
    shares: number;
  }> {
    await this.ensureValidCredentials();

    try {
      const userId = await this.getUserId();
      const response = await this.apiClient.get(`/users/${userId}/posts/${platformPostId}`);

      if (response.data && response.data.data) {
        const post = response.data.data;
        return {
          views: post.views || 0,
          likes: post.claps || 0,
          comments: post.voters || 0,
          shares: 0, // Medium doesn't have share count
        };
      } else {
        return {
          views: 0,
          likes: 0,
          comments: 0,
          shares: 0,
        };
      }
    } catch (error) {
      return {
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0,
      };
    }
  }

  /**
   * Get user publications
   */
  async getUserPublications(): Promise<any[]> {
    await this.ensureValidCredentials();

    try {
      const userId = await this.getUserId();
      const response = await this.apiClient.get(`/users/${userId}/publications`);

      if (response.data && response.data.data) {
        return response.data.data;
      } else {
        return [];
      }
    } catch (error) {
      return [];
    }
  }

  /**
   * Create a new publication
   */
  async createPublication(name: string, description: string): Promise<any> {
    await this.ensureValidCredentials();

    try {
      const response = await this.apiClient.post('/users/me/publications', {
        name,
        description,
      });

      if (response.data && response.data.data) {
        return response.data.data;
      } else {
        throw new Error('Failed to create publication');
      }
    } catch (error: any) {
      throw new Error(`Failed to create publication: ${error.message}`);
    }
  }
}
