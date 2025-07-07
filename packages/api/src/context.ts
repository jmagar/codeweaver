import { db } from "@codeweaver/db";

/**
 * Builds the tRPC context for each request.
 * Extend this once authentication and other services are in place.
 */
export async function createTRPCContext() {
  // TODO: pull the session from cookies / headers once NextAuth is wired up
  const session = null;

  return {
    db,
    session,
  };
}

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;