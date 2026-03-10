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
  AIServiceError
} from '../../types/ai.types';
import { BaseAIService } from './base.service';
import { GLMService } from './glm.service';
import { OpenAIService } from './openai.service';
import { GeminiService } from './gemini.service';

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
  private services: Map<AIProvider, BaseAIService>;
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
          } as AIServiceError;
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
        lastError = error as AIServiceError;
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
    } as AIServiceError;
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
    options?: any
  ): Promise<CostEstimate> {
    const service = this.services.get(provider);

    if (!service) {
      throw {
        code: 'SERVICE_NOT_AVAILABLE',
        message: `AI service not available for provider: ${provider}`,
        provider,
        retryable: false
      } as AIServiceError;
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
      const serviceError = error as AIServiceError;
      logger.error('Cost estimation failed', serviceError);
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

  /**
   * Get default provider
   * @returns Default provider identifier
   */
  getDefaultProvider(): AIProvider {
    return this.defaultProvider;
  }

  /**
   * Set default provider
   * @param provider - Provider to set as default
   */
  setDefaultProvider(provider: AIProvider): void {
    if (!this.services.has(provider)) {
      logger.warn(`Cannot set default provider: ${provider} not available`);
      return;
    }
    this.defaultProvider = provider;
    logger.info(`Default provider set to ${provider}`);
  }

  /**
   * Check if a specific provider is available
   * @param provider - Provider to check
   * @returns True if provider is available
   */
  isProviderAvailable(provider: AIProvider): boolean {
    return this.services.has(provider);
  }

  /**
   * Get service instance for a specific provider
   * @param provider - Provider to get service for
   * @returns Service instance or undefined
   */
  getService(provider: AIProvider): BaseAIService | undefined {
    return this.services.get(provider);
  }
}

/**
 * Singleton instance of AI Service Manager
 */
export const aiServiceManager = new AIServiceManager();
