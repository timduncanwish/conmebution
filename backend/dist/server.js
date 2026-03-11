"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const routes_1 = require("./api/routes");
const error_middleware_1 = require("./middleware/error.middleware");
const websocket_1 = require("./services/websocket");
const logger_1 = __importDefault(require("./utils/logger"));
const config_1 = __importDefault(require("./config"));
// Load environment variables
const app = (0, express_1.default)();
const PORT = config_1.default.port;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Request logging
app.use((req, res, next) => {
    logger_1.default.info(`${req.method} ${req.path}`);
    next();
});
// API routes
app.use('/api', routes_1.apiRouter);
// 404 handler - must be before error handler
app.use(error_middleware_1.notFoundHandler);
// Error handling middleware - must be last
app.use(error_middleware_1.errorHandler);
// Start server
const server = app.listen(PORT, () => {
    logger_1.default.info(`🚀 Server running on http://localhost:${PORT}`);
    logger_1.default.info(`📝 Environment: ${config_1.default.nodeEnv}`);
    logger_1.default.info(`🌐 Health check: http://localhost:${PORT}/health`);
});
// Setup WebSocket server
(0, websocket_1.setupWebSocketServer)();
// Graceful shutdown handling
const gracefulShutdown = async (signal) => {
    logger_1.default.info(`Received ${signal}, starting graceful shutdown...`);
    // Close HTTP server
    server.close(() => {
        logger_1.default.info('HTTP server closed');
    });
    // Close WebSocket server
    await (0, websocket_1.shutdownWebSocketServer)();
    logger_1.default.info('Graceful shutdown completed');
    process.exit(0);
};
// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
// Handle uncaught errors
process.on('uncaughtException', (error) => {
    logger_1.default.error('Uncaught Exception', { error: error.message, stack: error.stack });
    gracefulShutdown('uncaughtException');
});
process.on('unhandledRejection', (reason) => {
    logger_1.default.error('Unhandled Rejection', { reason });
    gracefulShutdown('unhandledRejection');
});
exports.default = app;
