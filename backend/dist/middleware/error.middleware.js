"use strict";
/**
 * Error Handling Middleware
 * Centralized error handling for API requests
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = exports.errorHandler = void 0;
const zod_1 = require("zod");
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Handle Zod validation errors
 */
const handleZodError = (err, res) => {
    const errors = err.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
    }));
    logger_1.default.warn('Validation error', {
        errors,
        path: res.req?.path,
    });
    res.status(400).json({
        success: false,
        error: {
            type: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            details: errors,
            retryable: false,
        },
    });
};
/**
 * Handle AI service errors
 */
const handleAIServiceError = (err, res) => {
    logger_1.default.error('AI service error', {
        code: err.code,
        message: err.message,
        provider: err.provider,
        retryable: err.retryable,
        path: res.req?.path,
    });
    res.status(500).json({
        success: false,
        error: {
            type: 'AI_SERVICE_ERROR',
            message: err.message,
            details: {
                code: err.code,
                provider: err.provider,
            },
            retryable: err.retryable || false,
        },
    });
};
/**
 * Handle generic errors
 */
const handleGenericError = (err, res) => {
    logger_1.default.error('Unhandled error', {
        message: err.message,
        stack: err.stack,
        path: res.req?.path,
    });
    res.status(500).json({
        success: false,
        error: {
            type: 'INTERNAL_SERVER_ERROR',
            message: 'An unexpected error occurred',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined,
            retryable: false,
        },
    });
};
/**
 * Main error handling middleware
 */
const errorHandler = (err, req, res, next) => {
    // Don't log errors in tests to avoid cluttering output
    if (process.env.NODE_ENV !== 'test') {
        logger_1.default.error('Error occurred', {
            message: err.message,
            path: req.path,
            method: req.method,
        });
    }
    // Handle Zod validation errors
    if (err instanceof zod_1.ZodError) {
        handleZodError(err, res);
        return;
    }
    // Handle AI service errors (check for error object structure)
    if (typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        'provider' in err &&
        'retryable' in err) {
        handleAIServiceError(err, res);
        return;
    }
    // Handle generic errors
    handleGenericError(err, res);
};
exports.errorHandler = errorHandler;
/**
 * 404 Not Found handler
 */
const notFoundHandler = (req, res) => {
    logger_1.default.warn('Route not found', {
        path: req.path,
        method: req.method,
    });
    res.status(404).json({
        success: false,
        error: {
            type: 'NOT_FOUND',
            message: `Route ${req.method} ${req.path} not found`,
            retryable: false,
        },
    });
};
exports.notFoundHandler = notFoundHandler;
