/**
 * AI Service Type Definitions
 * Defines types and interfaces for AI provider abstraction layer
 */

/**
 * Supported AI providers
 */
export enum AIProvider {
  GLM_4 = 'glm-4',
  GPT_4 = 'gpt-4',
  GEMINI_PRO = 'gemini-pro'
}

/**
 * AI model identifiers
 */
export enum AIModel {
  GLM_4 = 'glm-4',
  GPT_4 = 'gpt-4',
  GEMINI_PRO = 'gemini-pro'
}

/**
 * Text generation options
 */
export interface GenerateTextOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

/**
 * Text generation request
 */
export interface TextGenerationRequest {
  prompt: string;
  provider: AIProvider;
  options?: GenerateTextOptions;
}

/**
 * Text generation result
 */
export interface TextGenerationResult {
  content: string;
  provider: AIProvider;
  model: AIModel;
  tokensUsed: {
    input: number;
    output: number;
    total: number;
  };
  cost: number;
  timestamp: Date;
}

/**
 * Cost estimate
 */
export interface CostEstimate {
  estimatedTokens: number;
  estimatedCost: number;
  currency: string;
  breakdown: {
    input: number;
    output: number;
  };
}

/**
 * AI Service Error
 */
export interface AIServiceError {
  code: string;
  message: string;
  provider: AIProvider;
  retryable: boolean;
  originalError?: any;
}

/**
 * Provider pricing configuration
 */
export interface ProviderPricing {
  inputCost: number;
  outputCost: number;
  currency: string;
  unit: 'token' | 'character';
}
