/**
 * Google Gemini Pro Service Implementation
 * Implements AI service for Google's Gemini Pro model
 */

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
      AIModel.GEMINI_PRO,
      {
        inputCost: 0.000001, // $0.000001 per character
        outputCost: 0.000001, // $0.000001 per character
        currency: 'USD',
        unit: 'character',
      }
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
      const response = await this.client.post(
        `/models/gemini-pro:generateContent?key=${this.apiKey}`,
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
        }
      );

      const data = response.data;
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      // Gemini uses character count for pricing
      const inputCharacters = request.prompt.length;
      const outputCharacters = content.length;

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
        cost: this.calculateCost(inputCharacters, outputCharacters),
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

    const inputCost = inputCharacters * this.pricing.inputCost;
    const outputCost = estimatedOutputCharacters * this.pricing.outputCost;

    // Estimate tokens
    const estimatedInputTokens = Math.ceil(inputCharacters / 4);
    const estimatedOutputTokens = Math.ceil(estimatedOutputCharacters / 4);

    return {
      estimatedTokens: estimatedInputTokens + estimatedOutputTokens,
      estimatedCost: inputCost + outputCost,
      currency: this.pricing.currency,
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
      await this.client.post(`/models/gemini-pro:generateContent?key=${this.apiKey}`, {
        contents: [
          {
            parts: [
              {
                text: 'test',
              },
            ],
          },
        ],
      });
      return true;
    } catch (error) {
      const serviceError = this.handleError(error);
      logger.error('Gemini Pro API key validation failed', serviceError);
      return false;
    }
  }
}
