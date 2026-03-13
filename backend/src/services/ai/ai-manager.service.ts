/**
 * AI Service Manager
 * Coordinates multiple AI services with automatic fallback mechanism
 */

import logger from '../../utils/logger';
import config from '../../config';
import {
  AIProvider,
  TextGenerationRequest,
  TextGenerationResult,
  CostEstimate,
  AIServiceError,
  GenerateTextOptions
} from '../../types/ai.types';
import { BaseAIService } from './base.service';
import { GLMService } from './glm.service';
import { OpenAIService } from './openai.service';
import { GeminiService } from './gemini.service';
import { MockAIService } from './mock.service';

/**
 * Fallback chain configuration
 * Defines the order of fallback providers for each primary provider
 */
const FALLBACK_CHAIN: Record<AIProvider, AIProvider[]> = {
  [AIProvider.GLM_4]: [AIProvider.GPT_4, AIProvider.GEMINI_PRO],
  [AIProvider.GPT_4]: [AIProvider.GLM_4, AIProvider.GEMINI_PRO],
  [AIProvider.GEMINI_PRO]: [AIProvider.GLM_4, AIProvider.GPT_4]
};

/**
 * AI Service Manager
 * Manages multiple AI services and provides automatic fallback on failure
 */
export class AIServiceManager {
  private services: Map<AIProvider, any>; // Use 'any' to support both BaseAIService and MockAIService
  private defaultProvider: AIProvider;

  constructor() {
    this.services = new Map();
    this.initializeServices();
    this.defaultProvider = AIProvider.GLM_4;
    logger.info('AI Service Manager initialized', {
      availableProviders: this.getAvailableProviders(),
      defaultProvider: this.defaultProvider
    });
  }

  /**
   * Initialize all available AI services based on API key configuration
   */
  private initializeServices(): void {
    // Check if MOCK mode is enabled
    const useMockService = config.ai.mock?.enabled || false;

    if (useMockService) {
      // Initialize Mock service for demo/testing purposes
      const mockService = new MockAIService();
      this.services.set(AIProvider.GLM_4, mockService);
      this.services.set(AIProvider.GPT_4, mockService);
      this.services.set(AIProvider.GEMINI_PRO, mockService);
      logger.info('Mock AI service initialized for all providers');
      return;
    }

    // Normal initialization with real API keys
    if (config.ai.glm.apiKey) {
      this.services.set(AIProvider.GLM_4, new GLMService(config.ai.glm.apiKey));
      logger.info('GLM-4 service initialized');
    } else {
      logger.warn('GLM-4 service not initialized: API key missing');
    }

    if (config.ai.openai.apiKey) {
      this.services.set(AIProvider.GPT_4, new OpenAIService(config.ai.openai.apiKey));
      logger.info('GPT-4 service initialized');
    } else {
      logger.warn('GPT-4 service not initialized: API key missing');
    }

    if (config.ai.gemini.apiKey) {
      this.services.set(AIProvider.GEMINI_PRO, new GeminiService(config.ai.gemini.apiKey));
      logger.info('Gemini Pro service initialized');
    } else {
      logger.warn('Gemini Pro service not initialized: API key missing');
    }

    // If no services are initialized, use Mock service as fallback
    if (this.services.size === 0) {
      logger.warn('No AI services initialized, using Mock service for demo');
      const mockService = new MockAIService();
      this.services.set(AIProvider.GLM_4, mockService);
      this.services.set(AIProvider.GPT_4, mockService);
      this.services.set(AIProvider.GEMINI_PRO, mockService);
    }
  }

