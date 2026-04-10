/**
 * Authentication Middleware
 * JWT token verification for protected routes
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';

const JWT_SECRET = config.jwtSecret;
const JWT_EXPIRES_IN = '7d';

export interface JwtPayload {
  userId: string;
  email: string;
}

// Extend Express Request to include userId
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userEmail?: string;
    }
  }
}

/**
 * Generate a JWT token
 */
export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verify a JWT token
 */
export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

/**
 * Required auth middleware — 401 if no valid token
 */
export function authenticateToken(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({
      success: false,
      error: {
        type: 'UNAUTHORIZED',
        message: 'Authentication required',
        retryable: false,
      },
    });
    return;
  }

  try {
    const decoded = verifyToken(token);
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    next();
  } catch {
    res.status(401).json({
      success: false,
      error: {
        type: 'INVALID_TOKEN',
        message: 'Invalid or expired token',
        retryable: false,
      },
    });
  }
}

/**
 * Optional auth middleware — sets userId if token present, but doesn't block
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (token) {
    try {
      const decoded = verifyToken(token);
      req.userId = decoded.userId;
      req.userEmail = decoded.email;
    } catch {
      // Token invalid — just proceed without auth
    }
  }

  next();
}
