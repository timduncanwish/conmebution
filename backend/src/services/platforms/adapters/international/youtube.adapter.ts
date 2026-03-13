/**
 * YouTube Platform Adapter
 * Implements content publishing to YouTube using YouTube Data API v3
 */

import axios, { AxiosInstance } from 'axios';
import {
  BasePlatformAdapter,
  PlatformCredentials,
  PlatformContent,
  PublishResult,
  PlatformConfig,
} from '../base.adapter';
import { Readable } from 'stream';

export interface YouTubeCredentials extends PlatformCredentials {
  accessToken: string;
  refreshToken?: string;
  channelId?: string;
}

export interface YouTubeUploadResult {
  id: string;
  snippet: {
    title: string;
    description: string;
    thumbnails: any;
  };
  status: {
    uploadStatus: string;
    privacyStatus: string;
  };
}

/**
 * YouTube API Configuration
 */
const YOUTUBE_CONFIG: PlatformConfig = {
  platformCode: 'youtube',
  platformName: 'YouTube',
  maxTitleLength: 100,
  maxDescriptionLength: 5000,
  supportedMediaTypes: ['video'],
  maxMediaCount: 1,
  maxVideoDuration: 7200, // 2 hours (12 minutes default)
  maxVideoSize: 256 * 1024 * 1024 * 1024, // 256GB
  maxImageSize: 2 * 1024 * 1024, // 2MB
};

/**
 * YouTube Data API v3 Endpoints
 */
const YOUTUBE_API = {
  base: 'https://www.googleapis.com/youtube/v3',
  upload: 'https://www.googleapis.com/upload/youtube/v3/videos',
  channels: 'https://www.googleapis.com/youtube/v3/channels',
  videos: 'https://www.googleapis.com/youtube/v3/videos',
  thumbnails: 'https://www.googleapis.com/youtube/v3/thumbnails/set',
};

export class YouTubeAdapter extends BasePlatformAdapter {
  private apiClient: AxiosInstance;
  private uploadClient: AxiosInstance;
  private youtubeCredentials: YouTubeCredentials;

  constructor(credentials: YouTubeCredentials) {
    super(credentials, YOUTUBE_CONFIG);
    this.youtubeCredentials = credentials;

    // Create axios instance for YouTube API
    this.apiClient = axios.create({
      baseURL: YOUTUBE_API.base,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 60000,
    });

    // Create axios instance for video upload
    this.uploadClient = axios.create({
      baseURL: YOUTUBE_API.upload,
      headers: {
        'Content-Type': 'application/octet-stream',
      },
      timeout: 600000, // 10 minutes for large video uploads
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });

    // Add request interceptor for authentication
    this.apiClient.interceptors.request.use((config) => {
      config.headers['Authorization'] = `Bearer ${this.credentials.accessToken}`;
      return config;
    });

    this.uploadClient.interceptors.request.use((config) => {
      config.headers['Authorization'] = `Bearer ${this.credentials.accessToken}`;
      return config;
    });
  }

