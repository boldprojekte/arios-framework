/**
 * Dashboard HTTP server with SSE endpoint
 *
 * Serves static files and provides real-time updates via Server-Sent Events
 */

import { createServer, IncomingMessage, ServerResponse, Server } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { FSWatcher } from 'chokidar';
import { createWatcher } from './watcher.js';
import { buildDashboardState } from './parser.js';
import type { SSEMessage, DashboardState } from '../types/dashboard.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const CLIENT_DIR = join(__dirname, '..', 'client');

// Connected SSE clients
const clients: Set<ServerResponse> = new Set();

// Server state
let httpServer: Server | null = null;
let fileWatcher: FSWatcher | null = null;
let currentState: DashboardState | null = null;

// Content-Type mapping
const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

/**
 * Serve static files from client directory
 */
async function serveStatic(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = req.url === '/' ? '/index.html' : req.url || '/index.html';
  const filePath = join(CLIENT_DIR, url);
  const ext = extname(filePath);
  const contentType = CONTENT_TYPES[ext] || 'application/octet-stream';

  try {
    const content = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } catch (err) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
}

/**
 * Handle SSE connection
 */
function handleSSE(req: IncomingMessage, res: ServerResponse, planningDir: string): void {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  // Add to connected clients
  clients.add(res);
  console.log(`[sse] Client connected (total: ${clients.size})`);

  // Send initial state immediately on connection
  const initialState = currentState || buildDashboardState(planningDir);
  const initialMessage: SSEMessage = {
    type: 'initial',
    payload: initialState,
  };
  res.write(`data: ${JSON.stringify(initialMessage)}\n\n`);

  // Keep-alive comment every 30s to prevent timeout
  const keepAlive = setInterval(() => {
    res.write(': keep-alive\n\n');
  }, 30000);

  // Clean up on client disconnect
  req.on('close', () => {
    clearInterval(keepAlive);
    clients.delete(res);
    console.log(`[sse] Client disconnected (total: ${clients.size})`);
  });
}

/**
 * Broadcast message to all connected SSE clients
 */
export function broadcast(message: SSEMessage): void {
  const data = `data: ${JSON.stringify(message)}\n\n`;
  for (const client of clients) {
    client.write(data);
  }
}

/**
 * Get count of connected clients
 */
export function getClientCount(): number {
  return clients.size;
}

/**
 * Handle state change from watcher - update cache and broadcast
 */
function handleStateChange(state: DashboardState): void {
  currentState = state;
  const message: SSEMessage = {
    type: 'update',
    payload: state,
  };
  broadcast(message);
  console.log(`[sse] Broadcast update to ${clients.size} client(s)`);
}

/**
 * Start the dashboard server
 * @param planningDir - Path to .planning directory
 * @param portOverride - Optional port override (from CLI argument)
 * @returns Promise resolving to stop function
 */
export async function startServer(planningDir: string, portOverride?: number): Promise<{
  port: number;
  stop: () => Promise<void>;
}> {
  const port = portOverride ?? parseInt(process.env.PORT || '3456', 10);
  const resolvedDir = resolve(planningDir);

  // Create file watcher with state change callback
  fileWatcher = createWatcher(resolvedDir, handleStateChange);

  // Create HTTP server
  httpServer = createServer((req, res) => {
    if (req.url === '/events') {
      handleSSE(req, res, resolvedDir);
    } else {
      serveStatic(req, res);
    }
  });

  // Start listening
  await new Promise<void>((resolve) => {
    httpServer!.listen(port, () => {
      console.log(`Dashboard server running at http://localhost:${port}`);
      console.log(`Watching: ${resolvedDir}`);
      resolve();
    });
  });

  return {
    port,
    stop: stopServer,
  };
}

/**
 * Stop the dashboard server and watcher
 */
export async function stopServer(): Promise<void> {
  console.log('[server] Shutting down...');

  // Close watcher
  if (fileWatcher) {
    await fileWatcher.close();
    fileWatcher = null;
    console.log('[server] File watcher closed');
  }

  // Close HTTP server
  if (httpServer) {
    await new Promise<void>((resolve, reject) => {
      httpServer!.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    httpServer = null;
    console.log('[server] HTTP server closed');
  }

  // Clear all clients
  clients.clear();
  currentState = null;

  console.log('[server] Shutdown complete');
}

// Handle graceful shutdown signals
function setupGracefulShutdown(): void {
  const shutdown = async () => {
    await stopServer();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

// Run if executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const planningDir = process.argv[2] || '.planning';
  const portArg = process.argv[3] ? parseInt(process.argv[3], 10) : undefined;
  setupGracefulShutdown();
  startServer(planningDir, portArg).catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}
