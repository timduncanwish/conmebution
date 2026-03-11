/**
 * Platform Adapters Index
 * Exports all available platform adapters and factory
 */

export { BasePlatformAdapter, PlatformCredentials } from './base.adapter';
export { BilibiliAdapter, BilibiliCredentials } from './china/bilibili.adapter';
export { DouyinAdapter, DouyinCredentials } from './china/douyin.adapter';
export { WeChatMPAdapter, WeChatMPCredentials } from './china/wechat-mp.adapter';
export { WeChatChannelAdapter, WeChatChannelCredentials } from './china/wechat-channel.adapter';
export { XiaohongshuAdapter, XiaohongshuCredentials } from './china/xiaohongshu.adapter';
export { YouTubeAdapter, YouTubeCredentials } from './international/youtube.adapter';
export { TwitterAdapter, TwitterCredentials } from './international/twitter.adapter';
export { MediumAdapter, MediumCredentials } from './international/medium.adapter';

import { BasePlatformAdapter, PlatformCredentials } from './base.adapter';
import { BilibiliAdapter } from './china/bilibili.adapter';
import { DouyinAdapter } from './china/douyin.adapter';
import { WeChatMPAdapter } from './china/wechat-mp.adapter';
import { WeChatChannelAdapter } from './china/wechat-channel.adapter';
import { XiaohongshuAdapter } from './china/xiaohongshu.adapter';
import { YouTubeAdapter } from './international/youtube.adapter';
import { TwitterAdapter } from './international/twitter.adapter';
import { MediumAdapter } from './international/medium.adapter';

export type PlatformType = 'bilibili' | 'douyin' | 'wechat_mp' | 'wechat_channel' | 'xiaohongshu' | 'youtube' | 'twitter' | 'medium';

export interface PlatformAdapterFactoryConfig {
  type: PlatformType;
  credentials: PlatformCredentials;
}

export class PlatformAdapterFactory {
  /**
   * Create platform adapter instance
   */
  static createAdapter(platformType: PlatformType, credentials: PlatformCredentials): BasePlatformAdapter {
    switch (platformType) {
      case 'bilibili':
        return new BilibiliAdapter(credentials as any);

      case 'douyin':
        return new DouyinAdapter(credentials as any);

      case 'wechat_mp':
        return new WeChatMPAdapter(credentials as any);

      case 'wechat_channel':
        return new WeChatChannelAdapter(credentials as any);

      case 'xiaohongshu':
        return new XiaohongshuAdapter(credentials as any);

      case 'youtube':
        return new YouTubeAdapter(credentials as any);

      case 'twitter':
        return new TwitterAdapter(credentials as any);

      case 'medium':
        return new MediumAdapter(credentials as any);

      default:
        throw new Error(`Unsupported platform type: ${platformType}`);
    }
  }

  /**
   * Get list of supported platforms
   */
  static getSupportedPlatforms(): PlatformType[] {
    return ['bilibili', 'douyin', 'wechat_mp', 'wechat_channel', 'xiaohongshu', 'youtube', 'twitter', 'medium'];
  }

  /**
   * Get domestic platforms
   */
  static getDomesticPlatforms(): PlatformType[] {
    return ['bilibili', 'douyin', 'wechat_mp', 'wechat_channel', 'xiaohongshu'];
  }

  /**
   * Get international platforms
   */
  static getInternationalPlatforms(): PlatformType[] {
    return ['youtube', 'twitter', 'medium'];
  }

  /**
   * Get platform configuration
   */
  static getPlatformConfig(platformType: PlatformType) {
    const configs: Record<PlatformType, any> = {
      bilibili: {
        code: 'bilibili',
        name: 'B站 (Bilibili)',
        mediaTypes: ['video'],
        requiresAuth: true,
        category: 'domestic',
      },
      douyin: {
        code: 'douyin',
        name: '抖音',
        mediaTypes: ['video'],
        requiresAuth: true,
        category: 'domestic',
      },
      wechat_mp: {
        code: 'wechat_mp',
        name: '微信公众号 (WeChat Official Account)',
        mediaTypes: ['image'],
        requiresAuth: true,
        category: 'domestic',
        requiresCertification: true,
      },
      wechat_channel: {
        code: 'wechat_channel',
        name: '微信视频号 (WeChat Channels)',
        mediaTypes: ['video'],
        requiresAuth: true,
        category: 'domestic',
      },
      xiaohongshu: {
        code: 'xiaohongshu',
        name: '小红书 (Xiaohongshu)',
        mediaTypes: ['image', 'video'],
        requiresAuth: true,
        category: 'domestic',
        usesBrowserAutomation: true,
      },
      // International platforms
      youtube: {
        code: 'youtube',
        name: 'YouTube',
        mediaTypes: ['video'],
        requiresAuth: true,
        category: 'international',
        phase: 3,
      },
      twitter: {
        code: 'twitter',
        name: 'Twitter/X',
        mediaTypes: ['image', 'video'],
        requiresAuth: true,
        category: 'international',
        phase: 3,
      },
      medium: {
        code: 'medium',
        name: 'Medium',
        mediaTypes: ['text'],
        requiresAuth: true,
        category: 'international',
        phase: 3,
      },
    };

    return configs[platformType];
  }

  /**
   * Check if platform is supported
   */
  static isPlatformSupported(platformType: PlatformType): boolean {
    return this.getSupportedPlatforms().includes(platformType);
  }

  /**
   * Get platforms by media type
   */
  static getPlatformsByMediaType(mediaType: 'video' | 'image' | 'text'): PlatformType[] {
    const allPlatforms = this.getSupportedPlatforms();
    return allPlatforms.filter(platform =>
      this.getPlatformConfig(platform).mediaTypes.includes(mediaType)
    );
  }
}

export default PlatformAdapterFactory;
