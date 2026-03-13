/**
 * Error Handling Middleware
 * Centralized error handling for API requests
 */

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import logger from '../utils/logger';
import { AIServiceError } from '../types/ai.types';

/**
 * Standardized error response format
 */
interface ErrorResponse {
  success: false;
  error: {
    type: string;
    message: string;
    details?: any;
    retryable: boolean;
  };
}

/**
 * Handle Zod validation errors
 */
const handleZodError = (err: ZodError, res: Response): void => {
  const errors = err.issues.map((issue: any) => ({
    path: issue.path.join('.'),
    message: issue.message,
    code: issue.code,
  }));

  logger.warn('Validation error', {
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
  } as ErrorResponse);
};

/**
 * Handle AI service errors
 */
const handleAIServiceError = (err: AIServiceError, res: Response): void => {
  logger.error('AI service error', {
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
  } as ErrorResponse);
};

/**
 * Handle generic errors
 */
const handleGenericError = (err: Error, res: Response): void => {
  logger.error('Unhandled error', {
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
  } as ErrorResponse);
};

/**
 * Main error handling middleware
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Don't log errors in tests to avoid cluttering output
  if (process.env.NODE_ENV !== 'test') {
    logger.error('Error occurred', {
      message: err.message,
      path: req.path,
      method: req.method,
    });
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    handleZodError(err, res);
    return;
  }

  // Handle AI service errors (check for error object structure)
  if (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    'provider' in err &&
    'retryable' in err
  ) {
    handleAIServiceError(err as unknown as AIServiceError, res);
    return;
  }

  // Handle generic errors
  handleGenericError(err, res);
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  logger.warn('Route not found', {
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
  } as ErrorResponse);
};
