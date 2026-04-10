/**
 * Auth API Routes
 * User registration, login, and profile
 */

import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../../utils/prisma';
import { generateToken, authenticateToken } from '../../middleware/auth.middleware';
import { authLimiter } from '../../middleware/rate-limit.middleware';
import { registerSchema, loginSchema } from '../validators/auth.validator';
import logger from '../../utils/logger';

const router = Router();

const SALT_ROUNDS = 10;

/**
 * POST /api/auth/register
 */
router.post('/register', authLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password, name } = registerSchema.parse(req.body);

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({
        success: false,
        error: { type: 'CONFLICT', message: 'Email already registered', retryable: false },
      });
      return;
    }

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name: name || email.split('@')[0] },
    });

    const token = generateToken({ userId: user.id, email: user.email });

    logger.info('User registered', { userId: user.id, email: user.email });

    res.status(201).json({
      success: true,
      data: {
        user: { id: user.id, email: user.email, name: user.name, language: user.language },
        token,
      },
    });
  } catch (error) {
    throw error;
  }
});

/**
 * POST /api/auth/login
 */
router.post('/login', authLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({
        success: false,
        error: { type: 'INVALID_CREDENTIALS', message: 'Invalid email or password', retryable: false },
      });
      return;
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      res.status(401).json({
        success: false,
        error: { type: 'INVALID_CREDENTIALS', message: 'Invalid email or password', retryable: false },
      });
      return;
    }

    const token = generateToken({ userId: user.id, email: user.email });

    logger.info('User logged in', { userId: user.id });

    res.json({
      success: true,
      data: {
        user: { id: user.id, email: user.email, name: user.name, language: user.language },
        token,
      },
    });
  } catch (error) {
    throw error;
  }
});

/**
 * GET /api/auth/me
 */
router.get('/me', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, name: true, avatar: true, language: true, createdAt: true },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: { type: 'NOT_FOUND', message: 'User not found', retryable: false },
      });
      return;
    }

    res.json({ success: true, data: user });
  } catch (error) {
    throw error;
  }
});

export default router;
