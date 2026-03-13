"use strict";
/**
 * WebSocket Server for Real-time Task Progress Updates
 * Provides real-time communication for task status updates
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.shutdownWebSocketServer = exports.setupWebSocketServer = exports.wssInstance = void 0;
const ws_1 = require("ws");
const http_1 = require("http");
const queue_1 = require("../queue");
const logger_1 = __importDefault(require("../../utils/logger"));
/**
 * WebSocket port configuration
 */
const WS_PORT = 4001;
/**
 * WebSocket server instance
 * Exported for graceful shutdown
 */
exports.wssInstance = null;
/**
 * HTTP server for WebSocket
 */
let httpServer = null;
/**
 * Broadcast interval timer
 */
let broadcastInterval = null;
/**
 * Client subscriptions storage
 * Maps clientId -> Set of taskIds
 */
const subscriptions = new Map();
/**
 * WebSocket connections storage
 * Maps clientId -> WebSocket connection
 */
const connections = new Map();
/**
 * Generate unique client ID
 */
const generateClientId = () => {
    return `client_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
};
/**
 * Send message to a specific client
 */
const sendToClient = (ws, message) => {
    try {
        if (ws.readyState === ws_1.WebSocket.OPEN) {
            ws.send(JSON.stringify(message), (error) => {
                if (error) {
                    logger_1.default.error('Failed to send WebSocket message', { error: error.message });
                }
            });
        }
        else {
            logger_1.default.warn('WebSocket not ready, skipping message');
        }
    }
    catch (error) {
        logger_1.default.error('Error sending WebSocket message', { error });
    }
};
/**
 * Handle subscribe-task message
 */
const handleSubscribeTask = (clientId, taskId) => {
    const ws = connections.get(clientId);
    if (!ws) {
        logger_1.default.warn('Client not found for subscription', { clientId, taskId });
        return;
    }
    // Initialize subscriptions set if not exists
    if (!subscriptions.has(clientId)) {
        subscriptions.set(clientId, new Set());
    }
    // Add task to subscriptions
    const clientSubscriptions = subscriptions.get(clientId);
    clientSubscriptions.add(taskId);
    logger_1.default.info('Client subscribed to task', { clientId, taskId });
    // Send current progress if available
    const currentProgress = (0, queue_1.getTaskProgress)(taskId);
    if (currentProgress) {
        sendToClient(ws, {
            type: 'task-update',
            data: currentProgress,
        });
    }
};
/**
 * Handle unsubscribe-task message
 */
const handleUnsubscribeTask = (clientId, taskId) => {
    const clientSubscriptions = subscriptions.get(clientId);
    if (clientSubscriptions) {
        clientSubscriptions.delete(taskId);
        logger_1.default.info('Client unsubscribed from task', { clientId, taskId });
        // Clean up empty subscription sets
        if (clientSubscriptions.size === 0) {
            subscriptions.delete(clientId);
        }
    }
};
/**
 * Handle incoming WebSocket messages
 */
const handleMessage = (clientId, ws, message) => {
    try {
        const data = JSON.parse(message);
        // Validate message structure
        if (!data.type || typeof data.type !== 'string') {
            sendToClient(ws, {
                type: 'error',
                message: 'Invalid message format: type is required',
            });
            return;
        }
        switch (data.type) {
            case 'subscribe-task':
                if (data.taskId && typeof data.taskId === 'string') {
                    handleSubscribeTask(clientId, data.taskId);
                }
                else {
                    sendToClient(ws, {
                        type: 'error',
                        message: 'Invalid subscribe-task message: taskId is required',
                    });
                }
                break;
            case 'unsubscribe-task':
                if (data.taskId && typeof data.taskId === 'string') {
                    handleUnsubscribeTask(clientId, data.taskId);
                }
                else {
                    sendToClient(ws, {
                        type: 'error',
                        message: 'Invalid unsubscribe-task message: taskId is required',
                    });
                }
                break;
            case 'ping':
                sendToClient(ws, { type: 'pong' });
                break;
            default:
                sendToClient(ws, {
                    type: 'error',
                    message: `Unknown message type: ${data.type}`,
                });
                break;
        }
    }
    catch (error) {
        logger_1.default.error('Error parsing WebSocket message', {
            clientId,
            error: error instanceof Error ? error.message : String(error),
        });
        const wsConnection = connections.get(clientId);
        if (wsConnection) {
            sendToClient(wsConnection, {
                type: 'error',
                message: 'Invalid JSON format',
            });
        }
    }
};
/**
 * Broadcast task progress updates to subscribed clients
 */
const broadcastTaskUpdates = () => {
    // Iterate through all client subscriptions
    for (const [clientId, taskIds] of subscriptions.entries()) {
        const ws = connections.get(clientId);
        if (!ws || ws.readyState !== ws_1.WebSocket.OPEN) {
            continue;
        }
        // Check each subscribed task for updates
        for (const taskId of taskIds) {
            const progress = (0, queue_1.getTaskProgress)(taskId);
            if (progress) {
                sendToClient(ws, {
                    type: 'task-update',
                    data: progress,
                });
            }
        }
    }
};
/**
 * Handle WebSocket connection
 */
const handleConnection = (ws) => {
    const clientId = generateClientId();
    // Store connection
    connections.set(clientId, ws);
    logger_1.default.info('WebSocket client connected', { clientId });
    // Send welcome message
    sendToClient(ws, {
        type: 'connected',
        clientId,
        message: 'Successfully connected to WebSocket server',
    });
    // Handle incoming messages
    ws.on('message', (message) => {
        handleMessage(clientId, ws, message.toString());
    });
    // Handle disconnection
    ws.on('close', () => {
        logger_1.default.info('WebSocket client disconnected', { clientId });
        // Clean up subscriptions
        subscriptions.delete(clientId);
        // Remove connection
        connections.delete(clientId);
    });
    // Handle errors
    ws.on('error', (error) => {
        logger_1.default.error('WebSocket connection error', {
            clientId,
            error: error.message,
        });
    });
};
/**
 * Setup and start WebSocket server
 */
const setupWebSocketServer = () => {
    // Create HTTP server for WebSocket
    httpServer = (0, http_1.createServer)();
    // Create WebSocket server
    exports.wssInstance = new ws_1.WebSocketServer({ server: httpServer });
    // Handle connections
    exports.wssInstance.on('connection', handleConnection);
    // Start HTTP server
    httpServer.listen(WS_PORT, () => {
        logger_1.default.info(`🔌 WebSocket server running on port ${WS_PORT}`);
    });
    // Start task progress broadcast interval (500ms)
    const BROADCAST_INTERVAL_MS = 500;
    broadcastInterval = setInterval(broadcastTaskUpdates, BROADCAST_INTERVAL_MS);
    logger_1.default.info('WebSocket task progress broadcasting started', {
        interval: `${BROADCAST_INTERVAL_MS}ms`,
    });
    // Handle server errors
    exports.wssInstance.on('error', (error) => {
        logger_1.default.error('WebSocket server error', { error: error.message });
    });
    httpServer.on('error', (error) => {
        logger_1.default.error('HTTP server error for WebSocket', { error: error.message });
    });
};
exports.setupWebSocketServer = setupWebSocketServer;
/**
 * Gracefully shutdown WebSocket server
 */
const shutdownWebSocketServer = async () => {
    if (exports.wssInstance) {
        logger_1.default.info('Shutting down WebSocket server...');
        // Clear broadcast interval to prevent memory leak
        if (broadcastInterval) {
            clearInterval(broadcastInterval);
            broadcastInterval = null;
        }
        // Close all connections
        exports.wssInstance.clients.forEach((client) => {
            client.close();
        });
        // Close WebSocket server
        exports.wssInstance.close(() => {
            logger_1.default.info('WebSocket server closed');
        });
        // Close HTTP server
        if (httpServer) {
            httpServer.close(() => {
                logger_1.default.info('HTTP server for WebSocket closed');
            });
        }
        // Clear subscriptions and connections
        subscriptions.clear();
        connections.clear();
        exports.wssInstance = null;
        httpServer = null;
    }
};
exports.shutdownWebSocketServer = shutdownWebSocketServer;
