import type { CreateNextContextOptions } from '@trpc/server/adapters/next';
import { type PrismaClient } from '@prisma/client';
import { createOpenAI } from '@ai-sdk/openai';
import { db } from '@codeweaver/db';
import { parseEnv } from '../../lib/src/env';

const env = parseEnv(process.env);

export interface Context {
  session: null; // Placeholder for auth session
  db: PrismaClient;
  aiProvider: ReturnType<typeof createOpenAI>;
}

async function createInnerTRPCContext(
  opts: Omit<Context, 'aiProvider'>,
): Promise<Context> {
  const aiProvider = createOpenAI({
    apiKey: env.OPENAI_API_KEY,
  });

  return {
    ...opts,
    aiProvider,
  };
}

export async function createTRPCContext(
  _opts?: CreateNextContextOptions,
): Promise<Context> {
  const innerContext = await createInnerTRPCContext({
    session: null,
    db,
  });

  return innerContext;
}