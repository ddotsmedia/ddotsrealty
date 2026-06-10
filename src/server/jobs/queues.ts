import { Queue } from "bullmq";
import type { ConnectionOptions } from "bullmq";
import IORedis from "ioredis";

export const connection = new IORedis(
  process.env.REDIS_URL ?? "redis://localhost:6379",
  { maxRetriesPerRequest: null },
) as unknown as ConnectionOptions;

export const QUEUE_NAMES = {
  chequeReminder: "cheque-reminder",
  contractRenewal: "contract-renewal",
  leadFollowup: "lead-followup",
  documentExpiry: "document-expiry",
  listingExpiry: "listing-expiry",
  subscriptionCheck: "subscription-check",
  dailySummary: "daily-summary",
} as const;

export const chequeReminderQueue = new Queue(QUEUE_NAMES.chequeReminder, {
  connection,
});
export const contractRenewalQueue = new Queue(QUEUE_NAMES.contractRenewal, {
  connection,
});
export const leadFollowupQueue = new Queue(QUEUE_NAMES.leadFollowup, {
  connection,
});
export const documentExpiryQueue = new Queue(QUEUE_NAMES.documentExpiry, {
  connection,
});
export const listingExpiryQueue = new Queue(QUEUE_NAMES.listingExpiry, {
  connection,
});
export const subscriptionCheckQueue = new Queue(QUEUE_NAMES.subscriptionCheck, {
  connection,
});
export const dailySummaryQueue = new Queue(QUEUE_NAMES.dailySummary, {
  connection,
});
