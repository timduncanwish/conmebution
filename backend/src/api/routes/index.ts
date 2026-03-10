/**
 * API Routes Index
 * Combines all API route modules
 */

import { Router, Request, Response } from 'express';
import generationRoutes from './generation.routes';

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
 * GET /api
 * API information endpoint
 */
router.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      message: 'Conmebution API',
      version: '1.0.0',
      endpoints: {
        health: '/api/health',
        generate: {
          text: '/api/generate/text',
          textSync: '/api/generate/text/sync',
          cost: '/api/generate/cost',
        },
        tasks: '/api/tasks/:taskId',
      },
    },
  });
});

/**
 * Mount generation routes
 */
router.use('/generate', generationRoutes);

/**
 * Mount task status routes
 */
router.use('/tasks', generationRoutes);

export const apiRouter = router;
