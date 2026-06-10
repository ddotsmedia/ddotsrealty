import "dotenv/config";
import { Worker } from "bullmq";
import { connection, QUEUE_NAMES } from "./queues";
import { handleChequeReminder } from "./handlers/cheque-reminder";
import { handleContractRenewal } from "./handlers/contract-renewal";
import { handleLeadFollowup } from "./handlers/lead-followup";
import { handleDocumentExpiry } from "./handlers/document-expiry";
import { handleListingExpiry } from "./handlers/listing-expiry";
import { handleSubscriptionCheck } from "./handlers/subscription-check";
import { handleDailySummary } from "./handlers/daily-summary";

const workers: Worker[] = [];

// Cheque reminder worker
workers.push(
  new Worker(QUEUE_NAMES.chequeReminder, handleChequeReminder, {
    connection,
  }),
);

// Contract renewal worker
workers.push(
  new Worker(QUEUE_NAMES.contractRenewal, handleContractRenewal, {
    connection,
  }),
);

// Lead follow-up worker
workers.push(
  new Worker(QUEUE_NAMES.leadFollowup, handleLeadFollowup, {
    connection,
  }),
);

// Document expiry worker
workers.push(
  new Worker(QUEUE_NAMES.documentExpiry, handleDocumentExpiry, {
    connection,
  }),
);

// Listing expiry worker
workers.push(
  new Worker(QUEUE_NAMES.listingExpiry, handleListingExpiry, {
    connection,
  }),
);

// Subscription check worker
workers.push(
  new Worker(QUEUE_NAMES.subscriptionCheck, handleSubscriptionCheck, {
    connection,
  }),
);

// Daily summary worker
workers.push(
  new Worker(QUEUE_NAMES.dailySummary, handleDailySummary, {
    connection,
  }),
);

console.log("[worker] started");

// Handle worker events
workers.forEach((worker) => {
  worker.on("completed", (job) => {
    console.log(`[worker] completed ${job.name} (${job.id})`);
  });

  worker.on("failed", (job, error) => {
    console.error(`[worker] failed ${job?.name} (${job?.id}):`, error?.message);
  });
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("[worker] shutting down...");
  await Promise.all(workers.map((w) => w.close()));
  process.exit(0);
});
