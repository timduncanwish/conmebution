/**
 * API Routes Index
 * Combines all API route modules
 */

import { Router, Request, Response } from 'express';
import generationRoutes from './generation.routes';
import mediaRoutes from './media.routes';
import batchPlatformsRoutes from './platforms.batch.routes';
import testPlatformsRoutes from './platforms.test.routes';

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
      version: '1.0.0',
    },
  });
});

/**
 * Mount generation routes
 */
router.use('/generate', generationRoutes);

/**
 * Mount media generation routes
 */
router.use('/generate', mediaRoutes);

/**
 * Mount batch platforms routes
 */
router.use('/platforms/batch', batchPlatformsRoutes);

/**
 * Mount test platforms routes
 */
router.use('/platforms/test', testPlatformsRoutes);

/**
 * Mount task status routes
 */
router.use('/tasks', generationRoutes);

export const apiRouter = router;
