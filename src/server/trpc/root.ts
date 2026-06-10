import { createTRPCRouter, createCallerFactory } from "./trpc";
import { healthRouter } from "./routers/health";
import { propertyRouter } from "./routers/property";

export const appRouter = createTRPCRouter({
  health: healthRouter,
  property: propertyRouter,
  // Additional routers will be added here in later phases
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
