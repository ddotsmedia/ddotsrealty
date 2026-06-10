import { Resend } from "resend";

export const emailConfigured = !!process.env.RESEND_API_KEY;
const resend = emailConfigured
  ? new Resend(process.env.RESEND_API_KEY!)
  : null;

export interface SendEmailOpts {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail(opts: SendEmailOpts): Promise<unknown> {
  if (!resend) {
    console.warn("[email] Resend not configured, skipping email send");
    return { skipped: true };
  }

  try {
    return await resend.emails.send({
      from: opts.from ?? "DdotsRealty <noreply@ddotsrealty.com>",
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    });
  } catch (error) {
    console.error("[email] sendEmail failed:", error);
    throw error;
  }
}
