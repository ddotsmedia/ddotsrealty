import { whapiPost } from "@/lib/whapi";

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

// TODO: Wire delivery receipts and webhook handlers for WhatsApp message status updates
