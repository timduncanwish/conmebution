import express, { Request, Response } from 'express';
import cors from 'cors';
import { apiRouter } from './api/routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { setupWebSocketServer, shutdownWebSocketServer } from './services/websocket';
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
const server = app.listen(PORT, () => {
  logger.info(`🚀 Server running on http://localhost:${PORT}`);
  logger.info(`📝 Environment: ${config.nodeEnv}`);
  logger.info(`🌐 Health check: http://localhost:${PORT}/health`);
});

// Setup WebSocket server
setupWebSocketServer();

// Graceful shutdown handling
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}, starting graceful shutdown...`);

  // Close HTTP server
  server.close(() => {
    logger.info('HTTP server closed');
  });

  // Close WebSocket server
  await shutdownWebSocketServer();

  logger.info('Graceful shutdown completed');
  process.exit(0);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason: unknown) => {
  logger.error('Unhandled Rejection', { reason });
  gracefulShutdown('unhandledRejection');
});

export default app;
