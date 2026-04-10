/**
 * Rate Limiting Middleware
 * Prevents brute force attacks on authentication endpoints
 */

import rateLimit from 'express-rate-limit';

/**
 * General API rate limiter - 100 requests per 15 minutes
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      type: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
      retryable: true,
    },
  },
});

/**
 * Auth rate limiter - 5 attempts per 15 minutes
 * Stricter limit for login/register to prevent brute force
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    error: {
      type: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts, please try again later',
      retryable: true,
    },
  },
});
