import { createTRPCRouter, createCallerFactory } from "./trpc";
import { healthRouter } from "./routers/health";

export const appRouter = createTRPCRouter({
  health: healthRouter,
  // Additional routers will be added here in later phases
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
