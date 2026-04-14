/**
 * API Routes Index
 * Combines all API route modules
 */

import { Router, Request, Response } from 'express';
import generationRoutes from './generation.routes';
import mediaRoutes from './media.routes';
import batchPlatformsRoutes from './platforms.batch.routes';
import testPlatformsRoutes from './platforms.test.routes';
import authRoutes from './auth.routes';
import uploadRoutes from './upload.routes';
import contentRoutes from './content.routes';
import templateRoutes from './template.routes';
import { optionalAuth, authenticateToken } from '../../middleware/auth.middleware';

const router = Router();

/**
 * GET /api/health
 * API health check endpoint
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'conmebution-api',
      version: '2.0.0',
    },
  });
});

/**
 * Auth routes (public)
 */
router.use('/auth', authRoutes);

/**
 * Protected routes — require auth
 */
router.use('/upload', authenticateToken, uploadRoutes);
router.use('/content', authenticateToken, contentRoutes);
router.use('/templates', authenticateToken, templateRoutes);

/**
 * Routes with optional auth — work with or without token
 */
router.use('/generate', optionalAuth, generationRoutes);
router.use('/generate', optionalAuth, mediaRoutes);
router.use('/platforms/batch', optionalAuth, batchPlatformsRoutes);
router.use('/platforms/test', testPlatformsRoutes);
router.use('/tasks', generationRoutes);

export const apiRouter = router;
