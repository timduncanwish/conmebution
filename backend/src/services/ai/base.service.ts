/**
 * Abstract Base AI Service
 * Provides common functionality for all AI provider implementations
 */

import logger from '../../utils/logger';
import {
  AIProvider,
  AIModel,
  TextGenerationRequest,
  TextGenerationResult,
  CostEstimate,
  AIServiceError
} from '../../types/ai.types';

/**
 * Abstract base class for AI service implementations
 */
export abstract class BaseAIService {
  protected provider: AIProvider;
  protected model: AIModel;
  protected apiKey: string;
  protected baseUrl: string;

  /**
   * Constructor
   * @param apiKey - API key for the provider
   * @param baseUrl - Base URL for the API
   * @param provider - AI provider identifier
   * @param model - AI model identifier
   */
  constructor(
    apiKey: string,
    baseUrl: string,
    provider: AIProvider,
    model: AIModel
  ) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.provider = provider;
    this.model = model;

    logger.info(`AI service initialized: ${provider}`, { model, baseUrl });
  }

  /**
   * Get provider-specific headers
   */
  protected abstract getHeaders(): Record<string, string>;

  /**
   * Generate text from a prompt
   * @param request - Text generation request
   * @returns Generated text result
   */
  abstract generateText(request: TextGenerationRequest): Promise<TextGenerationResult>;

  /**
   * Estimate cost for text generation
   * @param prompt - Input prompt
   * @param options - Generation options
   * @returns Cost estimate
   */
  abstract estimateCost(prompt: string, options?: TextGenerationRequest['options']): Promise<CostEstimate>;

  /**
   * Validate API key
   * @returns True if API key is valid
   */
  abstract validateApiKey(): Promise<boolean>;

  /**
   * Handle and convert errors to AIServiceError
   * @param error - Original error
   * @returns Formatted AIServiceError
   */
  protected handleError(error: any): AIServiceError {
    // Check if error is from axios
    if (error.response) {
      const statusCode = error.response.status;
      const isRetryable = statusCode >= 500 || statusCode === 429;

      return {
        code: `API_ERROR_${statusCode}`,
        message: error.response.data?.error?.message || error.message || 'API request failed',
        provider: this.provider,
        retryable: isRetryable,
        originalError: error,
      };
    }

    // Network errors
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return {
        code: 'NETWORK_TIMEOUT',
        message: 'Request timed out',
        provider: this.provider,
        retryable: true,
        originalError: error,
      };
    }

    // Unknown errors
    return {
      code: 'UNKNOWN_ERROR',
      message: error.message || 'An unknown error occurred',
      provider: this.provider,
      retryable: false,
      originalError: error,
    };
  }

  /**
   * Calculate cost based on pricing
   * @param inputAmount - Amount of input tokens/characters used
   * @param outputAmount - Amount of output tokens/characters used
   * @param pricing - Pricing configuration with inputCost and outputCost
   * @returns Total calculated cost
   */
  protected calculateCost(
    inputAmount: number,
    outputAmount: number,
    pricing: { inputCost: number; outputCost: number }
  ): number {
    return (inputAmount * pricing.inputCost) + (outputAmount * pricing.outputCost);
  }

}
