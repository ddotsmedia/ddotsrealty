import { createTRPCRouter, createCallerFactory } from "./trpc";
import { healthRouter } from "./routers/health";
import { propertyRouter } from "./routers/property";
import { documentRouter } from "./routers/document";
import { contractRouter } from "./routers/contract";
import { chequeRouter } from "./routers/cheque";
import { maintenanceRouter } from "./routers/maintenance";
import { dashboardRouter } from "./routers/dashboard";
import { ownerRouter } from "./routers/owner";
import { propertyTenantRouter } from "./routers/tenant";
import { staffRouter } from "./routers/staff";
import { settingsRouter } from "./routers/settings";
import { leadRouter } from "./routers/lead";
import { listingRouter } from "./routers/listing";
import { superadminRouter } from "./routers/superadmin";
import { transactionRouter } from "./routers/transaction";
import { commissionRouter } from "./routers/commission";
import { reportRouter } from "./routers/report";
import { bankAccountRouter } from "./routers/bank-account";
import { utilityRouter } from "./routers/utility";
import { parkingRouter } from "./routers/parking";
import { occupantRouter } from "./routers/occupant";
import { inspectionRouter } from "./routers/inspection";
import { keyHandoverRouter } from "./routers/key-handover";
import { communicationRouter } from "./routers/communication";
import { announcementRouter } from "./routers/announcement";
import { nocRouter } from "./routers/noc";
import { clearanceRouter } from "./routers/clearance";

export const appRouter = createTRPCRouter({
  health: healthRouter,
  property: propertyRouter,
  document: documentRouter,
  contract: contractRouter,
  cheque: chequeRouter,
  maintenance: maintenanceRouter,
  dashboard: dashboardRouter,
  owner: ownerRouter,
  propertyTenant: propertyTenantRouter,
  staff: staffRouter,
  settings: settingsRouter,
  lead: leadRouter,
  listing: listingRouter,
  superadmin: superadminRouter,
  transaction: transactionRouter,
  commission: commissionRouter,
  report: reportRouter,
  bankAccount: bankAccountRouter,
  utility: utilityRouter,
  parking: parkingRouter,
  occupant: occupantRouter,
  inspection: inspectionRouter,
  keyHandover: keyHandoverRouter,
  communication: communicationRouter,
  announcement: announcementRouter,
  noc: nocRouter,
  clearance: clearanceRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
