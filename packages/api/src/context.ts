import { db } from "@codeweaver/db";
import { PrismaClient } from "@prisma/client";

/**
 * Builds the tRPC context for each request.
 * Extend this once authentication and other services are in place.
 */
export async function createTRPCContext(): Promise<{
  db: PrismaClient;
  session: null;
}> {
  // TODO: integrate real session when auth is implemented.
  const session = null;

  return {
    db,
    session,
  };
}

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;