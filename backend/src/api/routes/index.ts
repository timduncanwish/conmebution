import { Router } from 'express';

const router = Router();

// Placeholder routes - will be implemented in future tasks
router.get('/', (req, res) => {
  res.json({
    message: 'Conmebution API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api'
    }
  });
});

export const apiRouter = router;
