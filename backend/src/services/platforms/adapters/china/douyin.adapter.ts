/**
 * 抖音 (Douyin) Platform Adapter
 * Implements content publishing to Douyin platform
 */

import axios, { AxiosInstance } from 'axios';
import {
  BasePlatformAdapter,
  PlatformCredentials,
  PlatformContent,
  PublishResult,
  PlatformConfig,
} from '../base.adapter';

export interface DouyinCredentials extends PlatformCredentials {
  openId?: string;
  appId?: string;
}

export interface DouyinUploadResult {
  item_id: string;
  share_url: string;
}

/**
 * Douyin API Configuration
 */
const DOUYIN_CONFIG: PlatformConfig = {
  platformCode: 'douyin',
  platformName: '抖音 (Douyin)',
  maxTitleLength: 100, // Captions
  maxDescriptionLength: 3000,
  supportedMediaTypes: ['video'],
  maxMediaCount: 1,
  maxVideoDuration: 900, // 15 minutes
  maxVideoSize: 500 * 1024 * 1024, // 500MB
};

/**
 * Douyin API Endpoints
 */
const DOUYIN_API = {
  base: 'https://open.douyin.com',
  upload: 'https://developer.toutiao.com/api/douyin/v1/video/upload/',
  publish: 'https://developer.toutiao.com/api/douyin/v1/video/publish/',
  videoInfo: 'https://developer.toutiao.com/api/douyin/v1/video/query/',
};

export class DouyinAdapter extends BasePlatformAdapter {
  private apiClient: AxiosInstance;
  private douyinCredentials: DouyinCredentials;

  constructor(credentials: DouyinCredentials) {
    super(credentials, DOUYIN_CONFIG);
    this.douyinCredentials = credentials;

    // Create axios instance with Douyin-specific config
    this.apiClient = axios.create({
      baseURL: DOUYIN_API.base,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for authentication
    this.apiClient.interceptors.request.use((config) => {
      config.headers['access-token'] = this.credentials.accessToken;
      return config;
    });
  }

  /**
   * Validate Douyin credentials
   */
  async validateCredentials(): Promise<boolean> {
    try {
      const response = await this.apiClient.get('/oauth2/userinfo/', {
        params: {
          open_id: this.douyinCredentials.openId,
        },
      });

      return response.data.data.error_code === 0;
    } catch (error) {
      console.error('Failed to validate Douyin credentials:', error);
      return false;
    }
  }

  /**
   * Refresh Douyin credentials
   */
  async refreshCredentials(): Promise<void> {
    try {
      if (!this.douyinCredentials.refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await this.apiClient.post('/oauth2/access_token/', {
        client_key: this.douyinCredentials.appId,
        grant_type: 'refresh_token',
        refresh_token: this.douyinCredentials.refreshToken,
      });

      if (response.data.data.error_code !== 0) {
        throw new Error('Failed to refresh access token');
      }

      const { access_token, refresh_token, expires_in } = response.data.data;

      this.credentials.accessToken = access_token;
      this.credentials.refreshToken = refresh_token;

      // Calculate expiration time
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + expires_in);
      this.credentials.expiresAt = expiresAt;
    } catch (error) {
      console.error('Failed to refresh Douyin credentials:', error);
      throw new Error('Failed to refresh access token');
    }
  }

  /**
   * Upload video to Douyin
   */
  async uploadMedia(mediaFile: Buffer | string, mediaType: 'image' | 'video'): Promise<string> {
    await this.ensureValidCredentials();

    if (mediaType !== 'video') {
      throw new Error('Douyin only supports video uploads');
    }

    try {
      // Step 1: Get upload URL
      const uploadUrlResponse = await this.apiClient.post('/video/upload/', {
        video: {
          video_type: 'mp4',
          video_size: Buffer.byteLength(mediaFile as Buffer),
        },
      });

      if (uploadUrlResponse.data.data.error_code !== 0) {
        throw new Error(`Failed to get upload URL: ${uploadUrlResponse.data.data.description}`);
      }

      const { upload_url } = uploadUrlResponse.data.data;

      // Step 2: Upload video file
      const uploadFormData = new FormData();
      uploadFormData.append('video', mediaFile);

      const uploadResponse = await axios.post(upload_url, uploadFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (uploadResponse.data.data.error_code !== 0) {
        throw new Error(`Failed to upload video: ${uploadResponse.data.data.description}`);
      }

      return uploadResponse.data.data.video_id;
    } catch (error) {
      console.error('Failed to upload media to Douyin:', error);
      throw error;
    }
  }

  /**
   * Publish content to Douyin
   */
  async publishContent(content: PlatformContent): Promise<PublishResult> {
    await this.ensureValidCredentials();

    try {
      // Adapt content to Douyin specifications
      const adaptedContent = this.adaptContent(content);

      // Validate content
      this.validateContent(adaptedContent);

      // Upload video
      const videoId = await this.uploadMedia(adaptedContent.mediaUrls[0], 'video');

      // Publish video
      const response = await this.apiClient.post('/video/publish/', {
        video_id: videoId,
        text: adaptedContent.description,
        title: adaptedContent.title,
        tags: adaptedContent.tags || [],
      });

      if (response.data.data.error_code !== 0) {
        return {
          success: false,
          error: response.data.data.description || 'Failed to publish to Douyin',
        };
      }

      const { item_id, share_url } = response.data.data;

      return {
        success: true,
        platformPostId: item_id,
        platformUrl: share_url,
        publishedAt: new Date(),
      };
    } catch (error) {
      console.error('Failed to publish content to Douyin:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Delete content from Douyin
   */
  async deleteContent(platformPostId: string): Promise<boolean> {
    await this.ensureValidCredentials();

    try {
      const response = await this.apiClient.post('/video/delete/', {
        item_id: platformPostId,
      });

      return response.data.data.error_code === 0;
    } catch (error) {
      console.error('Failed to delete content from Douyin:', error);
      return false;
    }
  }

  /**
   * Get content status/analytics
   */
  async getContentStatus(platformPostId: string): Promise<{
    views: number;
    likes: number;
    comments: number;
    shares: number;
  }> {
    try {
      const response = await this.apiClient.get('/video/query/', {
        params: {
          item_id: platformPostId,
        },
      });

      if (response.data.data.error_code !== 0) {
        throw new Error('Failed to get video status');
      }

      const stats = response.data.data.statistics;

      return {
        views: stats.view_count,
        likes: stats.digg_count,
        comments: stats.comment_count,
        shares: stats.share_count,
      };
    } catch (error) {
      console.error('Failed to get content status from Douyin:', error);
      return {
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0,
      };
    }
  }
}

export default DouyinAdapter;
