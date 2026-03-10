/**
 * Google Gemini Pro Service Implementation
 * Implements AI service for Google's Gemini Pro model
 */

import axios from 'axios';
import { BaseAIService } from './base.service';
import {
  AIProvider,
  AIModel,
  TextGenerationRequest,
  TextGenerationResult,
  CostEstimate,
  GenerateTextOptions
} from '../../types/ai.types';
import logger from '../../utils/logger';

/**
 * Gemini Pro Service Implementation
 */
export class GeminiService extends BaseAIService {
  constructor(apiKey: string) {
    super(
      apiKey,
      'https://generativelanguage.googleapis.com/v1beta',
      AIProvider.GEMINI_PRO,
      AIModel.GEMINI_PRO
    );
  }

  /**
   * Get Gemini-specific headers
   */
  protected getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
    };
  }

  /**
   * Generate text using Gemini Pro
   */
  async generateText(request: TextGenerationRequest): Promise<TextGenerationResult> {
    try {
      logger.info('Gemini Pro text generation requested', { promptLength: request.prompt.length });

      const options = request.options || {};
      const response = await axios.post(
        `${this.baseUrl}/models/gemini-pro:generateContent?key=${this.apiKey}`,
        {
          contents: [
            {
              parts: [
                {
                  text: request.prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: options.temperature ?? 0.7,
            maxOutputTokens: options.maxTokens ?? 2000,
            topP: options.topP ?? 0.9,
          },
        },
        {
          headers: this.getHeaders(),
          timeout: 30000,
        }
      );

      const data = response.data;
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      // Gemini uses character count for pricing: $0.000001 per character
      const inputCharacters = request.prompt.length;
      const outputCharacters = content.length;
      const geminiPricing = { inputCost: 0.000001, outputCost: 0.000001 };
      const cost = this.calculateCost(inputCharacters, outputCharacters, geminiPricing);

      // Estimate tokens (rough approximation: 1 token ≈ 4 characters)
      const inputTokens = Math.ceil(inputCharacters / 4);
      const outputTokens = Math.ceil(outputCharacters / 4);

      const result: TextGenerationResult = {
        content,
        provider: this.provider,
        model: this.model,
        tokensUsed: {
          input: inputTokens,
          output: outputTokens,
          total: inputTokens + outputTokens,
        },
        cost,
        timestamp: new Date(),
      };

      logger.info('Gemini Pro text generation successful', {
        tokensUsed: result.tokensUsed.total,
        cost: result.cost,
      });

      return result;
    } catch (error) {
      const serviceError = this.handleError(error);
      logger.error('Gemini Pro text generation failed', serviceError);
      throw serviceError;
    }
  }

  /**
   * Estimate cost for Gemini Pro generation
   */
  async estimateCost(prompt: string, options?: GenerateTextOptions): Promise<CostEstimate> {
    const inputCharacters = prompt.length;
    const maxTokens = options?.maxTokens ?? 2000;
    const estimatedOutputCharacters = Math.min(maxTokens * 4, inputCharacters * 2);

    // Gemini pricing: $0.000001 per character
    const inputCost = inputCharacters * 0.000001;
    const outputCost = estimatedOutputCharacters * 0.000001;

    // Estimate tokens
    const estimatedInputTokens = Math.ceil(inputCharacters / 4);
    const estimatedOutputTokens = Math.ceil(estimatedOutputCharacters / 4);

    return {
      estimatedTokens: estimatedInputTokens + estimatedOutputTokens,
      estimatedCost: inputCost + outputCost,
      currency: 'USD',
      breakdown: {
        input: inputCost,
        output: outputCost,
      },
    };
  }

  /**
   * Validate Gemini API key
   */
  async validateApiKey(): Promise<boolean> {
    try {
      await axios.post(
        `${this.baseUrl}/models/gemini-pro:generateContent?key=${this.apiKey}`,
        {
          contents: [
            {
              parts: [
                {
                  text: 'test',
                },
              ],
            },
          ],
        },
        {
          headers: this.getHeaders(),
          timeout: 30000,
        }
      );
      return true;
    } catch (error) {
      const serviceError = this.handleError(error);
      logger.error('Gemini Pro API key validation failed', serviceError);
      return false;
    }
  }
}
