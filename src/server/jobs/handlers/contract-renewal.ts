import type { Job } from "bullmq";
import { and, eq, gte, lt } from "drizzle-orm";
import { startOfDay, addDays, format } from "date-fns";
import { db } from "@/server/db";
import { tenants, contracts, properties, users } from "@/server/db/schema";
import { logAndSend, buildContractExpiry } from "@/server/services/whatsapp.service";

export async function handleContractRenewal(job: Job): Promise<void> {
  console.log(`[handler] processing contract-renewal job ${job.id}`);

  const today = startOfDay(new Date());

  const activeTenants = await db
    .select()
    .from(tenants)
    .where(and(eq(tenants.isActive, true), eq(tenants.remindersEnabled, true)));

  for (const tenant of activeTenants) {
    try {
      const reminderDays: number[] = tenant.contractReminderDays ?? [7, 15, 30, 60, 90];

      const admin = await db.query.users.findFirst({
        where: and(eq(users.tenantId, tenant.id), eq(users.role, "admin")),
      });

      for (const daysLeft of reminderDays) {
        try {
          const targetDayStart = startOfDay(addDays(today, daysLeft));
          const targetDayEnd = addDays(targetDayStart, 1);

          const expiring = await db
            .select({
              contract: contracts,
              propertyTitle: properties.title,
              assignedBroker: properties.assignedBroker,
            })
            .from(contracts)
            .leftJoin(properties, eq(contracts.propertyId, properties.id))
            .where(
              and(
                eq(contracts.tenantId, tenant.id),
                eq(contracts.status, "active"),
                gte(contracts.endDate, targetDayStart),
                lt(contracts.endDate, targetDayEnd),
              ),
            );

          for (const row of expiring) {
            try {
              const text = buildContractExpiry({
                propertyTitle: row.propertyTitle ?? undefined,
                endDate: format(row.contract.endDate, "dd MMM yyyy"),
                daysLeft,
              });

              let broker: { phone: string | null } | undefined;
              if (row.assignedBroker) {
                broker = await db.query.users.findFirst({
                  where: eq(users.id, row.assignedBroker),
                  columns: { phone: true },
                });
              }

              await logAndSend({
                tenantId: tenant.id,
                jobType: "contract_expiry",
                entityType: "contract",
                entityId: row.contract.id,
                recipient: broker?.phone,
                text,
              });

              if (admin?.phone) {
                await logAndSend({
                  tenantId: tenant.id,
                  jobType: "contract_expiry",
                  entityType: "contract",
                  entityId: row.contract.id,
                  recipient: admin.phone,
                  text,
                });
              }
            } catch (err) {
              console.error(
                `[contract-renewal] failed for contract ${row.contract.id} (tenant ${tenant.id}):`,
                err,
              );
            }
          }
        } catch (err) {
          console.error(
            `[contract-renewal] failed for tenant ${tenant.id} at ${daysLeft} days:`,
            err,
          );
        }
      }
    } catch (err) {
      console.error(`[contract-renewal] failed for tenant ${tenant.id}:`, err);
    }
  }
}
