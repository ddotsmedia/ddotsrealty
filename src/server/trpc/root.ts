import { createTRPCRouter, createCallerFactory } from "./trpc";
import { healthRouter } from "./routers/health";
import { propertyRouter } from "./routers/property";
import { documentRouter } from "./routers/document";
import { contractRouter } from "./routers/contract";
import { chequeRouter } from "./routers/cheque";
import { dashboardRouter } from "./routers/dashboard";
import { ownerRouter } from "./routers/owner";
import { propertyTenantRouter } from "./routers/tenant";
import { staffRouter } from "./routers/staff";
import { settingsRouter } from "./routers/settings";

export const appRouter = createTRPCRouter({
  health: healthRouter,
  property: propertyRouter,
  document: documentRouter,
  contract: contractRouter,
  cheque: chequeRouter,
  dashboard: dashboardRouter,
  owner: ownerRouter,
  propertyTenant: propertyTenantRouter,
  staff: staffRouter,
  settings: settingsRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
