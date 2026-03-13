"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
/**
 * Logger utility using Winston
 * Provides both console and file logging with different levels
 */
// Ensure logs directory exists
const logsDir = path_1.default.join(process.cwd(), 'logs');
if (!fs_1.default.existsSync(logsDir)) {
    fs_1.default.mkdirSync(logsDir, { recursive: true });
}
// Create the logger instance
const logger = winston_1.default.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    transports: [
        // Console transport with colors
        new winston_1.default.transports.Console({
            format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.simple()),
        }),
        // File transport for all logs
        new winston_1.default.transports.File({
            filename: path_1.default.join(process.cwd(), 'logs', 'combined.log'),
            format: winston_1.default.format.json(),
        }),
        // File transport for errors only
        new winston_1.default.transports.File({
            filename: path_1.default.join(process.cwd(), 'logs', 'error.log'),
            level: 'error',
            format: winston_1.default.format.json(),
        }),
    ],
    // Exit on error logs to prevent further execution
    exitOnError: false,
});
exports.default = logger;
