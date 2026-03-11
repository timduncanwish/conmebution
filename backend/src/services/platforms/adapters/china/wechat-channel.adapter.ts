/**
 * 微信视频号 (WeChat Channels) Platform Adapter
 * Implements content publishing to WeChat Channels (视频号)
 */

import axios, { AxiosInstance } from 'axios';
import {
  BasePlatformAdapter,
  PlatformCredentials,
  PlatformContent,
  PublishResult,
  PlatformConfig,
} from '../base.adapter';

export interface WeChatChannelCredentials extends PlatformCredentials {
  appId: string;
  appSecret: string;
  accountId?: string;
}

export interface WeChatChannelUploadResult {
  mediaId: string;
  url: string;
}

/**
 * 微信视频号 API Configuration
 */
const WECHAT_CHANNEL_CONFIG: PlatformConfig = {
  platformCode: 'wechat_channel',
  platformName: '微信视频号 (WeChat Channels)',
  maxTitleLength: 100,
  maxDescriptionLength: 1000,
  supportedMediaTypes: ['video'],
  maxMediaCount: 1,
  maxVideoDuration: 3600, // 1 hour
  maxVideoSize: 2 * 1024 * 1024 * 1024, // 2GB
};

/**
 * 微信视频号 API Endpoints
 */
const WECHAT_CHANNEL_API = {
  base: 'https://api.weixin.qq.com/cgi-bin',
  token: 'https://api.weixin.qq.com/cgi-bin/token',
  upload: 'https://api.weixin.qq.com/cgi-bin/media/upload',
  publish: 'https://api.weixin.qq.com/cgi-bin/freepublish/submitvideo',
};

export class WeChatChannelAdapter extends BasePlatformAdapter {
  private apiClient: AxiosInstance;
  private wechatCredentials: WeChatChannelCredentials;
  private accessToken?: string;

  constructor(credentials: WeChatChannelCredentials) {
    super(credentials, WECHAT_CHANNEL_CONFIG);
    this.wechatCredentials = credentials;

    // Create axios instance with WeChat-specific config
    this.apiClient = axios.create({
      baseURL: WECHAT_CHANNEL_API.base,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 60000, // 60 seconds for video upload
    });
  }

  /**
   * Get access token for WeChat API
   */
  private async getAccessToken(): Promise<string> {
    if (this.accessToken) {
      return this.accessToken;
    }

    try {
      const response = await this.apiClient.get('/token', {
        params: {
          grant_type: 'client_credential',
          appid: this.wechatCredentials.appId,
          secret: this.wechatCredentials.appSecret,
        },
      });

      if (response.data.errcode === 0) {
        this.accessToken = response.data.access_token || '';
        return this.accessToken!;
      } else {
        throw new Error(`Failed to get access token: ${response.data.errmsg}`);
      }
    } catch (error: any) {
      throw new Error(`WeChat API error: ${error.message}`);
    }
  }

  /**
   * Validate WeChat credentials
   */
  async validateCredentials(): Promise<boolean> {
    try {
      await this.getAccessToken();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Refresh access token
   */
  async refreshCredentials(): Promise<void> {
    this.accessToken = undefined;
    await this.getAccessToken();
  }

  /**
   * Upload media to WeChat Channels
   * @param mediaFile - Buffer or file path
   * @param mediaType - 'image' or 'video'
   * @returns Platform media ID
   */
  async uploadMedia(mediaFile: Buffer | string, mediaType: 'image' | 'video'): Promise<string> {
    await this.ensureValidCredentials();
    const accessToken = await this.getAccessToken();

    try {
      // For WeChat, we need to use FormData for file upload
      const FormData = require('form-data');
      const fs = require('fs');

      const form = new FormData();

      if (typeof mediaFile === 'string') {
        // It's a file path
        form.append('media', fs.createReadStream(mediaFile));
        form.append('type', mediaType);
      } else {
        // It's a buffer, save to temp file first
        const tempFilePath = `/tmp/temp_${Date.now()}.${mediaType === 'image' ? 'jpg' : 'mp4'}`;
        fs.writeFileSync(tempFilePath, mediaFile);
        form.append('media', fs.createReadStream(tempFilePath));
        form.append('type', mediaType);
      }

      const response = await this.apiClient.post('/material/add_material', form, {
        params: { access_token: accessToken },
        headers: {
          ...form.getHeaders(),
        },
      });

      if (response.data.errcode === 0) {
        return response.data.media_id;
      } else {
        throw new Error(`Upload failed: ${response.data.errmsg}`);
      }
    } catch (error: any) {
      throw new Error(`Failed to upload media: ${error.message}`);
    }
  }

  /**
   * Publish content to WeChat Channels
   * @param content - Content to publish
   * @returns Publish result with post ID
   */
  async publishContent(content: PlatformContent): Promise<PublishResult> {
    await this.ensureValidCredentials();
    const accessToken = await this.getAccessToken();

    try {
      // Validate and adapt content
      this.validateContent(content);
      const adaptedContent = this.adaptContent(content);

      // Upload video
      const mediaId = await this.uploadMedia(adaptedContent.mediaUrls[0], 'video');

      // Submit video for publication
      const publishResponse = await this.apiClient.post('/freepublish/submitvideo', {
        media_id: mediaId,
        title: adaptedContent.title,
        desc: adaptedContent.description,
      }, {
        params: { access_token: accessToken },
      });

      if (publishResponse.data.errcode === 0) {
        const publishId = publishResponse.data.publish_id;

        return {
          success: true,
          platformPostId: publishId,
          platformUrl: `https://channels.weixin.qq.com/posts/${publishId}`,
          publishedAt: new Date(),
        };
      } else {
        throw new Error(`Publish failed: ${publishResponse.data.errmsg}`);
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Delete content from WeChat Channels
   * @param platformPostId - Platform-specific post ID
   * @returns Success status
   */
  async deleteContent(platformPostId: string): Promise<boolean> {
    await this.ensureValidCredentials();
    const accessToken = await this.getAccessToken();

    try {
      const response = await this.apiClient.post('/freepublish/delete', {
        article_id: platformPostId,
      }, {
        params: { access_token: accessToken },
      });

      return response.data.errcode === 0;
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
    const accessToken = await this.getAccessToken();

    try {
      const response = await this.apiClient.get('/datacube/getweanalysisappidroid', {
        params: {
          access_token: accessToken,
          begin_date: new Date().toISOString().split('T')[0],
          end_date: new Date().toISOString().split('T')[0],
        },
      });

      if (response.data.errcode === 0) {
        const stats = response.data.list?.[0] || {};
        return {
          views: stats.int_page_read_user || 0,
          likes: stats.like_user || 0,
          comments: stats.comment_user || 0,
          shares: stats.share_user || 0,
        };
      } else {
        throw new Error(`Failed to get status: ${response.data.errmsg}`);
      }
    } catch (error) {
      // Return zero values on error
      return {
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0,
      };
    }
  }
}
