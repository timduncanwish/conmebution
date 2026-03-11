import winston from 'winston';
import path from 'path';
import fs from 'fs';

/**
 * Logger utility using Winston
 * Provides both console and file logging with different levels
 */

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Create the logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  transports: [
    // Console transport with colors
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),

    // File transport for all logs
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'combined.log'),
      format: winston.format.json(),
    }),

    // File transport for errors only
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'error.log'),
      level: 'error',
      format: winston.format.json(),
    }),
  ],
  // Exit on error logs to prevent further execution
  exitOnError: false,
});

export default logger;
