/**
 * Abstract Base AI Service
 * Provides common functionality for all AI provider implementations
 */

import axios, { AxiosInstance } from 'axios';
import logger from '../../utils/logger';
import {
  AIProvider,
  AIModel,
  TextGenerationRequest,
  TextGenerationResult,
  CostEstimate,
  AIServiceError,
  ProviderPricing
} from '../../types/ai.types';

/**
 * Abstract base class for AI service implementations
 */
export abstract class BaseAIService {
  protected client: AxiosInstance;
  protected provider: AIProvider;
  protected model: AIModel;
  protected apiKey: string;
  protected pricing: ProviderPricing;

  /**
   * Constructor
   * @param apiKey - API key for the provider
   * @param baseUrl - Base URL for the API
   * @param provider - AI provider identifier
   * @param model - AI model identifier
   * @param pricing - Pricing configuration
   */
  constructor(
    apiKey: string,
    baseUrl: string,
    provider: AIProvider,
    model: AIModel,
    pricing: ProviderPricing
  ) {
    this.apiKey = apiKey;
    this.provider = provider;
    this.model = model;
    this.pricing = pricing;

    this.client = axios.create({
      baseURL: baseUrl,
      headers: this.getHeaders(),
      timeout: 30000,
    });

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
   * Calculate cost based on token usage
   * @param inputTokens - Number of input tokens
   * @param outputTokens - Number of output tokens
   * @returns Cost in provider's currency
   */
  protected calculateCost(inputTokens: number, outputTokens: number): number {
    const inputCost = inputTokens * this.pricing.inputCost;
    const outputCost = outputTokens * this.pricing.outputCost;
    return inputCost + outputCost;
  }

  /**
   * Estimate token count from text (rough estimate: 1 token ≈ 4 characters for English)
   * @param text - Input text
   * @returns Estimated token count
   */
  protected estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }
}
