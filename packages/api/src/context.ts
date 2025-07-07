import { db } from "@codeweaver/db";

/**
 * Builds the tRPC context for each request.
 * Extend this once authentication and other services are in place.
 */
export async function createTRPCContext() {
  // TODO: integrate real session when auth is implemented.
  const session = null;

  return {
    db,
    session,
  };
}

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;