  /**
   * Generate text with automatic fallback
   * @param request - Text generation request
   * @param enableFallback - Whether to enable fallback mechanism (default: true)
   * @returns Generated text result
   */
  async generateText(
    request: TextGenerationRequest,
    enableFallback: boolean = true
  ): Promise<TextGenerationResult> {
    const primaryProvider = request.provider || this.defaultProvider;
    let currentProvider = primaryProvider;
    let attempts = 0;
    const maxAttempts = 3;
    let lastError: AIServiceError | null = null;

    logger.info('Text generation requested', {
      primaryProvider,
      promptLength: request.prompt.length,
      fallbackEnabled: enableFallback
    });

    while (attempts < maxAttempts) {
      attempts++;

      try {
        const service = this.services.get(currentProvider);

        if (!service) {
          throw {
            code: 'SERVICE_NOT_AVAILABLE',
            message: `AI service not available for provider: ${currentProvider}`,
            provider: currentProvider,
            retryable: true
          };
        }

        logger.info(`Attempt ${attempts}: Using provider ${currentProvider}`);

        const result = await service.generateText({
          ...request,
          provider: currentProvider
        });

        if (attempts > 1) {
          logger.info('Fallback successful', {
            provider: currentProvider,
            attempts,
            previousProvider: primaryProvider
          });
        } else {
          logger.info('Text generation successful', {
            provider: currentProvider,
            tokensUsed: result.tokensUsed.total,
            cost: result.cost
          });
        }

        return result;

      } catch (error) {
        lastError = error && typeof error === 'object' && 'code' in error
          ? error as AIServiceError
          : {
              code: 'UNKNOWN_ERROR',
              message: String(error),
              provider: currentProvider,
              retryable: false
            };
        logger.error(`Attempt ${attempts} failed for provider ${currentProvider}`, {
          error: lastError.message,
          code: lastError.code,
          retryable: lastError.retryable
        });

        // Check if fallback should be attempted
        if (!enableFallback || !lastError.retryable || attempts >= maxAttempts) {
          break;
        }

        // Get next provider in fallback chain
        const fallbackChain = FALLBACK_CHAIN[currentProvider];
        const nextProvider = fallbackChain?.find(
          provider => this.services.has(provider)
        );

        if (!nextProvider) {
          logger.warn('No more fallback providers available');
          break;
        }

        currentProvider = nextProvider;
        logger.info(`Falling back to ${nextProvider}`, {
          from: currentProvider,
          to: nextProvider
        });
      }
    }

    // All attempts failed
    logger.error('All text generation attempts failed', {
      attempts,
      lastError: lastError?.message
    });

    throw lastError || {
      code: 'GENERATION_FAILED',
      message: 'Failed to generate text after multiple attempts',
      provider: primaryProvider,
      retryable: false
    };
  }

  /**
   * Estimate cost for text generation
   * @param prompt - Input prompt
   * @param provider - AI provider to estimate for
   * @param options - Generation options
   * @returns Cost estimate
   */
  async estimateCost(
    prompt: string,
    provider: AIProvider,
    options?: GenerateTextOptions
  ): Promise<CostEstimate> {
    const service = this.services.get(provider);

    if (!service) {
      // 提供基于字符的默认成本估算
      logger.warn(`AI service not available for ${provider}, using default cost estimation`);

      const estimatedTokens = Math.ceil(prompt.length / 2); // 粗略估算：2字符≈1token
      const estimatedOutputTokens = Math.ceil(estimatedTokens * 0.75); // 输出通常是输入的75%

      // 默认定价（每1000 tokens的价格）
      const defaultPricing = {
        [AIProvider.GLM_4]: { input: 0.001, output: 0.002 },
        [AIProvider.GPT_4]: { input: 0.03, output: 0.06 },
        [AIProvider.GEMINI_PRO]: { input: 0.001, output: 0.002 }
      };

      const pricing = defaultPricing[provider] || defaultPricing[AIProvider.GLM_4];
      const inputCost = (estimatedTokens / 1000) * pricing.input;
      const outputCost = (estimatedOutputTokens / 1000) * pricing.output;

      return {
        estimatedTokens: estimatedTokens + estimatedOutputTokens,
        estimatedCost: inputCost + outputCost,
        currency: 'USD',
        breakdown: {
          input: inputCost,
          output: outputCost
        }
      };
    }

    logger.info('Cost estimation requested', {
      provider,
      promptLength: prompt.length
    });

    try {
      const estimate = await service.estimateCost(prompt, options);
      logger.info('Cost estimation successful', {
        provider,
        estimatedTokens: estimate.estimatedTokens,
        estimatedCost: estimate.estimatedCost
      });
      return estimate;
    } catch (error) {
      const serviceError = error && typeof error === 'object' && 'code' in error
        ? error as AIServiceError
        : {
            code: 'UNKNOWN_ERROR',
            message: String(error),
            provider,
            retryable: false
          };
      logger.error('Cost estimation failed', {
        code: serviceError.code,
        message: serviceError.message,
        provider: serviceError.provider
      });
      throw serviceError;
    }
  }

  /**
   * Validate all configured AI services
   * @returns Map of provider to validation status
   */
  async validateAllServices(): Promise<Map<AIProvider, boolean>> {
    const validationResults = new Map<AIProvider, boolean>();

    logger.info('Validating all AI services');

    const validationPromises = Array.from(this.services.entries()).map(
      async ([provider, service]) => {
        try {
          const isValid = await service.validateApiKey();
          validationResults.set(provider, isValid);
          logger.info(`Service validation result: ${provider}`, {
            valid: isValid
          });
          return [provider, isValid] as [AIProvider, boolean];
        } catch (error) {
          validationResults.set(provider, false);
          logger.error(`Service validation failed: ${provider}`, error);
          return [provider, false] as [AIProvider, boolean];
        }
      }
    );

    await Promise.all(validationPromises);

    const summary = Object.fromEntries(validationResults);
    logger.info('All services validated', summary);

    return validationResults;
  }

  /**
   * Get list of available providers
   * @returns Array of available provider identifiers
   */
  getAvailableProviders(): AIProvider[] {
    return Array.from(this.services.keys());
  }

}

/**
 * Singleton instance of AI Service Manager
 */
export const aiServiceManager = new AIServiceManager();
