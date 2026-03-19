/**
 * Doubao (ByteDance) AI Service
 * Integrates with Doubao API for text generation
 */

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
 * Based on official Doubao pricing
 */
const DOUBAO_PRICING = {
  input: 0.0008,  // ¥0.0008 per 1K input tokens
  output: 0.002   // ¥0.002 per 1K output tokens
};

/**
 * Doubao AI Service Implementation
 */
export class DoubaoService {
  private apiKey: string;
  private apiBase: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.apiBase = DOUBAO_API_BASE;
  }

  /**
   * Generate text using Doubao API
   */
  async generateText(request: TextGenerationRequest): Promise<TextGenerationResult> {
    const { prompt, options = {} } = request;

    try {
      const response = await fetch(`${this.apiBase}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: DOUBAO_MODEL,
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

      // Extract generated content
      const content = data.choices[0]?.message?.content || '';
      const usage = data.usage || {};

      // Calculate tokens used
      const inputTokens = usage.prompt_tokens || this.estimateTokens(prompt);
      const outputTokens = usage.completion_tokens || this.estimateTokens(content);
      const totalTokens = usage.total_tokens || inputTokens + outputTokens;

      // Calculate cost (convert CNY to USD)
      const exchangeRate = 0.14; // 1 CNY ≈ 0.14 USD
      const inputCost = (inputTokens / 1000) * DOUBAO_PRICING.input * exchangeRate;
      const outputCost = (outputTokens / 1000) * DOUBAO_PRICING.output * exchangeRate;
      const totalCost = inputCost + outputCost;

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
    const outputTokens = Math.ceil(inputTokens * 0.75); // Estimate output as 75% of input

    // Calculate cost (convert CNY to USD)
    const exchangeRate = 0.14; // 1 CNY ≈ 0.14 USD
    const inputCost = (inputTokens / 1000) * DOUBAO_PRICING.input * exchangeRate;
    const outputCost = (outputTokens / 1000) * DOUBAO_PRICING.output * exchangeRate;
    const totalCost = inputCost + outputCost;

    return {
      estimatedTokens: inputTokens + outputTokens,
      estimatedCost: totalCost,
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
      const response = await fetch(`${this.apiBase}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: DOUBAO_MODEL,
          messages: [
            {
              role: 'user',
              content: 'Hi'
            }
          ],
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
   * Chinese: ~1.5 characters per token
   * English: ~4 characters per token
   */
  private estimateTokens(text: string): number {
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const nonChineseChars = text.length - chineseChars;

    const chineseTokens = Math.ceil(chineseChars / 1.5);
    const nonChineseTokens = Math.ceil(nonChineseChars / 4);

    return chineseTokens + nonChineseTokens;
  }
}