  /**
   * Validate YouTube credentials
   */
  async validateCredentials(): Promise<boolean> {
    try {
      // Try to get channel info
      const response = await this.apiClient.get('/channels', {
        params: {
          part: 'snippet',
          mine: true,
        },
      });

      return response.status === 200 && response.data.items?.length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Refresh access token
   */
  async refreshCredentials(): Promise<void> {
    // Note: In production, this would use Google's OAuth 2.0 refresh token endpoint
    // For now, we'll mark the current token as invalid
    this.youtubeCredentials.accessToken = '';
    throw new Error('Token refresh not implemented. Please re-authenticate.');
  }

  /**
   * Upload video to YouTube
   * @param mediaFile - Buffer or file path
   * @param mediaType - 'image' or 'video'
   * @returns Video ID
   */
  async uploadMedia(mediaFile: Buffer | string, mediaType: 'image' | 'video'): Promise<string> {
    await this.ensureValidCredentials();

    if (mediaType !== 'video') {
      throw new Error('YouTube only supports video uploads');
    }

    try {
      // For YouTube, we need to use resumable upload
      // Step 1: Initialize upload session
      const initResponse = await this.uploadClient.post('', {
        part: 'snippet,status',
        notify: true,
      }, {
        params: {
          uploadType: 'resumable',
        },
      });

      const uploadUrl = initResponse.headers.location;

      // Step 2: Upload video file
      const fs = require('fs');
      let videoBuffer: Buffer;

      if (typeof mediaFile === 'string') {
        videoBuffer = fs.readFileSync(mediaFile);
      } else {
        videoBuffer = mediaFile as Buffer;
      }

      // Upload in chunks
      const chunkSize = 10 * 1024 * 1024; // 10MB chunks
      let uploadedBytes = 0;

      while (uploadedBytes < videoBuffer.length) {
        const chunk = videoBuffer.slice(uploadedBytes, uploadedBytes + chunkSize);
        const contentRange = `bytes ${uploadedBytes}-${uploadedBytes + chunk.length - 1}/${videoBuffer.length}`;

        const uploadResponse = await this.uploadClient.put(uploadUrl, chunk, {
          headers: {
            'Content-Range': contentRange,
          },
          maxBodyLength: Infinity,
        });

        if (uploadResponse.status === 200 || uploadResponse.status === 201) {
          // Upload complete
          const videoId = uploadResponse.data.id;
          return videoId;
        } else if (uploadResponse.status === 308) {
          // Resume upload
          const range = uploadResponse.headers['range'];
          if (range) {
            uploadedBytes = parseInt(range.split('-')[1]) + 1;
          }
        }
      }

      throw new Error('Video upload failed');
    } catch (error: any) {
      throw new Error(`Failed to upload video: ${error.message}`);
    }
  }

  /**
   * Publish content to YouTube
   * @param content - Content to publish
   * @returns Publish result with video ID
   */
  async publishContent(content: PlatformContent): Promise<PublishResult> {
    await this.ensureValidCredentials();

    try {
      // Validate and adapt content
      this.validateContent(content);
      const adaptedContent = this.adaptContent(content);

      // Upload video
      const videoId = await this.uploadMedia(adaptedContent.mediaUrls[0], 'video');

      // Update video metadata
      const metadata = {
        id: videoId,
        snippet: {
          title: adaptedContent.title,
          description: adaptedContent.description,
          tags: adaptedContent.tags || [],
          categoryId: '22', // People & Blogs (default)
          privacyStatus: adaptedContent.visibility || 'public',
        },
      };

      await this.apiClient.put(`/videos?part=snippet,status`, metadata);

      // Set thumbnail if provided
      if (adaptedContent.mediaUrls.length > 1) {
        try {
          const thumbnailResponse = await this.apiClient.post('/thumbnails/set', {
            videoId,
            thumbnail: adaptedContent.mediaUrls[1],
          });
        } catch (error) {
          // Thumbnail upload is not critical, continue
          console.warn('Failed to set thumbnail:', error);
        }
      }

      return {
        success: true,
        platformPostId: videoId,
        platformUrl: `https://www.youtube.com/watch?v=${videoId}`,
        publishedAt: new Date(),
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Delete content from YouTube
   * @param platformPostId - Platform-specific post ID
   * @returns Success status
   */
  async deleteContent(platformPostId: string): Promise<boolean> {
    await this.ensureValidCredentials();

    try {
      await this.apiClient.delete(`/videos?id=${platformPostId}`);
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
      const response = await this.apiClient.get('/videos', {
        params: {
          part: 'statistics',
          id: platformPostId,
        },
      });

      if (response.data.items?.length > 0) {
        const stats = response.data.items[0].statistics;
        return {
          views: parseInt(stats.viewCount) || 0,
          likes: parseInt(stats.likeCount) || 0,
          comments: parseInt(stats.commentCount) || 0,
          shares: 0, // YouTube doesn't have share count in statistics
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
   * Get channel information
   */
  async getChannelInfo(): Promise<any> {
    await this.ensureValidCredentials();

    try {
      const response = await this.apiClient.get('/channels', {
        params: {
          part: 'snippet,contentDetails,statistics',
          mine: true,
        },
      });

      if (response.data.items?.length > 0) {
        return response.data.items[0];
      } else {
        throw new Error('Channel not found');
      }
    } catch (error: any) {
      throw new Error(`Failed to get channel info: ${error.message}`);
    }
  }

  /**
   * Get video quota status
   */
  async getQuotaStatus(): Promise<{
    quotaUsed: number;
    quotaLimit: number;
  }> {
    try {
      const channel = await this.getChannelInfo();
      return {
        quotaUsed: parseInt(channel.statistics.videoCount) || 0,
        quotaLimit: Infinity, // YouTube doesn't have a hard limit
      };
    } catch (error) {
      return {
        quotaUsed: 0,
        quotaLimit: Infinity,
      };
    }
  }
}
