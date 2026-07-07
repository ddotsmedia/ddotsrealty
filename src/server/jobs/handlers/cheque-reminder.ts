import type { Job } from "bullmq";
import { and, eq, gte, lte, lt } from "drizzle-orm";
import { startOfDay, endOfDay, addDays, differenceInCalendarDays, format } from "date-fns";
import { db } from "@/server/db";
import { tenants, cheques, propertyTenants, properties, users } from "@/server/db/schema";
import {
  logAndSend,
  buildChequeReminder,
  buildChequeOverdue,
} from "@/server/services/whatsapp.service";

export async function handleChequeReminder(job: Job): Promise<void> {
  console.log(`[handler] processing cheque-reminder job ${job.id}`);

  const today = startOfDay(new Date());

  const activeTenants = await db
    .select()
    .from(tenants)
    .where(and(eq(tenants.isActive, true), eq(tenants.remindersEnabled, true)));

  for (const tenant of activeTenants) {
    try {
      const reminderDays: number[] = tenant.chequeReminderDays ?? [3, 7];
      if (reminderDays.length > 0) {
        const maxDays = Math.max(...reminderDays);
        // end-of-day so cheques due later on the boundary day are still included
        const windowEnd = endOfDay(addDays(today, maxDays));

        const upcoming = await db
          .select({
            cheque: cheques,
            tenantName: propertyTenants.name,
            tenantPhone: propertyTenants.phone,
            propertyTitle: properties.title,
          })
          .from(cheques)
          .leftJoin(propertyTenants, eq(cheques.propertyTenantId, propertyTenants.id))
          .leftJoin(properties, eq(cheques.propertyId, properties.id))
          .where(
            and(
              eq(cheques.tenantId, tenant.id),
              eq(cheques.status, "pending"),
              gte(cheques.dueDate, today),
              lte(cheques.dueDate, windowEnd),
            ),
          );

        for (const row of upcoming) {
          try {
            const daysUntilDue = differenceInCalendarDays(row.cheque.dueDate, today);
            if (!reminderDays.includes(daysUntilDue)) continue;

            const text = buildChequeReminder({
              tenantName: row.tenantName ?? undefined,
              amount: row.cheque.amount,
              dueDate: format(row.cheque.dueDate, "dd MMM yyyy"),
              propertyTitle: row.propertyTitle ?? undefined,
            });

            await logAndSend({
              tenantId: tenant.id,
              jobType: "cheque_reminder",
              entityType: "cheque",
              entityId: row.cheque.id,
              recipient: row.tenantPhone,
              text,
            });
          } catch (err) {
            console.error(
              `[cheque-reminder] failed for cheque ${row.cheque.id} (tenant ${tenant.id}):`,
              err,
            );
          }
        }
      }

      // Overdue cheques: notify the property tenant AND a tenant-org admin.
      const overdue = await db
        .select({
          cheque: cheques,
          tenantName: propertyTenants.name,
          tenantPhone: propertyTenants.phone,
          propertyTitle: properties.title,
        })
        .from(cheques)
        .leftJoin(propertyTenants, eq(cheques.propertyTenantId, propertyTenants.id))
        .leftJoin(properties, eq(cheques.propertyId, properties.id))
        .where(
          and(
            eq(cheques.tenantId, tenant.id),
            eq(cheques.status, "pending"),
            lt(cheques.dueDate, today),
          ),
        );

      if (overdue.length > 0) {
        const admin = await db.query.users.findFirst({
          where: and(eq(users.tenantId, tenant.id), eq(users.role, "admin")),
        });

        for (const row of overdue) {
          try {
            const text = buildChequeOverdue({
              tenantName: row.tenantName ?? undefined,
              amount: row.cheque.amount,
              dueDate: format(row.cheque.dueDate, "dd MMM yyyy"),
              propertyTitle: row.propertyTitle ?? undefined,
            });

            await logAndSend({
              tenantId: tenant.id,
              jobType: "cheque_overdue",
              entityType: "cheque",
              entityId: row.cheque.id,
              recipient: row.tenantPhone,
              text,
            });

            if (admin?.phone) {
              await logAndSend({
                tenantId: tenant.id,
                jobType: "cheque_overdue",
                entityType: "cheque",
                entityId: row.cheque.id,
                recipient: admin.phone,
                text,
              });
            }
          } catch (err) {
            console.error(
              `[cheque-reminder] failed for overdue cheque ${row.cheque.id} (tenant ${tenant.id}):`,
              err,
            );
          }
        }
      }
    } catch (err) {
      console.error(`[cheque-reminder] failed for tenant ${tenant.id}:`, err);
    }
  }
}
