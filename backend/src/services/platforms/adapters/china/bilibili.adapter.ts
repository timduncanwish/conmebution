/**
 * B站 (Bilibili) Platform Adapter
 * Implements content publishing to Bilibili platform
 */

import axios, { AxiosInstance } from 'axios';
import {
  BasePlatformAdapter,
  PlatformCredentials,
  PlatformContent,
  PublishResult,
  PlatformConfig,
} from '../base.adapter';

export interface BilibiliCredentials extends PlatformCredentials {
  mid?: string; // Member ID
}

export interface BilibiliUploadResult {
  bvid: string;
  aid: number;
  title: string;
  desc: string;
}

/**
 * Bilibili API Configuration
 */
const BILIBILI_CONFIG: PlatformConfig = {
  platformCode: 'bilibili',
  platformName: 'B站 (Bilibili)',
  maxTitleLength: 80,
  maxDescriptionLength: 2000,
  supportedMediaTypes: ['video'],
  maxMediaCount: 1,
  maxVideoDuration: 3600, // 1 hour
  maxVideoSize: 4 * 1024 * 1024 * 1024, // 4GB
};

/**
 * Bilibili API Endpoints
 */
const BILIBILI_API = {
  base: 'https://api.bilibili.com',
  upload: 'https://member.bilibili.com/x/vu/web/add',
  uploadPre: 'https://member.bilibili.com/x/vu/web/add/pre',
  videoStatus: 'https://api.bilibili.com/x/web-interface/view',
};

export class BilibiliAdapter extends BasePlatformAdapter {
  private apiClient: AxiosInstance;
  private bilibiliCredentials: BilibiliCredentials;

  constructor(credentials: BilibiliCredentials) {
    super(credentials, BILIBILI_CONFIG);
    this.bilibiliCredentials = credentials;

    // Create axios instance with Bilibili-specific config
    this.apiClient = axios.create({
      baseURL: BILIBILI_API.base,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    // Add request interceptor for authentication
    this.apiClient.interceptors.request.use((config) => {
      config.headers['Authorization'] = `Bearer ${this.credentials.accessToken}`;
      config.headers['Cookie'] = `SESSDATA=${this.credentials.accessToken}`;
      return config;
    });
  }

  /**
   * Validate Bilibili credentials
   */
  async validateCredentials(): Promise<boolean> {
    try {
      const response = await this.apiClient.get('/x/space/acc/info', {
        params: {
          mid: this.bilibiliCredentials.mid,
        },
      });

      return response.data.code === 0;
    } catch (error) {
      console.error('Failed to validate Bilibili credentials:', error);
      return false;
    }
  }

  /**
   * Refresh Bilibili credentials
   * Note: Bilibili tokens typically don't expire quickly
   */
  async refreshCredentials(): Promise<void> {
    // Bilibili SESSDATA tokens are long-lived
    // In production, implement re-authentication flow
    throw new Error('Please re-authenticate with Bilibili');
  }

  /**
   * Upload video to Bilibili
   * Note: This is a simplified implementation
   * Production should use full upload flow with chunked uploads
   */
  async uploadMedia(mediaFile: Buffer | string, mediaType: 'image' | 'video'): Promise<string> {
    await this.ensureValidCredentials();

    if (mediaType !== 'video') {
      throw new Error('Bilibili only supports video uploads');
    }

    try {
      // Step 1: Get upload URL and parameters
      const preResponse = await this.apiClient.post(BILIBILI_API.uploadPre, {
        profile: 'ugcupos/bup',
        name: 'video.mp4',
        size: Buffer.byteLength(mediaFile as Buffer),
      });

      if (preResponse.data.code !== 0) {
        throw new Error(`Failed to get upload parameters: ${preResponse.data.message}`);
      }

      const { upload_url, retrieve_url } = preResponse.data.data;

      // Step 2: Upload video file
      const uploadFormData = new FormData();
      uploadFormData.append('file', mediaFile);
      uploadFormData.append('name', 'video.mp4');
      uploadFormData.append('size', Buffer.byteLength(mediaFile as Buffer).toString());

      const uploadResponse = await axios.post(upload_url, uploadFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (uploadResponse.data.code !== 0) {
        throw new Error(`Failed to upload video: ${uploadResponse.data.message}`);
      }

      // Step 3: Retrieve upload result
      const retrieveResponse = await this.apiClient.post(retrieve_url, {});

      if (retrieveResponse.data.code !== 0) {
        throw new Error(`Failed to retrieve upload result: ${retrieveResponse.data.message}`);
      }

      return retrieveResponse.data.data.filename;
    } catch (error) {
      console.error('Failed to upload media to Bilibili:', error);
      throw error;
    }
  }

  /**
   * Publish content to Bilibili
   */
  async publishContent(content: PlatformContent): Promise<PublishResult> {
    await this.ensureValidCredentials();

    try {
      // Adapt content to Bilibili specifications
      const adaptedContent = this.adaptContent(content);

      // Validate content
      this.validateContent(adaptedContent);

      // Upload video
      const videoFilename = await this.uploadMedia(adaptedContent.mediaUrls[0], 'video');

      // Submit video for publication
      const response = await this.apiClient.post(BILIBILI_API.upload, {
        copyright: 1, // Original content
        videos: [
          {
            filename: videoFilename,
            title: adaptedContent.title,
            desc: adaptedContent.description,
          },
        ],
        tag: adaptedContent.tags || [],
        tid: this.getCategoryId(adaptedContent.category),
        cover: '', // Cover image URL if available
        source: '',
        no_reprint: 1, // No reprint
        open_elec: 1, // Open electrization
      });

      if (response.data.code !== 0) {
        return {
          success: false,
          error: response.data.message || 'Failed to publish to Bilibili',
        };
      }

      const { bvid, aid } = response.data.data;

      return {
        success: true,
        platformPostId: bvid,
        platformUrl: `https://www.bilibili.com/video/${bvid}`,
        publishedAt: new Date(),
      };
    } catch (error) {
      console.error('Failed to publish content to Bilibili:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Delete content from Bilibili
   */
  async deleteContent(platformPostId: string): Promise<boolean> {
    await this.ensureValidCredentials();

    try {
      const response = await this.apiClient.post('/x/vu/web/del', {
        bvid: platformPostId,
      });

      return response.data.code === 0;
    } catch (error) {
      console.error('Failed to delete content from Bilibili:', error);
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
      const response = await this.apiClient.get(BILIBILI_API.videoStatus, {
        params: {
          bvid: platformPostId,
        },
      });

      if (response.data.code !== 0) {
        throw new Error('Failed to get video status');
      }

      const stat = response.data.data.stat;

      return {
        views: stat.view,
        likes: stat.like,
        comments: stat.reply,
        shares: stat.share,
      };
    } catch (error) {
      console.error('Failed to get content status from Bilibili:', error);
      return {
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0,
      };
    }
  }

  /**
   * Get Bilibili category ID
   * Maps category names to Bilibili partition IDs
   */
  private getCategoryId(category?: string): number {
    const categoryMap: Record<string, number> = {
      // Main partitions
      'anime': 1,      // 动画
      'music': 3,      // 音乐
      'game': 4,       // 游戏
      'technology': 36, // 知识/科技
      'life': 160,     // 生活
      'car': 176,      // 汽车
      'fashion': 155,  // 时尚
      'entertainment': 5, // 娱乐
      'movie': 181,    // 影视
      'pet': 209,      // 动物圈
      'food': 211,     // 美食
      'sports': 234,   // 运动
    };

    return categoryMap[category || ''] || 160; // Default to "Life"
  }
}

export default BilibiliAdapter;
