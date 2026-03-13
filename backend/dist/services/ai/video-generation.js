"use strict";
/**
 * Video Generation Service
 * Integrates with Seedance 2.0 (Jimeng AI) and other video generation APIs
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HeyGenVideoGenerator = exports.SeedanceVideoGenerator = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = __importDefault(require("../../utils/logger"));
/**
 * Seedance 2.0 (Dreamina/Jimeng AI) Configuration
 * As per PRD, this is the preferred video generation service (1元/秒)
 */
class SeedanceVideoGenerator {
    constructor(apiKey) {
        this.apiKey = apiKey;
        // Note: Seedance 2.0 API endpoints are hypothetical
        // Actual implementation will need to use official API documentation
        this.apiClient = axios_1.default.create({
            baseURL: 'https://api.dreamina.capcut.com', // Hypothetical base URL
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
            },
        });
    }
    /**
     * Generate video using Seedance 2.0
     */
    async generateVideo(options) {
        try {
            logger_1.default.info('Generating video with Seedance 2.0', {
                prompt: options.prompt.substring(0, 50),
                duration: options.duration,
                resolution: options.resolution,
            });
            // Step 1: Submit generation request
            const submitResponse = await this.apiClient.post('/v1/videos/generate', {
                prompt: options.prompt,
                duration: options.duration || 15,
                resolution: options.resolution || '1080p',
                style: options.style || 'product',
                aspect_ratio: options.ratio || '16:9',
            });
            if (submitResponse.data.code !== 0) {
                throw new Error(submitResponse.data.message || 'Failed to submit video generation request');
            }
            const { task_id } = submitResponse.data.data;
            // Step 2: Poll for completion
            const result = await this.pollForCompletion(task_id);
            // Calculate cost (1元/秒 as per PRD)
            const cost = (options.duration || 15) * 1.0;
            logger_1.default.info('Successfully generated video', {
                taskId: task_id,
                duration: result.duration,
                cost,
            });
            return {
                success: true,
                videoUrl: result.videoUrl,
                videoId: task_id,
                thumbnailUrl: result.thumbnailUrl,
                duration: result.duration,
                cost,
            };
        }
        catch (error) {
            logger_1.default.error('Failed to generate video with Seedance 2.0', {
                error: error.response?.data || error.message,
            });
            return {
                success: false,
                error: error.response?.data?.error?.message || error.message,
            };
        }
    }
    /**
     * Poll for video generation completion
     */
    async pollForCompletion(taskId, maxAttempts = 60, intervalMs = 2000) {
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            try {
                const statusResponse = await this.apiClient.get(`/v1/videos/status/${taskId}`);
                if (statusResponse.data.code !== 0) {
                    throw new Error(`Failed to check video status: ${statusResponse.data.message}`);
                }
                const { status, video_url, thumbnail_url, duration } = statusResponse.data.data;
                if (status === 'completed') {
                    return {
                        videoUrl: video_url,
                        thumbnailUrl: thumbnail_url,
                        duration: duration,
                    };
                }
                if (status === 'failed') {
                    throw new Error('Video generation failed');
                }
                // Wait before polling again
                await new Promise(resolve => setTimeout(resolve, intervalMs));
            }
            catch (error) {
                logger_1.default.error('Error polling for video completion', { attempt, taskId, error });
                throw error;
            }
        }
        throw new Error('Video generation timed out');
    }
    /**
     * Generate video from image
     */
    async generateVideoFromImage(image, prompt, duration = 15) {
        try {
            logger_1.default.info('Generating video from image with Seedance 2.0', {
                prompt: prompt.substring(0, 50),
                duration,
            });
            const formData = new FormData();
            formData.append('image', image);
            formData.append('prompt', prompt);
            formData.append('duration', duration.toString());
            const response = await this.apiClient.post('/v1/videos/image-to-video', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            if (response.data.code !== 0) {
                throw new Error(response.data.message || 'Failed to generate video from image');
            }
            const { task_id } = response.data.data;
            const result = await this.pollForCompletion(task_id);
            return {
                success: true,
                videoUrl: result.videoUrl,
                videoId: task_id,
                thumbnailUrl: result.thumbnailUrl,
                duration: result.duration,
                cost: duration * 1.0,
            };
        }
        catch (error) {
            logger_1.default.error('Failed to generate video from image with Seedance 2.0', {
                error: error.response?.data || error.message,
            });
            return {
                success: false,
                error: error.response?.data?.error?.message || error.message,
            };
        }
    }
}
exports.SeedanceVideoGenerator = SeedanceVideoGenerator;
/**
 * HeyGen Video Generator (Alternative)
 */
class HeyGenVideoGenerator {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.apiClient = axios_1.default.create({
            baseURL: 'https://api.heygen.com',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
            },
        });
    }
    /**
     * Generate video using HeyGen
     */
    async generateVideo(options) {
        try {
            logger_1.default.info('Generating video with HeyGen', {
                prompt: options.prompt.substring(0, 50),
            });
            const response = await this.apiClient.post('/v1/videoing.new_templates', {
                title: options.prompt.substring(0, 50),
                video_inputs: [
                    {
                        character: {
                            type: 'avatar',
                            avatar_id: 'default_avatar',
                        },
                        voice: {
                            type: 'text',
                            input_text: options.prompt,
                            voice_id: 'default_voice',
                        },
                    },
                ],
            });
            if (response.data.error) {
                throw new Error(response.data.error.message);
            }
            const { video_id } = response.data.data;
            // Poll for completion
            const result = await this.pollForCompletion(video_id);
            // HeyGen pricing varies, using approximate cost
            const cost = (options.duration || 15) * 0.05;
            return {
                success: true,
                videoUrl: result.videoUrl,
                videoId: video_id,
                thumbnailUrl: result.thumbnailUrl,
                duration: result.duration,
                cost,
            };
        }
        catch (error) {
            logger_1.default.error('Failed to generate video with HeyGen', {
                error: error.response?.data || error.message,
            });
            return {
                success: false,
                error: error.response?.data?.error?.message || error.message,
            };
        }
    }
    /**
     * Poll for video generation completion
     */
    async pollForCompletion(videoId, maxAttempts = 60, intervalMs = 2000) {
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            try {
                const response = await this.apiClient.get(`/v1/videoing.status/${videoId}`);
                const { status, video_url, thumbnail_url, duration } = response.data.data;
                if (status === 'completed') {
                    return {
                        videoUrl: video_url,
                        thumbnailUrl: thumbnail_url,
                        duration: duration,
                    };
                }
                if (status === 'failed') {
                    throw new Error('Video generation failed');
                }
                await new Promise(resolve => setTimeout(resolve, intervalMs));
            }
            catch (error) {
                logger_1.default.error('Error polling for video completion', { attempt, videoId, error });
                throw error;
            }
        }
        throw new Error('Video generation timed out');
    }
}
exports.HeyGenVideoGenerator = HeyGenVideoGenerator;
exports.default = SeedanceVideoGenerator;
