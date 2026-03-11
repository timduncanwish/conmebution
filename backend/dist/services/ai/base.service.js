"use strict";
/**
 * Abstract Base AI Service
 * Provides common functionality for all AI provider implementations
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseAIService = void 0;
const logger_1 = __importDefault(require("../../utils/logger"));
/**
 * Abstract base class for AI service implementations
 */
class BaseAIService {
    /**
     * Constructor
     * @param apiKey - API key for the provider
     * @param baseUrl - Base URL for the API
     * @param provider - AI provider identifier
     * @param model - AI model identifier
     */
    constructor(apiKey, baseUrl, provider, model) {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
        this.provider = provider;
        this.model = model;
        logger_1.default.info(`AI service initialized: ${provider}`, { model, baseUrl });
    }
    /**
     * Handle and convert errors to AIServiceError
     * @param error - Original error
     * @returns Formatted AIServiceError
     */
    handleError(error) {
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
    calculateCost(inputAmount, outputAmount, pricing) {
        return (inputAmount * pricing.inputCost) + (outputAmount * pricing.outputCost);
    }
}
exports.BaseAIService = BaseAIService;
