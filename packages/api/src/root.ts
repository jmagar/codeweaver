import { createTRPCRouter } from "./trpc";
import { healthRouter } from "./routers/health";
import { userRouter } from "./routers/user";

export const appRouter = createTRPCRouter({
  health: healthRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter; 