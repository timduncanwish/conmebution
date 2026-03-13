"use strict";
/**
 * Google Gemini Pro Service Implementation
 * Implements AI service for Google's Gemini Pro model
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiService = void 0;
const axios_1 = __importDefault(require("axios"));
const base_service_1 = require("./base.service");
const ai_types_1 = require("../../types/ai.types");
const logger_1 = __importDefault(require("../../utils/logger"));
/**
 * Gemini Pro Service Implementation
 */
class GeminiService extends base_service_1.BaseAIService {
    constructor(apiKey) {
        super(apiKey, 'https://generativelanguage.googleapis.com/v1beta', ai_types_1.AIProvider.GEMINI_PRO, ai_types_1.AIModel.GEMINI_PRO);
    }
    /**
     * Get Gemini-specific headers
     */
    getHeaders() {
        return {
            'Content-Type': 'application/json',
        };
    }
    /**
     * Generate text using Gemini Pro
     */
    async generateText(request) {
        try {
            logger_1.default.info('Gemini Pro text generation requested', { promptLength: request.prompt.length });
            const options = request.options || {};
            const response = await axios_1.default.post(`${this.baseUrl}/models/gemini-pro:generateContent?key=${this.apiKey}`, {
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
            }, {
                headers: this.getHeaders(),
                timeout: 30000,
            });
            const data = response.data;
            const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            // Gemini uses character count for pricing: $0.000001 per character
            const inputCharacters = request.prompt.length;
            const outputCharacters = content.length;
            const geminiPricing = { inputCost: 0.000001, outputCost: 0.000001 };
            const cost = this.calculateCost(inputCharacters, outputCharacters, geminiPricing);
            // Estimate tokens (rough approximation: 1 token ≈ 4 characters)
            const inputTokens = Math.ceil(inputCharacters / 4);
            const outputTokens = Math.ceil(outputCharacters / 4);
            const result = {
                content,
                provider: this.provider,
                model: this.model,
                tokensUsed: {
                    input: inputTokens,
                    output: outputTokens,
                    total: inputTokens + outputTokens,
                },
                cost,
                timestamp: new Date(),
            };
            logger_1.default.info('Gemini Pro text generation successful', {
                tokensUsed: result.tokensUsed.total,
                cost: result.cost,
            });
            return result;
        }
        catch (error) {
            const serviceError = this.handleError(error);
            logger_1.default.error('Gemini Pro text generation failed', serviceError);
            throw serviceError;
        }
    }
    /**
     * Estimate cost for Gemini Pro generation
     */
    async estimateCost(prompt, options) {
        const inputCharacters = prompt.length;
        const maxTokens = options?.maxTokens ?? 2000;
        const estimatedOutputCharacters = Math.min(maxTokens * 4, inputCharacters * 2);
        // Gemini pricing: $0.000001 per character
        const inputCost = inputCharacters * 0.000001;
        const outputCost = estimatedOutputCharacters * 0.000001;
        // Estimate tokens
        const estimatedInputTokens = Math.ceil(inputCharacters / 4);
        const estimatedOutputTokens = Math.ceil(estimatedOutputCharacters / 4);
        return {
            estimatedTokens: estimatedInputTokens + estimatedOutputTokens,
            estimatedCost: inputCost + outputCost,
            currency: 'USD',
            breakdown: {
                input: inputCost,
                output: outputCost,
            },
        };
    }
    /**
     * Validate Gemini API key
     */
    async validateApiKey() {
        try {
            await axios_1.default.post(`${this.baseUrl}/models/gemini-pro:generateContent?key=${this.apiKey}`, {
                contents: [
                    {
                        parts: [
                            {
                                text: 'test',
                            },
                        ],
                    },
                ],
            }, {
                headers: this.getHeaders(),
                timeout: 30000,
            });
            return true;
        }
        catch (error) {
            const serviceError = this.handleError(error);
            logger_1.default.error('Gemini Pro API key validation failed', serviceError);
            return false;
        }
    }
}
exports.GeminiService = GeminiService;
