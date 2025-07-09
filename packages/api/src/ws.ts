import { applyWSSHandler } from '@trpc/server/adapters/ws';
import { WebSocketServer, type WebSocket } from 'ws';
import { appRouter } from './root';
import { db } from '@codeweaver/db';
import { createOpenAI } from '@ai-sdk/openai';
import { parseEnv } from '../../lib/src/env';

const env = parseEnv(process.env);

// Create context for WebSocket connections
const createContext = () => ({
  session: null,
  db,
  aiProvider: createOpenAI({ apiKey: env.OPENAI_API_KEY }),
});

const wss = new WebSocketServer({
  port: env.PORT,
});

const handler = applyWSSHandler({
  wss,
  router: appRouter,
  createContext,
  onError: ({ error, path }) => {
    // TODO: Replace with proper logger
    console.error(`❌ WebSocket failed on ${path ?? '<no-path>'}: ${error.message}`);
  },
});

wss.on('connection', (socket: WebSocket) => {
  // TODO: Replace with proper logger
  console.log(`➕➕ WebSocket Connection (${wss.clients.size})`);
  socket.once('close', () => {
    // TODO: Replace with proper logger
    console.log(`➖➖ WebSocket Connection (${wss.clients.size})`);
  });
});

// TODO: Replace with proper logger
console.log(`✅ WebSocket Server listening on ws://localhost:${env.PORT}`);

process.on('SIGTERM', () => {
  // TODO: Replace with proper logger
  console.log('SIGTERM received, shutting down WebSocket server.');
  handler.broadcastReconnectNotification();
  wss.close();
}); 