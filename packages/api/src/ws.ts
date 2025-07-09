import { applyWSSHandler } from '@trpc/server/adapters/ws';
import { WebSocketServer } from 'ws';
import { appRouter } from './root.js';
import { createTRPCContext } from './context.js';

const wss = new WebSocketServer({
  port: 3001,
});

const handler = applyWSSHandler({
  wss,
  router: appRouter,
  createContext: () => {
    const openRouterApiKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterApiKey) {
      console.error('❌ Missing OPENROUTER_API_KEY environment variable for WebSocket server.');
      // You might want to throw an error here to prevent the server from starting
      // without the necessary configuration.
      throw new Error('OPENROUTER_API_KEY is not set.');
    }
    return createTRPCContext({ openRouterApiKey });
  },
  onError: ({ error, path }) => {
    console.error(`❌ WebSocket failed on ${path ?? '<no-path>'}: ${error.message}`);
  },
});

wss.on('connection', ws => {
  console.log(`➕➕ WebSocket Connection (${wss.clients.size})`);
  ws.once('close', () => {
    console.log(`➖➖ WebSocket Connection (${wss.clients.size})`);
  });
});

console.log('✅ WebSocket Server listening on ws://localhost:3001');

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down WebSocket server.');
  handler.broadcastReconnectNotification();
  wss.close();
}); 