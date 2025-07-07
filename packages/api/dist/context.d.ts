/**
 * Builds the tRPC context for each request.
 * Extend this once authentication and other services are in place.
 */
export declare function createTRPCContext(): Promise<{
    db: any;
    session: null;
}>;
export type Context = Awaited<ReturnType<typeof createTRPCContext>>;
//# sourceMappingURL=context.d.ts.map