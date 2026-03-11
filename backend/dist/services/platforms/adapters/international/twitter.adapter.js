"use strict";
/**
 * Twitter/X Platform Adapter
 * Implements content publishing to Twitter using Twitter API v2
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwitterAdapter = void 0;
const axios_1 = __importDefault(require("axios"));
const base_adapter_1 = require("../base.adapter");
/**
 * Twitter API Configuration
 */
const TWITTER_CONFIG = {
    platformCode: 'twitter',
    platformName: 'Twitter/X',
    maxTitleLength: 280,
    maxDescriptionLength: 280,
    supportedMediaTypes: ['image', 'video'],
    maxMediaCount: 4,
    maxVideoDuration: 140, // 2 minutes 20 seconds
    maxVideoSize: 500 * 1024 * 1024, // 500MB
    maxImageSize: 5 * 1024 * 1024, // 5MB
};
/**
 * Twitter API v2 Endpoints
 */
const TWITTER_API = {
    base: 'https://api.twitter.com/2',
    upload: 'https://upload.twitter.com/1.1/media',
    tweets: 'https://api.twitter.com/2/tweets',
    users: 'https://api.twitter.com/2/users',
};
class TwitterAdapter extends base_adapter_1.BasePlatformAdapter {
    constructor(credentials) {
        super(credentials, TWITTER_CONFIG);
        this.twitterCredentials = credentials;
        // Create axios instance for Twitter API v2
        this.apiClient = axios_1.default.create({
            baseURL: TWITTER_API.base,
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: 30000,
        });
        // Create axios instance for media upload
        this.uploadClient = axios_1.default.create({
            baseURL: TWITTER_API.upload,
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            timeout: 120000, // 2 minutes for media upload
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
        });
        // Add request interceptor for authentication
        this.apiClient.interceptors.request.use((config) => {
            config.headers['Authorization'] = `Bearer ${this.credentials.accessToken}`;
            return config;
        });
        this.uploadClient.interceptors.request.use((config) => {
            config.headers['Authorization'] = `OAuth ${this.credentials.accessToken}`;
            return config;
        });
    }
    /**
     * Validate Twitter credentials
     */
    async validateCredentials() {
        try {
            // Try to get user info
            const response = await this.apiClient.get('/users/me');
            return response.status === 200 && response.data.data;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Refresh access token
     */
    async refreshCredentials() {
        // Note: Twitter OAuth 2.0 tokens are long-lived, refresh is not typically needed
        throw new Error('Token refresh not supported for Twitter OAuth 2.0. Please re-authenticate.');
    }
    /**
     * Upload media to Twitter
     * @param mediaFile - Buffer or file path
     * @param mediaType - 'image' or 'video'
     * @returns Media ID
     */
    async uploadMedia(mediaFile, mediaType) {
        await this.ensureValidCredentials();
        try {
            const FormData = require('form-data');
            const fs = require('fs');
            const form = new FormData();
            if (typeof mediaFile === 'string') {
                // It's a file path
                form.append('media', fs.createReadStream(mediaFile));
            }
            else {
                // It's a buffer, save to temp file first
                const tempFilePath = `/tmp/temp_${Date.now()}.${mediaType === 'image' ? 'jpg' : 'mp4'}`;
                fs.writeFileSync(tempFilePath, mediaFile);
                form.append('media', fs.createReadStream(tempFilePath));
            }
            const response = await this.uploadClient.post('/upload.json', form, {
                headers: form.getHeaders(),
            });
            if (response.data && response.data.media_id_string) {
                return response.data.media_id_string;
            }
            else {
                throw new Error('Invalid upload response');
            }
        }
        catch (error) {
            throw new Error(`Failed to upload media: ${error.message}`);
        }
    }
    /**
     * Publish content to Twitter
     * @param content - Content to publish
     * @returns Publish result with tweet ID
     */
    async publishContent(content) {
        await this.ensureValidCredentials();
        try {
            // Validate and adapt content
            this.validateContent(content);
            const adaptedContent = this.adaptContent(content);
            // Upload media files first
            const mediaIds = [];
            for (const mediaUrl of adaptedContent.mediaUrls) {
                const mediaId = await this.uploadMedia(mediaUrl, 'image');
                mediaIds.push(mediaId);
            }
            // Create tweet with media
            const tweetData = {
                text: this.formatTweetText(adaptedContent.title, adaptedContent.description),
            };
            // Add media IDs if available
            if (mediaIds.length > 0) {
                tweetData.media = {
                    media_ids: mediaIds,
                };
            }
            const response = await this.apiClient.post('/tweets', {
                tweet: tweetData,
            });
            if (response.data && response.data.data) {
                const tweet = response.data.data;
                return {
                    success: true,
                    platformPostId: tweet.id,
                    platformUrl: `https://twitter.com/i/status/${tweet.id}`,
                    publishedAt: new Date(tweet.created_at),
                };
            }
            else {
                throw new Error('Invalid tweet response');
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
     * Format tweet text combining title and description
     */
    formatTweetText(title, description) {
        // Twitter has a 280 character limit
        let tweetText = '';
        if (title && description) {
            // Try to fit both title and description
            const combined = `${title}\n\n${description}`;
            if (combined.length <= 280) {
                tweetText = combined;
            }
            else {
                // Too long, prioritize title
                tweetText = title.length <= 280 ? title : title.substring(0, 277) + '...';
            }
        }
        else if (title) {
            tweetText = title;
        }
        else if (description) {
            tweetText = description.length <= 280 ? description : description.substring(0, 277) + '...';
        }
        return tweetText;
    }
    /**
     * Delete content from Twitter
     * @param platformPostId - Platform-specific post ID (Tweet ID)
     * @returns Success status
     */
    async deleteContent(platformPostId) {
        await this.ensureValidCredentials();
        try {
            await this.apiClient.delete(`/tweets/${platformPostId}`);
            return true;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Get content status/analytics
     * @param platformPostId - Platform-specific post ID (Tweet ID)
     * @returns Analytics data
     */
    async getContentStatus(platformPostId) {
        await this.ensureValidCredentials();
        try {
            const response = await this.apiClient.get(`/tweets/${platformPostId}`, {
                params: {
                    'tweet.fields': 'public_metrics,created_at',
                },
            });
            if (response.data && response.data.data) {
                const tweet = response.data.data;
                const metrics = tweet.public_metrics || {};
                return {
                    views: metrics.impression_count || 0,
                    likes: metrics.like_count || 0,
                    comments: metrics.reply_count || 0,
                    shares: metrics.retweet_count || 0,
                };
            }
            else {
                return {
                    views: 0,
                    likes: 0,
                    comments: 0,
                    shares: 0,
                };
            }
        }
        catch (error) {
            return {
                views: 0,
                likes: 0,
                comments: 0,
                shares: 0,
            };
        }
    }
    /**
     * Get user information
     */
    async getUserInfo() {
        await this.ensureValidCredentials();
        try {
            const response = await this.apiClient.get('/users/me', {
                params: {
                    'user.fields': 'created_at,description,entities,id,location,name,pinned_tweet_id,profile_image_url,protected,public_metrics,url,username,verified',
                },
            });
            if (response.data && response.data.data) {
                return response.data.data;
            }
            else {
                throw new Error('User not found');
            }
        }
        catch (error) {
            throw new Error(`Failed to get user info: ${error.message}`);
        }
    }
    /**
     * Check if account is verified
     */
    async isVerified() {
        try {
            const user = await this.getUserInfo();
            return user.verified || false;
        }
        catch (error) {
            return false;
        }
    }
}
exports.TwitterAdapter = TwitterAdapter;
