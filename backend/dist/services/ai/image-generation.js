"use strict";
/**
 * Image Generation Service
 * Integrates with DALL-E 3 and other image generation APIs
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DalleImageGenerator = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = __importDefault(require("../../utils/logger"));
/**
 * DALL-E 3 Configuration
 */
class DalleImageGenerator {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.apiClient = axios_1.default.create({
            baseURL: 'https://api.openai.com/v1',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
            },
        });
    }
    /**
     * Generate images using DALL-E 3
     */
    async generateImages(options) {
        try {
            logger_1.default.info('Generating images with DALL-E 3', {
                prompt: options.prompt.substring(0, 50),
                style: options.style,
                size: options.size,
            });
            const response = await this.apiClient.post('/images/generations', {
                model: 'dall-e-3',
                prompt: options.prompt,
                n: options.n || 1,
                size: options.size || '1024x1024',
                quality: options.quality || 'standard',
                style: options.style || 'vivid',
            });
            const images = response.data.data.map((item) => ({
                url: item.url,
                revisedPrompt: item.revised_prompt,
            }));
            // Calculate cost (DALL-E 3 pricing)
            const cost = this.calculateCost(options.size || '1024x1024', options.quality || 'standard', options.n || 1);
            logger_1.default.info('Successfully generated images', {
                count: images.length,
                cost,
            });
            return {
                success: true,
                images,
                cost,
            };
        }
        catch (error) {
            logger_1.default.error('Failed to generate images with DALL-E 3', {
                error: error.response?.data || error.message,
            });
            return {
                success: false,
                error: error.response?.data?.error?.message || error.message,
            };
        }
    }
    /**
     * Calculate DALL-E 3 generation cost
     * Pricing as of 2024
     */
    calculateCost(size, quality, count) {
        let baseCost = 0;
        if (size === '1024x1024') {
            baseCost = quality === 'hd' ? 0.08 : 0.04;
        }
        else if (size === '1792x1024' || size === '1024x1792') {
            baseCost = quality === 'hd' ? 0.08 : 0.04;
        }
        return baseCost * count;
    }
    /**
     * Edit image (DALL-E 2 only)
     * Note: DALL-E 3 does not support editing
     */
    async editImage(image, mask, prompt, n = 1) {
        try {
            const formData = new FormData();
            formData.append('image', image);
            formData.append('mask', mask);
            formData.append('prompt', prompt);
            formData.append('n', n.toString());
            formData.append('size', '1024x1024');
            const response = await axios_1.default.post('https://api.openai.com/v1/images/edits', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${this.apiKey}`,
                },
            });
            const images = response.data.data.map((item) => ({
                url: item.url,
            }));
            return {
                success: true,
                images,
                cost: 0.02 * n, // DALL-E 2 editing cost
            };
        }
        catch (error) {
            logger_1.default.error('Failed to edit image with DALL-E', {
                error: error.response?.data || error.message,
            });
            return {
                success: false,
                error: error.response?.data?.error?.message || error.message,
            };
        }
    }
    /**
     * Create image variation (DALL-E 2 only)
     */
    async createVariation(image, n = 1) {
        try {
            const formData = new FormData();
            formData.append('image', image);
            formData.append('n', n.toString());
            formData.append('size', '1024x1024');
            const response = await axios_1.default.post('https://api.openai.com/v1/images/variations', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${this.apiKey}`,
                },
            });
            const images = response.data.data.map((item) => ({
                url: item.url,
            }));
            return {
                success: true,
                images,
                cost: 0.02 * n, // DALL-E 2 variation cost
            };
        }
        catch (error) {
            logger_1.default.error('Failed to create image variation with DALL-E', {
                error: error.response?.data || error.message,
            });
            return {
                success: false,
                error: error.response?.data?.error?.message || error.message,
            };
        }
    }
}
exports.DalleImageGenerator = DalleImageGenerator;
exports.default = DalleImageGenerator;
