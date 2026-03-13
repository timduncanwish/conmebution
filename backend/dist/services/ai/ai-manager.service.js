"use strict";
/**
 * AI Service Manager
 * Coordinates multiple AI services with automatic fallback mechanism
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiServiceManager = exports.AIServiceManager = void 0;
const logger_1 = __importDefault(require("../../utils/logger"));
const config_1 = __importDefault(require("../../config"));
const ai_types_1 = require("../../types/ai.types");
const glm_service_1 = require("./glm.service");
const openai_service_1 = require("./openai.service");
const gemini_service_1 = require("./gemini.service");
/**
 * Fallback chain configuration
 * Defines the order of fallback providers for each primary provider
 */
const FALLBACK_CHAIN = {
    [ai_types_1.AIProvider.GLM_4]: [ai_types_1.AIProvider.GPT_4, ai_types_1.AIProvider.GEMINI_PRO],
    [ai_types_1.AIProvider.GPT_4]: [ai_types_1.AIProvider.GLM_4, ai_types_1.AIProvider.GEMINI_PRO],
    [ai_types_1.AIProvider.GEMINI_PRO]: [ai_types_1.AIProvider.GLM_4, ai_types_1.AIProvider.GPT_4]
};
/**
 * AI Service Manager
 * Manages multiple AI services and provides automatic fallback on failure
 */
class AIServiceManager {
    constructor() {
        this.services = new Map();
        this.initializeServices();
        this.defaultProvider = ai_types_1.AIProvider.GLM_4;
        logger_1.default.info('AI Service Manager initialized', {
            availableProviders: this.getAvailableProviders(),
            defaultProvider: this.defaultProvider
        });
    }
    /**
     * Initialize all available AI services based on API key configuration
     */
    initializeServices() {
        if (config_1.default.ai.glm.apiKey) {
            this.services.set(ai_types_1.AIProvider.GLM_4, new glm_service_1.GLMService(config_1.default.ai.glm.apiKey));
            logger_1.default.info('GLM-4 service initialized');
        }
        else {
            logger_1.default.warn('GLM-4 service not initialized: API key missing');
        }
        if (config_1.default.ai.openai.apiKey) {
            this.services.set(ai_types_1.AIProvider.GPT_4, new openai_service_1.OpenAIService(config_1.default.ai.openai.apiKey));
            logger_1.default.info('GPT-4 service initialized');
        }
        else {
            logger_1.default.warn('GPT-4 service not initialized: API key missing');
        }
        if (config_1.default.ai.gemini.apiKey) {
            this.services.set(ai_types_1.AIProvider.GEMINI_PRO, new gemini_service_1.GeminiService(config_1.default.ai.gemini.apiKey));
            logger_1.default.info('Gemini Pro service initialized');
        }
        else {
            logger_1.default.warn('Gemini Pro service not initialized: API key missing');
        }
    }
    /**
     * Generate text with automatic fallback
     * @param request - Text generation request
     * @param enableFallback - Whether to enable fallback mechanism (default: true)
     * @returns Generated text result
     */
    async generateText(request, enableFallback = true) {
        const primaryProvider = request.provider || this.defaultProvider;
        let currentProvider = primaryProvider;
        let attempts = 0;
        const maxAttempts = 3;
        let lastError = null;
        logger_1.default.info('Text generation requested', {
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
                logger_1.default.info(`Attempt ${attempts}: Using provider ${currentProvider}`);
                const result = await service.generateText({
                    ...request,
                    provider: currentProvider
                });
                if (attempts > 1) {
                    logger_1.default.info('Fallback successful', {
                        provider: currentProvider,
                        attempts,
                        previousProvider: primaryProvider
                    });
                }
                else {
                    logger_1.default.info('Text generation successful', {
                        provider: currentProvider,
                        tokensUsed: result.tokensUsed.total,
                        cost: result.cost
                    });
                }
                return result;
            }
            catch (error) {
                lastError = error && typeof error === 'object' && 'code' in error
                    ? error
                    : {
                        code: 'UNKNOWN_ERROR',
                        message: String(error),
                        provider: currentProvider,
                        retryable: false
                    };
                logger_1.default.error(`Attempt ${attempts} failed for provider ${currentProvider}`, {
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
                const nextProvider = fallbackChain?.find(provider => this.services.has(provider));
                if (!nextProvider) {
                    logger_1.default.warn('No more fallback providers available');
                    break;
                }
                currentProvider = nextProvider;
                logger_1.default.info(`Falling back to ${nextProvider}`, {
                    from: currentProvider,
                    to: nextProvider
                });
            }
        }
        // All attempts failed
        logger_1.default.error('All text generation attempts failed', {
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
    async estimateCost(prompt, provider, options) {
        const service = this.services.get(provider);
        if (!service) {
            // 提供基于字符的默认成本估算
            logger_1.default.warn(`AI service not available for ${provider}, using default cost estimation`);
            const estimatedTokens = Math.ceil(prompt.length / 2); // 粗略估算：2字符≈1token
            const estimatedOutputTokens = Math.ceil(estimatedTokens * 0.75); // 输出通常是输入的75%
            // 默认定价（每1000 tokens的价格）
            const defaultPricing = {
                [ai_types_1.AIProvider.GLM_4]: { input: 0.001, output: 0.002 },
                [ai_types_1.AIProvider.GPT_4]: { input: 0.03, output: 0.06 },
                [ai_types_1.AIProvider.GEMINI_PRO]: { input: 0.001, output: 0.002 }
            };
            const pricing = defaultPricing[provider] || defaultPricing[ai_types_1.AIProvider.GLM_4];
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
        logger_1.default.info('Cost estimation requested', {
            provider,
            promptLength: prompt.length
        });
        try {
            const estimate = await service.estimateCost(prompt, options);
            logger_1.default.info('Cost estimation successful', {
                provider,
                estimatedTokens: estimate.estimatedTokens,
                estimatedCost: estimate.estimatedCost
            });
            return estimate;
        }
        catch (error) {
            const serviceError = error && typeof error === 'object' && 'code' in error
                ? error
                : {
                    code: 'UNKNOWN_ERROR',
                    message: String(error),
                    provider,
                    retryable: false
                };
            logger_1.default.error('Cost estimation failed', {
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
    async validateAllServices() {
        const validationResults = new Map();
        logger_1.default.info('Validating all AI services');
        const validationPromises = Array.from(this.services.entries()).map(async ([provider, service]) => {
            try {
                const isValid = await service.validateApiKey();
                validationResults.set(provider, isValid);
                logger_1.default.info(`Service validation result: ${provider}`, {
                    valid: isValid
                });
                return [provider, isValid];
            }
            catch (error) {
                validationResults.set(provider, false);
                logger_1.default.error(`Service validation failed: ${provider}`, error);
                return [provider, false];
            }
        });
        await Promise.all(validationPromises);
        const summary = Object.fromEntries(validationResults);
        logger_1.default.info('All services validated', summary);
        return validationResults;
    }
    /**
     * Get list of available providers
     * @returns Array of available provider identifiers
     */
    getAvailableProviders() {
        return Array.from(this.services.keys());
    }
}
exports.AIServiceManager = AIServiceManager;
/**
 * Singleton instance of AI Service Manager
 */
exports.aiServiceManager = new AIServiceManager();
