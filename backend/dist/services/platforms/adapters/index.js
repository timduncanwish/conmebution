"use strict";
/**
 * Platform Adapters Index
 * Exports all available platform adapters and factory
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlatformAdapterFactory = exports.MediumAdapter = exports.TwitterAdapter = exports.YouTubeAdapter = exports.XiaohongshuAdapter = exports.WeChatChannelAdapter = exports.WeChatMPAdapter = exports.DouyinAdapter = exports.BilibiliAdapter = exports.BasePlatformAdapter = void 0;
var base_adapter_1 = require("./base.adapter");
Object.defineProperty(exports, "BasePlatformAdapter", { enumerable: true, get: function () { return base_adapter_1.BasePlatformAdapter; } });
var bilibili_adapter_1 = require("./china/bilibili.adapter");
Object.defineProperty(exports, "BilibiliAdapter", { enumerable: true, get: function () { return bilibili_adapter_1.BilibiliAdapter; } });
var douyin_adapter_1 = require("./china/douyin.adapter");
Object.defineProperty(exports, "DouyinAdapter", { enumerable: true, get: function () { return douyin_adapter_1.DouyinAdapter; } });
var wechat_mp_adapter_1 = require("./china/wechat-mp.adapter");
Object.defineProperty(exports, "WeChatMPAdapter", { enumerable: true, get: function () { return wechat_mp_adapter_1.WeChatMPAdapter; } });
var wechat_channel_adapter_1 = require("./china/wechat-channel.adapter");
Object.defineProperty(exports, "WeChatChannelAdapter", { enumerable: true, get: function () { return wechat_channel_adapter_1.WeChatChannelAdapter; } });
var xiaohongshu_adapter_1 = require("./china/xiaohongshu.adapter");
Object.defineProperty(exports, "XiaohongshuAdapter", { enumerable: true, get: function () { return xiaohongshu_adapter_1.XiaohongshuAdapter; } });
var youtube_adapter_1 = require("./international/youtube.adapter");
Object.defineProperty(exports, "YouTubeAdapter", { enumerable: true, get: function () { return youtube_adapter_1.YouTubeAdapter; } });
var twitter_adapter_1 = require("./international/twitter.adapter");
Object.defineProperty(exports, "TwitterAdapter", { enumerable: true, get: function () { return twitter_adapter_1.TwitterAdapter; } });
var medium_adapter_1 = require("./international/medium.adapter");
Object.defineProperty(exports, "MediumAdapter", { enumerable: true, get: function () { return medium_adapter_1.MediumAdapter; } });
const bilibili_adapter_2 = require("./china/bilibili.adapter");
const douyin_adapter_2 = require("./china/douyin.adapter");
const wechat_mp_adapter_2 = require("./china/wechat-mp.adapter");
const wechat_channel_adapter_2 = require("./china/wechat-channel.adapter");
const xiaohongshu_adapter_2 = require("./china/xiaohongshu.adapter");
const youtube_adapter_2 = require("./international/youtube.adapter");
const twitter_adapter_2 = require("./international/twitter.adapter");
const medium_adapter_2 = require("./international/medium.adapter");
class PlatformAdapterFactory {
    /**
     * Create platform adapter instance
     */
    static createAdapter(platformType, credentials) {
        switch (platformType) {
            case 'bilibili':
                return new bilibili_adapter_2.BilibiliAdapter(credentials);
            case 'douyin':
                return new douyin_adapter_2.DouyinAdapter(credentials);
            case 'wechat_mp':
                return new wechat_mp_adapter_2.WeChatMPAdapter(credentials);
            case 'wechat_channel':
                return new wechat_channel_adapter_2.WeChatChannelAdapter(credentials);
            case 'xiaohongshu':
                return new xiaohongshu_adapter_2.XiaohongshuAdapter(credentials);
            case 'youtube':
                return new youtube_adapter_2.YouTubeAdapter(credentials);
            case 'twitter':
                return new twitter_adapter_2.TwitterAdapter(credentials);
            case 'medium':
                return new medium_adapter_2.MediumAdapter(credentials);
            default:
                throw new Error(`Unsupported platform type: ${platformType}`);
        }
    }
    /**
     * Get list of supported platforms
     */
    static getSupportedPlatforms() {
        return ['bilibili', 'douyin', 'wechat_mp', 'wechat_channel', 'xiaohongshu', 'youtube', 'twitter', 'medium'];
    }
    /**
     * Get domestic platforms
     */
    static getDomesticPlatforms() {
        return ['bilibili', 'douyin', 'wechat_mp', 'wechat_channel', 'xiaohongshu'];
    }
    /**
     * Get international platforms
     */
    static getInternationalPlatforms() {
        return ['youtube', 'twitter', 'medium'];
    }
    /**
     * Get platform configuration
     */
    static getPlatformConfig(platformType) {
        const configs = {
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
    static isPlatformSupported(platformType) {
        return this.getSupportedPlatforms().includes(platformType);
    }
    /**
     * Get platforms by media type
     */
    static getPlatformsByMediaType(mediaType) {
        const allPlatforms = this.getSupportedPlatforms();
        return allPlatforms.filter(platform => this.getPlatformConfig(platform).mediaTypes.includes(mediaType));
    }
}
exports.PlatformAdapterFactory = PlatformAdapterFactory;
exports.default = PlatformAdapterFactory;
