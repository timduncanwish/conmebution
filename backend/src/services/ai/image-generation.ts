/**
 * Image Generation Service
 * Integrates with DALL-E 3 and other image generation APIs
 */

import axios, { AxiosInstance } from 'axios';
import logger from '../../utils/logger';

export interface ImageGenerationOptions {
  prompt: string;
  style?: 'natural' | 'vivid' | 'precise';
  quality?: 'standard' | 'hd';
  size?: '1024x1024' | '1792x1024' | '1024x1792';
  n?: number; // Number of images to generate
}

export interface ImageGenerationResult {
  success: boolean;
  images?: Array<{
    url: string;
    revisedPrompt?: string;
  }>;
  error?: string;
  cost?: number;
}

/**
 * DALL-E 3 Configuration
 */
export class DalleImageGenerator {
  private apiKey: string;
  private apiClient: AxiosInstance;

  constructor(apiKey: string) {
    this.apiKey = apiKey;

    this.apiClient = axios.create({
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
  async generateImages(options: ImageGenerationOptions): Promise<ImageGenerationResult> {
    try {
      logger.info('Generating images with DALL-E 3', {
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

      const images = response.data.data.map((item: any) => ({
        url: item.url,
        revisedPrompt: item.revised_prompt,
      }));

      // Calculate cost (DALL-E 3 pricing)
      const cost = this.calculateCost(options.size || '1024x1024', options.quality || 'standard', options.n || 1);

      logger.info('Successfully generated images', {
        count: images.length,
        cost,
      });

      return {
        success: true,
        images,
        cost,
      };
    } catch (error: any) {
      logger.error('Failed to generate images with DALL-E 3', {
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
  private calculateCost(size: string, quality: string, count: number): number {
    let baseCost = 0;

    if (size === '1024x1024') {
      baseCost = quality === 'hd' ? 0.08 : 0.04;
    } else if (size === '1792x1024' || size === '1024x1792') {
      baseCost = quality === 'hd' ? 0.08 : 0.04;
    }

    return baseCost * count;
  }

  /**
   * Edit image (DALL-E 2 only)
   * Note: DALL-E 3 does not support editing
   */
  async editImage(
    image: Buffer,
    mask: Buffer,
    prompt: string,
    n: number = 1
  ): Promise<ImageGenerationResult> {
    try {
      const formData = new FormData();
      formData.append('image', image);
      formData.append('mask', mask);
      formData.append('prompt', prompt);
      formData.append('n', n.toString());
      formData.append('size', '1024x1024');

      const response = await axios.post(
        'https://api.openai.com/v1/images/edits',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      );

      const images = response.data.data.map((item: any) => ({
        url: item.url,
      }));

      return {
        success: true,
        images,
        cost: 0.02 * n, // DALL-E 2 editing cost
      };
    } catch (error: any) {
      logger.error('Failed to edit image with DALL-E', {
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
  async createVariation(image: Buffer, n: number = 1): Promise<ImageGenerationResult> {
    try {
      const formData = new FormData();
      formData.append('image', image);
      formData.append('n', n.toString());
      formData.append('size', '1024x1024');

      const response = await axios.post(
        'https://api.openai.com/v1/images/variations',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      );

      const images = response.data.data.map((item: any) => ({
        url: item.url,
      }));

      return {
        success: true,
        images,
        cost: 0.02 * n, // DALL-E 2 variation cost
      };
    } catch (error: any) {
      logger.error('Failed to create image variation with DALL-E', {
        error: error.response?.data || error.message,
      });

      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
      };
    }
  }
}

export default DalleImageGenerator;
