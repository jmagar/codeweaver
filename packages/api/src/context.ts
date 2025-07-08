import { db } from '@codeweaver/db';
import { PrismaClient } from '@prisma/client';
import { createOpenRouterProvider } from '../../lib/src/ai/openrouter-provider';
import { env } from './env';

/**
 * Builds the tRPC context for each request.
 * Extend this once authentication and other services are in place.
 */
export async function createTRPCContext(): Promise<{
  db: PrismaClient;
  session: null;
  aiProvider: ReturnType<typeof createOpenRouterProvider>;
}> {
  // TODO: integrate real session when auth is implemented.
  const session = null;
  const aiProvider = createOpenRouterProvider(env.OPENROUTER_API_KEY);

  return {
    db,
    session,
    aiProvider,
  };
}

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;