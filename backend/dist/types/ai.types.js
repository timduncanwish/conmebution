"use strict";
/**
 * AI Service Type Definitions
 * Defines types and interfaces for AI provider abstraction layer
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIModel = exports.AIProvider = void 0;
/**
 * Supported AI providers
 */
var AIProvider;
(function (AIProvider) {
    AIProvider["GLM_4"] = "glm-4";
    AIProvider["GPT_4"] = "gpt-4";
    AIProvider["GEMINI_PRO"] = "gemini-pro";
})(AIProvider || (exports.AIProvider = AIProvider = {}));
/**
 * AI model identifiers
 */
var AIModel;
(function (AIModel) {
    AIModel["GLM_4"] = "glm-4";
    AIModel["GPT_4"] = "gpt-4";
    AIModel["GEMINI_PRO"] = "gemini-pro";
})(AIModel || (exports.AIModel = AIModel = {}));
