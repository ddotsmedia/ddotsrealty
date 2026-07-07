import type { Job } from "bullmq";
import { and, eq, gte, lt, isNotNull } from "drizzle-orm";
import { startOfDay, addDays, format } from "date-fns";
import { db } from "@/server/db";
import { tenants, leads, users } from "@/server/db/schema";
import { logAndSend } from "@/server/services/whatsapp.service";

export async function handleLeadFollowup(job: Job): Promise<void> {
  console.log(`[handler] processing lead-followup job ${job.id}`);

  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);

  const activeTenants = await db
    .select()
    .from(tenants)
    .where(and(eq(tenants.isActive, true), eq(tenants.remindersEnabled, true)));

  for (const tenant of activeTenants) {
    try {
      const dueLeads = await db
        .select()
        .from(leads)
        .where(
          and(
            eq(leads.tenantId, tenant.id),
            isNotNull(leads.nextFollowUp),
            gte(leads.nextFollowUp, today),
            lt(leads.nextFollowUp, tomorrow),
          ),
        );

      for (const lead of dueLeads) {
        try {
          let assignee: { phone: string | null } | undefined;
          if (lead.assignedTo) {
            assignee = await db.query.users.findFirst({
              where: eq(users.id, lead.assignedTo),
              columns: { phone: true },
            });
          }

          const text =
            `Hi,\n\nFollow-up reminder for lead "${lead.name}"` +
            (lead.phone ? ` (${lead.phone})` : "") +
            ` scheduled for today` +
            (lead.nextFollowUp ? ` (${format(lead.nextFollowUp, "dd MMM yyyy")})` : "") +
            `.\n\nStatus: ${lead.status}\n\nBest regards,\nDdotsRealty Team`;

          await logAndSend({
            tenantId: tenant.id,
            jobType: "lead_followup",
            entityType: "lead",
            entityId: lead.id,
            recipient: assignee?.phone,
            text,
          });
        } catch (err) {
          console.error(
            `[lead-followup] failed for lead ${lead.id} (tenant ${tenant.id}):`,
            err,
          );
        }
      }
    } catch (err) {
      console.error(`[lead-followup] failed for tenant ${tenant.id}:`, err);
    }
  }
}
