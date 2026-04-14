/**
 * Doubao (ByteDance) AI Service
 * Integrates with Doubao API for text generation
 */

import logger from '../../utils/logger';
import { BaseAIService } from './base.service';
import {
  TextGenerationRequest,
  TextGenerationResult,
  CostEstimate,
  GenerateTextOptions,
  AIProvider,
  AIModel,
  AIServiceError
} from '../../types/ai.types';

/**
 * Doubao API configuration
 */
const DOUBAO_API_BASE = 'https://ark.cn-beijing.volces.com/api/v3';
const DOUBAO_MODEL = 'ep-20250401134129-qzlfj'; // Doubao model endpoint ID

/**
 * Doubao API pricing (per 1K tokens)
 */
const DOUBAO_PRICING = {
  input: 0.0008,  // ¥0.0008 per 1K input tokens
  output: 0.002   // ¥0.002 per 1K output tokens
};

/**
 * Doubao AI Service Implementation
 */
export class DoubaoService extends BaseAIService {
  private doubaoModel: string;

  constructor(apiKey: string) {
    super(apiKey, DOUBAO_API_BASE, AIProvider.DOUBAO, AIModel.DOUBAO_PRO);
    this.doubaoModel = DOUBAO_MODEL;
  }

  protected getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
    };
  }

  /**
   * Generate text using Doubao API
   */
  async generateText(request: TextGenerationRequest): Promise<TextGenerationResult> {
    const { prompt, options = {} } = request;

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          model: this.doubaoModel,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 2000,
          top_p: options.topP ?? 0.9
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw {
          code: 'API_REQUEST_FAILED',
          message: `Doubao API request failed: ${response.status} ${response.statusText}`,
          provider: AIProvider.DOUBAO,
          retryable: response.status >= 500 || response.status === 429,
          originalError: errorData
        } as AIServiceError;
      }

      const data: any = await response.json();

      const content = data.choices[0]?.message?.content || '';
      const usage = data.usage || {};

      const inputTokens = usage.prompt_tokens || this.estimateTokens(prompt);
      const outputTokens = usage.completion_tokens || this.estimateTokens(content);
      const totalTokens = usage.total_tokens || inputTokens + outputTokens;

      // Calculate cost (convert CNY to USD)
      const exchangeRate = 0.14;
      const totalCost = this.calculateCost(inputTokens, outputTokens, {
        inputCost: DOUBAO_PRICING.input * exchangeRate / 1000,
        outputCost: DOUBAO_PRICING.output * exchangeRate / 1000,
      });

      return {
        content,
        provider: AIProvider.DOUBAO,
        model: AIModel.DOUBAO_PRO,
        tokensUsed: {
          input: inputTokens,
          output: outputTokens,
          total: totalTokens
        },
        cost: totalCost,
        timestamp: new Date()
      };

    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error) {
        throw error;
      }

      throw {
        code: 'DOUBAO_SERVICE_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        provider: AIProvider.DOUBAO,
        retryable: false,
        originalError: error
      } as AIServiceError;
    }
  }

  /**
   * Estimate cost for text generation
   */
  async estimateCost(prompt: string, options?: GenerateTextOptions): Promise<CostEstimate> {
    const inputTokens = this.estimateTokens(prompt);
    const outputTokens = Math.ceil(inputTokens * 0.75);

    const exchangeRate = 0.14;
    const inputCost = (inputTokens / 1000) * DOUBAO_PRICING.input * exchangeRate;
    const outputCost = (outputTokens / 1000) * DOUBAO_PRICING.output * exchangeRate;

    return {
      estimatedTokens: inputTokens + outputTokens,
      estimatedCost: inputCost + outputCost,
      currency: 'USD',
      breakdown: {
        input: inputCost,
        output: outputCost
      }
    };
  }

  /**
   * Validate API key
   */
  async validateApiKey(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          model: this.doubaoModel,
          messages: [{ role: 'user', content: 'Hi' }],
          max_tokens: 5
        })
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Estimate tokens from text (rough approximation)
   */
  private estimateTokens(text: string): number {
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const nonChineseChars = text.length - chineseChars;
    return Math.ceil(chineseChars / 1.5) + Math.ceil(nonChineseChars / 4);
  }
}
