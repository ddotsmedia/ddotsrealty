import type { Job } from "bullmq";
import { and, eq, gte, lt, count } from "drizzle-orm";
import { startOfDay, addDays, startOfWeek } from "date-fns";
import { db } from "@/server/db";
import { tenants, cheques, leads, users } from "@/server/db/schema";
import { logAndSend, buildDailySummary } from "@/server/services/whatsapp.service";

export async function handleDailySummary(job: Job): Promise<void> {
  console.log(`[handler] processing daily-summary job ${job.id}`);

  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });

  const activeTenants = await db
    .select()
    .from(tenants)
    .where(and(eq(tenants.isActive, true), eq(tenants.remindersEnabled, true)));

  for (const tenant of activeTenants) {
    try {
      const [dueTodayRow] = await db
        .select({ value: count() })
        .from(cheques)
        .where(
          and(
            eq(cheques.tenantId, tenant.id),
            eq(cheques.status, "pending"),
            gte(cheques.dueDate, today),
            lt(cheques.dueDate, tomorrow),
          ),
        );

      const [overdueRow] = await db
        .select({ value: count() })
        .from(cheques)
        .where(
          and(
            eq(cheques.tenantId, tenant.id),
            eq(cheques.status, "pending"),
            lt(cheques.dueDate, today),
          ),
        );

      const [newLeadsRow] = await db
        .select({ value: count() })
        .from(leads)
        .where(and(eq(leads.tenantId, tenant.id), gte(leads.createdAt, weekStart)));

      const text = buildDailySummary({
        counts: {
          chequesDueToday: dueTodayRow?.value ?? 0,
          overdueCheques: overdueRow?.value ?? 0,
          newLeadsThisWeek: newLeadsRow?.value ?? 0,
        },
      });

      const admin = await db.query.users.findFirst({
        where: and(eq(users.tenantId, tenant.id), eq(users.role, "admin")),
      });

      await logAndSend({
        tenantId: tenant.id,
        jobType: "daily_summary",
        entityType: "tenant",
        entityId: tenant.id,
        recipient: admin?.phone,
        text,
      });
    } catch (err) {
      console.error(`[daily-summary] failed for tenant ${tenant.id}:`, err);
    }
  }
}
