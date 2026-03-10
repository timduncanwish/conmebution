/**
 * OpenAI GPT-4 Service Implementation
 * Implements AI service for OpenAI's GPT-4 model
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
 * OpenAI GPT-4 Service Implementation
 */
export class OpenAIService extends BaseAIService {
  constructor(apiKey: string) {
    super(
      apiKey,
      'https://api.openai.com/v1',
      AIProvider.GPT_4,
      AIModel.GPT_4,
      {
        inputCost: 0.00003, // $0.00003 per token
        outputCost: 0.00006, // $0.00006 per token
        currency: 'USD',
        unit: 'token',
      }
    );
  }

  /**
   * Get OpenAI-specific headers
   */
  protected getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
    };
  }

  /**
   * Generate text using GPT-4
   */
  async generateText(request: TextGenerationRequest): Promise<TextGenerationResult> {
    try {
      logger.info('GPT-4 text generation requested', { promptLength: request.prompt.length });

      const options = request.options || {};
      const response = await this.client.post('/chat/completions', {
        model: 'gpt-4',
        messages: [
          {
            role: 'user',
            content: request.prompt,
          },
        ],
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 2000,
        top_p: options.topP ?? 0.9,
      });

      const data = response.data;
      const content = data.choices[0]?.message?.content || '';
      const inputTokens = data.usage?.prompt_tokens || this.estimateTokens(request.prompt);
      const outputTokens = data.usage?.completion_tokens || this.estimateTokens(content);

      const result: TextGenerationResult = {
        content,
        provider: this.provider,
        model: this.model,
        tokensUsed: {
          input: inputTokens,
          output: outputTokens,
          total: inputTokens + outputTokens,
        },
        cost: this.calculateCost(inputTokens, outputTokens),
        timestamp: new Date(),
      };

      logger.info('GPT-4 text generation successful', {
        tokensUsed: result.tokensUsed.total,
        cost: result.cost,
      });

      return result;
    } catch (error) {
      const serviceError = this.handleError(error);
      logger.error('GPT-4 text generation failed', serviceError);
      throw serviceError;
    }
  }

  /**
   * Estimate cost for GPT-4 generation
   */
  async estimateCost(prompt: string, options?: GenerateTextOptions): Promise<CostEstimate> {
    const estimatedInputTokens = this.estimateTokens(prompt);
    const maxTokens = options?.maxTokens ?? 2000;
    const estimatedOutputTokens = Math.min(maxTokens, estimatedInputTokens * 2);

    const inputCost = estimatedInputTokens * this.pricing.inputCost;
    const outputCost = estimatedOutputTokens * this.pricing.outputCost;

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
   * Validate OpenAI API key
   */
  async validateApiKey(): Promise<boolean> {
    try {
      await this.client.post('/chat/completions', {
        model: 'gpt-4',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 1,
      });
      return true;
    } catch (error) {
      const serviceError = this.handleError(error);
      logger.error('GPT-4 API key validation failed', serviceError);
      return false;
    }
  }
}
