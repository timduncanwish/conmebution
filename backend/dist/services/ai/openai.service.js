"use strict";
/**
 * OpenAI GPT-4 Service Implementation
 * Implements AI service for OpenAI's GPT-4 model
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIService = void 0;
const axios_1 = __importDefault(require("axios"));
const base_service_1 = require("./base.service");
const ai_types_1 = require("../../types/ai.types");
const logger_1 = __importDefault(require("../../utils/logger"));
/**
 * OpenAI GPT-4 Service Implementation
 */
class OpenAIService extends base_service_1.BaseAIService {
    constructor(apiKey) {
        super(apiKey, 'https://api.openai.com/v1', ai_types_1.AIProvider.GPT_4, ai_types_1.AIModel.GPT_4);
    }
    /**
     * Get OpenAI-specific headers
     */
    getHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
        };
    }
    /**
     * Generate text using GPT-4
     */
    async generateText(request) {
        try {
            logger_1.default.info('GPT-4 text generation requested', { promptLength: request.prompt.length });
            const options = request.options || {};
            const response = await axios_1.default.post(`${this.baseUrl}/chat/completions`, {
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
            }, {
                headers: this.getHeaders(),
                timeout: 30000,
            });
            const data = response.data;
            const content = data.choices[0]?.message?.content || '';
            const inputTokens = data.usage?.prompt_tokens || Math.ceil(request.prompt.length / 4);
            const outputTokens = data.usage?.completion_tokens || Math.ceil(content.length / 4);
            // GPT-4 pricing: $0.00003 per input token, $0.00006 per output token
            const openaiPricing = { inputCost: 0.00003, outputCost: 0.00006 };
            const cost = this.calculateCost(inputTokens, outputTokens, openaiPricing);
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
            logger_1.default.info('GPT-4 text generation successful', {
                tokensUsed: result.tokensUsed.total,
                cost: result.cost,
            });
            return result;
        }
        catch (error) {
            const serviceError = this.handleError(error);
            logger_1.default.error('GPT-4 text generation failed', serviceError);
            throw serviceError;
        }
    }
    /**
     * Estimate cost for GPT-4 generation
     */
    async estimateCost(prompt, options) {
        const estimatedInputTokens = Math.ceil(prompt.length / 4);
        const maxTokens = options?.maxTokens ?? 2000;
        const estimatedOutputTokens = Math.min(maxTokens, estimatedInputTokens * 2);
        // GPT-4 pricing: $0.00003 per input token, $0.00006 per output token
        const inputCost = estimatedInputTokens * 0.00003;
        const outputCost = estimatedOutputTokens * 0.00006;
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
     * Validate OpenAI API key
     */
    async validateApiKey() {
        try {
            await axios_1.default.post(`${this.baseUrl}/chat/completions`, {
                model: 'gpt-4',
                messages: [{ role: 'user', content: 'test' }],
                max_tokens: 1,
            }, {
                headers: this.getHeaders(),
                timeout: 30000,
            });
            return true;
        }
        catch (error) {
            const serviceError = this.handleError(error);
            logger_1.default.error('GPT-4 API key validation failed', serviceError);
            return false;
        }
    }
}
exports.OpenAIService = OpenAIService;
