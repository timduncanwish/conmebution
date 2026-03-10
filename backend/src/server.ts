import express, { Request, Response } from 'express';
import cors from 'cors';
import { apiRouter } from './api/routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import logger from './utils/logger';
import config from './config';

// Load environment variables
const app = express();
const PORT = config.port;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// API routes
app.use('/api', apiRouter);

// 404 handler - must be before error handler
app.use(notFoundHandler);

// Error handling middleware - must be last
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Server running on http://localhost:${PORT}`);
  logger.info(`📝 Environment: ${config.nodeEnv}`);
  logger.info(`🌐 Health check: http://localhost:${PORT}/health`);
});

export default app;
