"use strict";
/**
 * Image and Video Generation API Routes
 * REST endpoints for media generation
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const image_generation_1 = require("../../services/ai/image-generation");
const video_generation_1 = require("../../services/ai/video-generation");
const config_1 = __importDefault(require("../../config"));
const logger_1 = __importDefault(require("../../utils/logger"));
const router = (0, express_1.Router)();
/**
 * POST /api/generate/image
 * Generate images using DALL-E 3
 */
router.post('/image', async (req, res) => {
    try {
        const { prompt, style = 'vivid', quality = 'standard', size = '1024x1024', n = 1 } = req.body;
        if (!prompt || typeof prompt !== 'string' || prompt.length < 10) {
            return res.status(400).json({
                success: false,
                error: {
                    type: 'VALIDATION_ERROR',
                    message: 'Prompt must be at least 10 characters',
                },
            });
        }
        logger_1.default.info('Image generation request received', {
            promptLength: prompt.length,
            style,
            quality,
            size,
        });
        // Check if API key is configured
        if (!config_1.default.ai.openai.apiKey) {
            return res.status(500).json({
                success: false,
                error: {
                    type: 'CONFIGURATION_ERROR',
                    message: 'OpenAI API key not configured',
                },
            });
        }
        const imageGenerator = new image_generation_1.DalleImageGenerator(config_1.default.ai.openai.apiKey);
        const result = await imageGenerator.generateImages({
            prompt,
            style,
            quality,
            size,
            n,
        });
        if (result.success) {
            logger_1.default.info('Image generation completed', {
                count: result.images?.length,
                cost: result.cost,
            });
        }
        res.status(result.success ? 200 : 500).json(result);
    }
    catch (error) {
        logger_1.default.error('Image generation failed', {
            error: error.message,
        });
        res.status(500).json({
            success: false,
            error: {
                type: 'GENERATION_ERROR',
                message: error.message || 'Failed to generate images',
            },
        });
    }
});
/**
 * POST /api/generate/video
 * Generate video using Seedance 2.0
 */
router.post('/video', async (req, res) => {
    try {
        const { prompt, duration = 15, resolution = '1080p', style = 'product', ratio = '16:9' } = req.body;
        if (!prompt || typeof prompt !== 'string' || prompt.length < 10) {
            return res.status(400).json({
                success: false,
                error: {
                    type: 'VALIDATION_ERROR',
                    message: 'Prompt must be at least 10 characters',
                },
            });
        }
        logger_1.default.info('Video generation request received', {
            promptLength: prompt.length,
            duration,
            resolution,
            style,
        });
        // Check if API key is configured
        // Note: Using placeholder API key check
        const apiKey = process.env.SEEDANCE_API_KEY || 'demo_key';
        const videoGenerator = new video_generation_1.SeedanceVideoGenerator(apiKey);
        const result = await videoGenerator.generateVideo({
            prompt,
            duration,
            resolution,
            style,
            ratio,
        });
        if (result.success) {
            logger_1.default.info('Video generation completed', {
                videoId: result.videoId,
                duration: result.duration,
                cost: result.cost,
            });
        }
        res.status(result.success ? 200 : 500).json(result);
    }
    catch (error) {
        logger_1.default.error('Video generation failed', {
            error: error.message,
        });
        res.status(500).json({
            success: false,
            error: {
                type: 'GENERATION_ERROR',
                message: error.message || 'Failed to generate video',
            },
        });
    }
});
/**
 * POST /api/generate/video/from-image
 * Generate video from image using Seedance 2.0
 */
router.post('/video/from-image', async (req, res) => {
    try {
        const { image, prompt, duration = 15 } = req.body;
        if (!image || !prompt) {
            return res.status(400).json({
                success: false,
                error: {
                    type: 'VALIDATION_ERROR',
                    message: 'Image and prompt are required',
                },
            });
        }
        logger_1.default.info('Video from image generation request received', {
            promptLength: prompt.length,
            duration,
        });
        // Note: This is a placeholder implementation
        // In production, you would process the actual image file
        const result = {
            success: false,
            error: 'Video from image generation not yet implemented',
        };
        res.status(501).json(result);
    }
    catch (error) {
        logger_1.default.error('Video from image generation failed', {
            error: error.message,
        });
        res.status(500).json({
            success: false,
            error: {
                type: 'GENERATION_ERROR',
                message: error.message || 'Failed to generate video from image',
            },
        });
    }
});
exports.default = router;
