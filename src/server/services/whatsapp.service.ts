import { whapiPost, whapiConfigured } from "@/lib/whapi";
import { db } from "@/server/db";
import { jobLogs } from "@/server/db/schema";

export async function sendWhatsAppMessage(
  to: string,
  body: string,
): Promise<unknown> {
  const phone = to.replace(/\D/g, "");
  return whapiPost("/messages/text", { to: phone, body });
}

export interface SendChequeReminderOpts {
  phone: string;
  tenantName: string;
  amount: string;
  dueDate: string;
  chequeNumber?: string;
}

export function buildChequeReminderMessage(
  opts: SendChequeReminderOpts,
): string {
  const chequeInfo = opts.chequeNumber
    ? ` (Cheque #${opts.chequeNumber})`
    : "";
  return (
    `Hi ${opts.tenantName},\n\n` +
    `This is a reminder that your rent cheque of ${opts.amount} ` +
    `is due on ${opts.dueDate}${chequeInfo}.\n\n` +
    `Please ensure timely payment.\n\n` +
    `Best regards,\nDdotsRealty Team`
  );
}

export async function sendChequeReminder(
  opts: SendChequeReminderOpts,
): Promise<unknown> {
  const message = buildChequeReminderMessage(opts);
  return sendWhatsAppMessage(opts.phone, message);
}

// --- Job-automation additions below ---

/**
 * Send a WhatsApp message via Whapi. If Whapi isn't configured (no token set),
 * logs the message to the console instead of sending, and returns a
 * `{ skipped: true }` marker rather than throwing.
 */
export async function sendMessage(
  phone: string,
  text: string,
): Promise<unknown> {
  const cleaned = phone.replace(/\D/g, "");
  if (!whapiConfigured) {
    console.log(`[whatsapp] (skipped, whapi not configured) to ${cleaned}:\n${text}`);
    return { skipped: true };
  }
  return whapiPost("/messages/text", { to: cleaned, body: text });
}

export interface ChequeReminderTemplateOpts {
  tenantName?: string;
  amount: string | number;
  dueDate: string;
  propertyTitle?: string;
}

export function buildChequeReminder(opts: ChequeReminderTemplateOpts): string {
  const name = opts.tenantName ?? "there";
  const propertyInfo = opts.propertyTitle ? ` for ${opts.propertyTitle}` : "";
  return (
    `Hi ${name},\n\n` +
    `This is a reminder that your rent cheque of AED ${opts.amount}${propertyInfo} ` +
    `is due on ${opts.dueDate}.\n\n` +
    `Please ensure timely payment.\n\n` +
    `Best regards,\nDdotsRealty Team`
  );
}

export function buildChequeOverdue(opts: ChequeReminderTemplateOpts): string {
  const name = opts.tenantName ?? "there";
  const propertyInfo = opts.propertyTitle ? ` for ${opts.propertyTitle}` : "";
  return (
    `Hi ${name},\n\n` +
    `Your rent cheque of AED ${opts.amount}${propertyInfo} was due on ${opts.dueDate} ` +
    `and is now overdue.\n\n` +
    `Please arrange payment or contact us as soon as possible.\n\n` +
    `Best regards,\nDdotsRealty Team`
  );
}

export interface ContractExpiryTemplateOpts {
  propertyTitle?: string;
  endDate: string;
  daysLeft: number;
}

export function buildContractExpiry(opts: ContractExpiryTemplateOpts): string {
  const propertyInfo = opts.propertyTitle ? ` for ${opts.propertyTitle}` : "";
  return (
    `Hi,\n\n` +
    `This is a reminder that the tenancy contract${propertyInfo} is due to expire ` +
    `on ${opts.endDate} (${opts.daysLeft} day${opts.daysLeft === 1 ? "" : "s"} left).\n\n` +
    `Please arrange renewal or follow up with the tenant.\n\n` +
    `Best regards,\nDdotsRealty Team`
  );
}

export interface DailySummaryCounts {
  chequesDueToday: number;
  overdueCheques: number;
  newLeadsThisWeek: number;
}

export function buildDailySummary(opts: { counts: DailySummaryCounts }): string {
  const { counts } = opts;
  return (
    `Good morning,\n\n` +
    `Here's today's summary:\n` +
    `- Cheques due today: ${counts.chequesDueToday}\n` +
    `- Overdue cheques: ${counts.overdueCheques}\n` +
    `- New leads this week: ${counts.newLeadsThisWeek}\n\n` +
    `Best regards,\nDdotsRealty Team`
  );
}

export interface LogAndSendOpts {
  tenantId: string;
  jobType: string;
  entityType?: string;
  entityId?: string;
  recipient?: string | null;
  text: string;
}

/**
 * Sends a WhatsApp message (or logs a skip if there's no recipient), and
 * always records the outcome in jobLogs for auditing/dashboard counters.
 */
export async function logAndSend(opts: LogAndSendOpts): Promise<void> {
  if (!opts.recipient) {
    await db.insert(jobLogs).values({
      tenantId: opts.tenantId,
      jobType: opts.jobType,
      entityType: opts.entityType,
      entityId: opts.entityId,
      channel: "whatsapp",
      recipient: opts.recipient ?? null,
      status: "skipped",
      message: opts.text,
    });
    return;
  }

  try {
    await sendMessage(opts.recipient, opts.text);
    await db.insert(jobLogs).values({
      tenantId: opts.tenantId,
      jobType: opts.jobType,
      entityType: opts.entityType,
      entityId: opts.entityId,
      channel: "whatsapp",
      recipient: opts.recipient,
      status: "sent",
      message: opts.text,
    });
  } catch (error) {
    console.error(`[whatsapp] logAndSend failed for ${opts.jobType}:`, error);
    await db.insert(jobLogs).values({
      tenantId: opts.tenantId,
      jobType: opts.jobType,
      entityType: opts.entityType,
      entityId: opts.entityId,
      channel: "whatsapp",
      recipient: opts.recipient,
      status: "failed",
      message: opts.text,
    });
  }
}

// TODO: Wire delivery receipts and webhook handlers for WhatsApp message status updates
