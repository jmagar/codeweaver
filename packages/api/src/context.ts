import { db } from '@codeweaver/db';
import { PrismaClient } from '@prisma/client';
import { createOpenRouterProvider } from '../../lib/src/ai/openrouter-provider';

/**
 * Configuration interface for creating tRPC context
 */
export interface TRPCContextConfig {
  openRouterApiKey: string;
}

/**
 * Builds the tRPC context for each request.
 * Extend this once authentication and other services are in place.
 */
export async function createTRPCContext(config: TRPCContextConfig): Promise<{
  db: PrismaClient;
  session: null;
  aiProvider: ReturnType<typeof createOpenRouterProvider>;
}> {
  // TODO: integrate real session when auth is implemented.
  const session = null;
  const aiProvider = createOpenRouterProvider(config.openRouterApiKey);

  return {
    db,
    session,
    aiProvider,
  };
}

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;