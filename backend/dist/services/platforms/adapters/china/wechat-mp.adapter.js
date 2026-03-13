"use strict";
/**
 * 微信公众号 (WeChat Official Account) Platform Adapter
 * Implements content publishing to WeChat Official Accounts
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WeChatMPAdapter = void 0;
const axios_1 = __importDefault(require("axios"));
const base_adapter_1 = require("../base.adapter");
/**
 * 微信公众号 API Configuration
 */
const WECHAT_MP_CONFIG = {
    platformCode: 'wechat_mp',
    platformName: '微信公众号 (WeChat Official Account)',
    maxTitleLength: 64,
    maxDescriptionLength: 2000,
    supportedMediaTypes: ['image'],
    maxMediaCount: 9,
    maxImageSize: 2 * 1024 * 1024, // 2MB
};
/**
 * 微信公众号 API Endpoints
 */
const WECHAT_MP_API = {
    base: 'https://api.weixin.qq.com/cgi-bin',
    token: 'https://api.weixin.qq.com/cgi-bin/token',
    upload: 'https://api.weixin.qq.com/cgi-bin/material/add_material',
    addNews: 'https://api.weixin.qq.com/cgi-bin/material/add_news',
    publish: 'https://api.weixin.qq.com/cgi-bin/freepublish/submit',
};
class WeChatMPAdapter extends base_adapter_1.BasePlatformAdapter {
    constructor(credentials) {
        super(credentials, WECHAT_MP_CONFIG);
        this.wechatCredentials = credentials;
        // Create axios instance with WeChat-specific config
        this.apiClient = axios_1.default.create({
            baseURL: WECHAT_MP_API.base,
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: 30000,
        });
    }
    /**
     * Get access token for WeChat API
     */
    async getAccessToken() {
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
                return this.accessToken;
            }
            else {
                throw new Error(`Failed to get access token: ${response.data.errmsg}`);
            }
        }
        catch (error) {
            throw new Error(`WeChat API error: ${error.message}`);
        }
    }
    /**
     * Validate WeChat credentials
     */
    async validateCredentials() {
        try {
            await this.getAccessToken();
            return true;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Refresh access token
     */
    async refreshCredentials() {
        this.accessToken = undefined;
        await this.getAccessToken();
    }
    /**
     * Upload media to WeChat
     * @param mediaFile - Buffer or file path
     * @param mediaType - 'image' or 'video'
     * @returns Platform media ID
     */
    async uploadMedia(mediaFile, mediaType) {
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
            }
            else {
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
            }
            else {
                throw new Error(`Upload failed: ${response.data.errmsg}`);
            }
        }
        catch (error) {
            throw new Error(`Failed to upload media: ${error.message}`);
        }
    }
    /**
     * Publish content to WeChat Official Account
     * @param content - Content to publish
     * @returns Publish result with post ID
     */
    async publishContent(content) {
        await this.ensureValidCredentials();
        const accessToken = await this.getAccessToken();
        try {
            // Validate and adapt content
            this.validateContent(content);
            const adaptedContent = this.adaptContent(content);
            // Upload media files
            const mediaIds = [];
            for (const mediaUrl of adaptedContent.mediaUrls) {
                const mediaId = await this.uploadMedia(mediaUrl, 'image');
                mediaIds.push(mediaId);
            }
            // Create article object
            const articles = [{
                    title: adaptedContent.title,
                    author: 'Conmebution',
                    digest: adaptedContent.description.substring(0, 100),
                    content: adaptedContent.description,
                    content_source_url: '',
                    thumb_media_id: mediaIds[0],
                    show_cover_pic: 1,
                    need_open_comment: 1,
                    only_fans_can_comment: 0,
                }];
            // Add news material
            const addNewsResponse = await this.apiClient.post('/material/add_news', {
                articles,
            }, {
                params: { access_token: accessToken },
            });
            if (addNewsResponse.data.errcode !== 0) {
                throw new Error(`Failed to add news: ${addNewsResponse.data.errmsg}`);
            }
            const mediaId = addNewsResponse.data.media_id;
            // Publish the article
            const publishResponse = await this.apiClient.post('/freepublish/submit', {
                media_id: mediaId,
            }, {
                params: { access_token: accessToken },
            });
            if (publishResponse.data.errcode === 0) {
                const publishId = publishResponse.data.publish_id;
                return {
                    success: true,
                    platformPostId: publishId,
                    platformUrl: `https://mp.weixin.qq.com/s/${publishId}`,
                    publishedAt: new Date(),
                };
            }
            else {
                throw new Error(`Publish failed: ${publishResponse.data.errmsg}`);
            }
        }
        catch (error) {
            return {
                success: false,
                error: error.message,
            };
        }
    }
    /**
     * Delete content from WeChat
     * @param platformPostId - Platform-specific post ID
     * @returns Success status
     */
    async deleteContent(platformPostId) {
        await this.ensureValidCredentials();
        const accessToken = await this.getAccessToken();
        try {
            const response = await this.apiClient.post('/freepublish/delete', {
                article_id: platformPostId,
            }, {
                params: { access_token: accessToken },
            });
            return response.data.errcode === 0;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Get content status/analytics
     * @param platformPostId - Platform-specific post ID
     * @returns Analytics data
     */
    async getContentStatus(platformPostId) {
        await this.ensureValidCredentials();
        const accessToken = await this.getAccessToken();
        try {
            const response = await this.apiClient.post('/freepublish/get', {
                article_id: platformPostId,
            }, {
                params: { access_token: accessToken },
            });
            if (response.data.errcode === 0) {
                const article = response.data.news_item[0];
                return {
                    views: article.read_num || 0,
                    likes: article.like_num || 0,
                    comments: article.comment_num || 0,
                    shares: article.share_num || 0,
                };
            }
            else {
                throw new Error(`Failed to get status: ${response.data.errmsg}`);
            }
        }
        catch (error) {
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
exports.WeChatMPAdapter = WeChatMPAdapter;
