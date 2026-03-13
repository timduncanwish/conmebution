/**
 * Mock Platform Adapter
 * 用于演示和测试的模拟平台适配器
 */

import {
  BasePlatformAdapter,
  PlatformCredentials,
  PlatformContent,
  PlatformConfig,
  PublishResult
} from './base.adapter';

/**
 * Mock平台适配器实现
 * 模拟发布功能，无需真实平台凭证
 */
export class MockPlatformAdapter extends BasePlatformAdapter {
  private mockAccountId: string;
  private mockAccountName: string;

  constructor(credentials: PlatformCredentials, config: PlatformConfig) {
    super(credentials, config);
    this.mockAccountId = credentials.accountId || 'mock_account_001';
    this.mockAccountName = credentials.accountName || 'Mock Account';
  }

  /**
   * 验证凭证（总是返回true）
   */
  async validateCredentials(): Promise<boolean> {
    await this.delay(500); // 模拟网络延迟
    return true;
  }

  /**
   * 刷新凭证（模拟操作）
   */
  async refreshCredentials(): Promise<void> {
    await this.delay(300);
    // 模拟凭证刷新 - 不做任何实际操作
  }

  /**
   * 上传媒体（模拟上传）
   */
  async uploadMedia(mediaFile: Buffer | string, mediaType: 'image' | 'video'): Promise<string> {
    await this.delay(1000 + Math.random() * 2000); // 模拟上传延迟

    // 生成模拟的媒体URL
    const mockMediaId = `mock_${mediaType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    if (mediaType === 'image') {
      return `https://picsum.photos/1024/1024?random=${Date.now()}`;
    } else {
      return `https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4`;
    }
  }

  /**
   * 发布内容（模拟发布）
   */
  async publishContent(content: PlatformContent): Promise<PublishResult> {
    await this.delay(1500 + Math.random() * 2000); // 模拟发布延迟

    // 生成模拟的帖子ID和URL
    const mockPostId = `mock_${this.config.platformCode}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const platformPostId = mockPostId;

    // 构造平台URL
    const platformUrl = this.generatePlatformUrl(platformPostId);

    return {
      success: true,
      platformPostId,
      platformUrl,
      publishedAt: new Date()
    };
  }

  /**
   * 删除内容（模拟删除）
   */
  async deleteContent(platformPostId: string): Promise<boolean> {
    await this.delay(800);
    return true;
  }

  /**
   * 获取内容状态（模拟统计数据）
   */
  async getContentStatus(platformPostId: string): Promise<{
    views: number;
    likes: number;
    comments: number;
    shares: number;
  }> {
    await this.delay(500);

    // 生成模拟的统计数据
    return {
      views: Math.floor(Math.random() * 10000),
      likes: Math.floor(Math.random() * 1000),
      comments: Math.floor(Math.random() * 100),
      shares: Math.floor(Math.random() * 50)
    };
  }

  /**
   * 获取平台统计信息（模拟）
   */
  async getPlatformStats(): Promise<any> {
    await this.delay(500);
    return {
      followers: Math.floor(Math.random() * 10000),
      following: Math.floor(Math.random() * 1000),
      posts: Math.floor(Math.random() * 500),
      likes: Math.floor(Math.random() * 50000)
    };
  }

  // ========== 私有辅助方法 ==========

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private generatePlatformUrl(postId: string): string {
    const platformUrls: Record<string, string> = {
      'bilibili': `https://www.bilibili.com/video/${postId}`,
      'douyin': `https://www.douyin.com/video/${postId}`,
      'wechat_mp': `https://mp.weixin.qq.com/s/${postId}`,
      'wechat_channel': `https://weixin.qq.com/sph/${postId}`,
      'xiaohongshu': `https://www.xiaohongshu.com/explore/${postId}`,
      'youtube': `https://www.youtube.com/watch?v=${postId}`,
      'twitter': `https://twitter.com/user/status/${postId}`,
      'medium': `https://medium.com/p/${postId}`
    };

    return platformUrls[this.config.platformCode] || `https://example.com/post/${postId}`;
  }
}

