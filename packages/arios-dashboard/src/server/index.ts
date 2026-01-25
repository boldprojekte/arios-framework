/**
 * Dashboard HTTP server with SSE endpoint
 *
 * Serves static files and provides real-time updates via Server-Sent Events
 */

import { createServer, IncomingMessage, ServerResponse } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { SSEMessage } from '../types/dashboard.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const CLIENT_DIR = join(__dirname, '..', 'client');

// Connected SSE clients
const clients: Set<ServerResponse> = new Set();

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
function handleSSE(req: IncomingMessage, res: ServerResponse): void {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  // Add to connected clients
  clients.add(res);

  // Keep-alive comment every 30s to prevent timeout
  const keepAlive = setInterval(() => {
    res.write(': keep-alive\n\n');
  }, 30000);

  // Clean up on client disconnect
  req.on('close', () => {
    clearInterval(keepAlive);
    clients.delete(res);
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
 * Start the dashboard server
 * @param planningDir - Path to .planning directory (passed to watcher)
 * @returns Server port and broadcast function
 */
export function startServer(planningDir: string): {
  port: number;
  broadcast: (msg: SSEMessage) => void;
} {
  const port = parseInt(process.env.PORT || '3456', 10);

  const server = createServer((req, res) => {
    if (req.url === '/events') {
      handleSSE(req, res);
    } else {
      serveStatic(req, res);
    }
  });

  server.listen(port, () => {
    console.log(`Dashboard server running at http://localhost:${port}`);
    console.log(`Watching: ${planningDir}`);
  });

  return {
    port,
    broadcast,
  };
}

// Run if executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const planningDir = process.argv[2] || '.planning';
  startServer(planningDir);
}
