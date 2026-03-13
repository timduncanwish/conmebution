/**
 * WebSocket Server for Real-time Task Progress Updates
 * Provides real-time communication for task status updates
 */

import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import { getTaskProgress } from '../queue';
import { TaskProgress } from '../../types/task.types';
import logger from '../../utils/logger';

/**
 * WebSocket message interface
 */
interface WebSocketMessage {
  type: 'subscribe' | 'unsubscribe' | 'error' | 'update' | 'subscribe-task' | 'unsubscribe-task' | 'ping' | 'pong' | 'connected' | 'task-update';
  taskId?: string;
  data?: TaskProgress;
  message?: string;
  clientId?: string;
  error?: string;
}

/**
 * WebSocket port configuration
 */
const WS_PORT = 4001;

/**
 * WebSocket server instance
 * Exported for graceful shutdown
 */
export let wssInstance: WebSocketServer | null = null;

/**
 * HTTP server for WebSocket
 */
let httpServer: ReturnType<typeof createServer> | null = null;

/**
 * Broadcast interval timer
 */
let broadcastInterval: NodeJS.Timeout | null = null;

/**
 * Client subscriptions storage
 * Maps clientId -> Set of taskIds
 */
const subscriptions = new Map<string, Set<string>>();

/**
 * WebSocket connections storage
 * Maps clientId -> WebSocket connection
 */
const connections = new Map<string, WebSocket>();

/**
 * Generate unique client ID
 */
const generateClientId = (): string => {
  return `client_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
};

/**
 * Send message to a specific client
 */
const sendToClient = (ws: WebSocket, message: WebSocketMessage): void => {
  try {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message), (error) => {
        if (error) {
          logger.error('Failed to send WebSocket message', { error: error.message });
        }
      });
    } else {
      logger.warn('WebSocket not ready, skipping message');
    }
  } catch (error) {
    logger.error('Error sending WebSocket message', { error });
  }
};

/**
 * Handle subscribe-task message
 */
const handleSubscribeTask = (clientId: string, taskId: string): void => {
  const ws = connections.get(clientId);
  if (!ws) {
    logger.warn('Client not found for subscription', { clientId, taskId });
    return;
  }

  // Initialize subscriptions set if not exists
  if (!subscriptions.has(clientId)) {
    subscriptions.set(clientId, new Set());
  }

  // Add task to subscriptions
  const clientSubscriptions = subscriptions.get(clientId)!;
  clientSubscriptions.add(taskId);

  logger.info('Client subscribed to task', { clientId, taskId });

  // Send current progress if available
  const currentProgress = getTaskProgress(taskId);
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
const handleUnsubscribeTask = (clientId: string, taskId: string): void => {
  const clientSubscriptions = subscriptions.get(clientId);
  if (clientSubscriptions) {
    clientSubscriptions.delete(taskId);

    logger.info('Client unsubscribed from task', { clientId, taskId });

    // Clean up empty subscription sets
    if (clientSubscriptions.size === 0) {
      subscriptions.delete(clientId);
    }
  }
};

/**
 * Handle incoming WebSocket messages
 */
const handleMessage = (clientId: string, ws: WebSocket, message: string): void => {
  try {
    const data: WebSocketMessage = JSON.parse(message);

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
        } else {
          sendToClient(ws, {
            type: 'error',
            message: 'Invalid subscribe-task message: taskId is required',
          });
        }
        break;

      case 'unsubscribe-task':
        if (data.taskId && typeof data.taskId === 'string') {
          handleUnsubscribeTask(clientId, data.taskId);
        } else {
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
  } catch (error) {
    logger.error('Error parsing WebSocket message', {
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
const broadcastTaskUpdates = (): void => {
  // Iterate through all client subscriptions
  for (const [clientId, taskIds] of subscriptions.entries()) {
    const ws = connections.get(clientId);

    if (!ws || ws.readyState !== WebSocket.OPEN) {
      continue;
    }

    // Check each subscribed task for updates
    for (const taskId of taskIds) {
      const progress = getTaskProgress(taskId);

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
const handleConnection = (ws: WebSocket): void => {
  const clientId = generateClientId();

  // Store connection
  connections.set(clientId, ws);

  logger.info('WebSocket client connected', { clientId });

  // Send welcome message
  sendToClient(ws, {
    type: 'connected',
    clientId,
    message: 'Successfully connected to WebSocket server',
  });

  // Handle incoming messages
  ws.on('message', (message: Buffer) => {
    handleMessage(clientId, ws, message.toString());
  });

  // Handle disconnection
  ws.on('close', () => {
    logger.info('WebSocket client disconnected', { clientId });

    // Clean up subscriptions
    subscriptions.delete(clientId);

    // Remove connection
    connections.delete(clientId);
  });

  // Handle errors
  ws.on('error', (error: Error) => {
    logger.error('WebSocket connection error', {
      clientId,
      error: error.message,
    });
  });
};

/**
 * Setup and start WebSocket server
 */
export const setupWebSocketServer = (): void => {
  // Create HTTP server for WebSocket
  httpServer = createServer();

  // Create WebSocket server
  wssInstance = new WebSocketServer({ server: httpServer });

  // Handle connections
  wssInstance.on('connection', handleConnection);

  // Start HTTP server
  httpServer.listen(WS_PORT, () => {
    logger.info(`🔌 WebSocket server running on port ${WS_PORT}`);
  });

  // Start task progress broadcast interval (500ms)
  const BROADCAST_INTERVAL_MS = 500;
  broadcastInterval = setInterval(broadcastTaskUpdates, BROADCAST_INTERVAL_MS);

  logger.info('WebSocket task progress broadcasting started', {
    interval: `${BROADCAST_INTERVAL_MS}ms`,
  });

  // Handle server errors
  wssInstance.on('error', (error: Error) => {
    logger.error('WebSocket server error', { error: error.message });
  });

  httpServer.on('error', (error: Error) => {
    logger.error('HTTP server error for WebSocket', { error: error.message });
  });
};

/**
 * Gracefully shutdown WebSocket server
 */
export const shutdownWebSocketServer = async (): Promise<void> => {
  if (wssInstance) {
    logger.info('Shutting down WebSocket server...');

    // Clear broadcast interval to prevent memory leak
    if (broadcastInterval) {
      clearInterval(broadcastInterval);
      broadcastInterval = null;
    }

    // Close all connections
    wssInstance.clients.forEach((client) => {
      client.close();
    });

    // Close WebSocket server
    wssInstance.close(() => {
      logger.info('WebSocket server closed');
    });

    // Close HTTP server
    if (httpServer) {
      httpServer.close(() => {
        logger.info('HTTP server for WebSocket closed');
      });
    }

    // Clear subscriptions and connections
    subscriptions.clear();
    connections.clear();

    wssInstance = null;
    httpServer = null;
  }
};
