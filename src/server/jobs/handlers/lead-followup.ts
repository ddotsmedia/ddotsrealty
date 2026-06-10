import type { Job } from "bullmq";

export async function handleLeadFollowup(job: Job): Promise<void> {
  console.log(`[handler] processing lead-followup job ${job.id}`);
  // TODO: Implement lead follow-up logic
  // - Query leads pending follow-up
  // - Generate follow-up messages
  // - Send via WhatsApp/email/SMS
  // - Record activity
}