/**
 * Mock平台配置
 */
export function getMockPlatformConfig(platformCode: string): PlatformConfig {
  const configs: Record<string, PlatformConfig> = {
    'bilibili': {
      platformCode: 'bilibili',
      platformName: 'B站',
      maxTitleLength: 100,
      maxDescriptionLength: 2000,
      supportedMediaTypes: ['video', 'image'],
      maxMediaCount: 1,
      maxVideoDuration: 600,
      maxVideoSize: 2 * 1024 * 1024 * 1024 // 2GB
    },
    'douyin': {
      platformCode: 'douyin',
      platformName: '抖音',
      maxTitleLength: 80,
      maxDescriptionLength: 500,
      supportedMediaTypes: ['video'],
      maxMediaCount: 1,
      maxVideoDuration: 300,
      maxVideoSize: 500 * 1024 * 1024 // 500MB
    },
    'wechat_mp': {
      platformCode: 'wechat_mp',
      platformName: '微信公众号',
      maxTitleLength: 64,
      maxDescriptionLength: 50000,
      supportedMediaTypes: ['image', 'text'],
      maxMediaCount: 20,
      maxImageSize: 5 * 1024 * 1024 // 5MB
    },
    'wechat_channel': {
      platformCode: 'wechat_channel',
      platformName: '微信视频号',
      maxTitleLength: 64,
      maxDescriptionLength: 1000,
      supportedMediaTypes: ['video'],
      maxMediaCount: 1,
      maxVideoDuration: 300,
      maxVideoSize: 2 * 1024 * 1024 * 1024 // 2GB
    },
    'xiaohongshu': {
      platformCode: 'xiaohongshu',
      platformName: '小红书',
      maxTitleLength: 20,
      maxDescriptionLength: 1000,
      supportedMediaTypes: ['image', 'video'],
      maxMediaCount: 10,
      maxVideoDuration: 60,
      maxImageSize: 10 * 1024 * 1024 // 10MB
    },
    'youtube': {
      platformCode: 'youtube',
      platformName: 'YouTube',
      maxTitleLength: 100,
      maxDescriptionLength: 5000,
      supportedMediaTypes: ['video'],
      maxMediaCount: 1,
      maxVideoDuration: 7200,
      maxVideoSize: 256 * 1024 * 1024 * 1024 // 256GB
    },
    'twitter': {
      platformCode: 'twitter',
      platformName: 'Twitter/X',
      maxTitleLength: 280,
      maxDescriptionLength: 280,
      supportedMediaTypes: ['image', 'video'],
      maxMediaCount: 4,
      maxVideoDuration: 140,
      maxVideoSize: 512 * 1024 * 1024 // 512MB
    },
    'medium': {
      platformCode: 'medium',
      platformName: 'Medium',
      maxTitleLength: 200,
      maxDescriptionLength: 10000,
      supportedMediaTypes: ['text', 'image'],
      maxMediaCount: 10,
      maxImageSize: 25 * 1024 * 1024 // 25MB
    }
  };

  return configs[platformCode] || {
    platformCode,
    platformName: platformCode.charAt(0).toUpperCase() + platformCode.slice(1),
    maxTitleLength: 100,
    maxDescriptionLength: 2000,
    supportedMediaTypes: ['text'],
    maxMediaCount: 1
  };
}

/**
 * 创建Mock平台凭证
 */
export function createMockCredentials(platformCode: string, accountName?: string): PlatformCredentials {
  return {
    accessToken: `mock_access_token_${platformCode}_${Date.now()}`,
    refreshToken: `mock_refresh_token_${platformCode}_${Date.now()}`,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30天后过期
    accountId: `mock_account_${platformCode}`,
    accountName: accountName || `Mock ${platformCode} Account`
  };
}
