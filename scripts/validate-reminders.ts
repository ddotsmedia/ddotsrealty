import "dotenv/config";
import { eq, ne } from "drizzle-orm";
import { db } from "@/server/db";
import { tenants, users, properties, owners, propertyTenants, contracts, cheques, jobLogs } from "@/server/db/schema";
import { hashPassword } from "@/lib/password";
import { handleChequeReminder } from "@/server/jobs/handlers/cheque-reminder";
import { handleContractRenewal } from "@/server/jobs/handlers/contract-renewal";

function daysFromNow(n: number) { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + n); return d; }

async function main() {
  // Isolate: disable reminders on all existing tenants during the test
  await db.update(tenants).set({ remindersEnabled: false });

  const [t] = await db.insert(tenants).values({ name: "Reminder Validation", slug: `rem-${Date.now()}`, type: "agency", emirate: "dubai", remindersEnabled: true, chequeReminderDays: [2], contractReminderDays: [7] }).returning();
  const [admin] = await db.insert(users).values({ tenantId: t.id, email: `rem-${Date.now()}@test.com`, name: "Admin", passwordHash: await hashPassword("Test1234!"), role: "admin", phone: "+971500000099" }).returning();
  const [broker] = await db.insert(users).values({ tenantId: t.id, email: `remb-${Date.now()}@test.com`, name: "Broker", passwordHash: await hashPassword("Test1234!"), role: "broker", phone: "+971500000098" }).returning();
  const [prop] = await db.insert(properties).values({ tenantId: t.id, title: "Reminder Unit", type: "apartment", purpose: "rent", status: "rented", emirate: "dubai", assignedBroker: broker.id }).returning();
  const [owner] = await db.insert(owners).values({ tenantId: t.id, name: "Owner Rem" }).returning();
  const [pt] = await db.insert(propertyTenants).values({ tenantId: t.id, name: "Tenant Rem", phone: "+971500000097" }).returning();
  // Contract ending in 7 days (matches contractReminderDays [7])
  await db.insert(contracts).values({ tenantId: t.id, propertyId: prop.id, propertyTenantId: pt.id, ownerId: owner.id, startDate: daysFromNow(-358), endDate: daysFromNow(7), rentAmount: "90000", status: "active" });
  // Cheque due in 2 days (matches chequeReminderDays [2]) + one overdue
  await db.insert(cheques).values({ tenantId: t.id, propertyId: prop.id, propertyTenantId: pt.id, ownerId: owner.id, amount: "45000", dueDate: daysFromNow(2), status: "pending", direction: "receivable" });
  await db.insert(cheques).values({ tenantId: t.id, propertyId: prop.id, propertyTenantId: pt.id, ownerId: owner.id, amount: "45000", dueDate: daysFromNow(-5), status: "pending", direction: "receivable" });

  // Run handlers (job param unused)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await handleChequeReminder({ id: "test" } as any);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await handleContractRenewal({ id: "test" } as any);

  const logs = await db.select().from(jobLogs).where(eq(jobLogs.tenantId, t.id));
  const byType = logs.reduce<Record<string, number>>((a, l) => { a[l.jobType] = (a[l.jobType] ?? 0) + 1; return a; }, {});
  console.log("job_logs for test tenant:", JSON.stringify(byType), "total:", logs.length);

  // cleanup
  await db.delete(jobLogs).where(eq(jobLogs.tenantId, t.id));
  await db.delete(cheques).where(eq(cheques.tenantId, t.id));
  await db.delete(contracts).where(eq(contracts.tenantId, t.id));
  await db.delete(properties).where(eq(properties.tenantId, t.id));
  await db.delete(owners).where(eq(owners.tenantId, t.id));
  await db.delete(propertyTenants).where(eq(propertyTenants.tenantId, t.id));
  await db.delete(users).where(eq(users.tenantId, t.id));
  await db.delete(tenants).where(eq(tenants.id, t.id));
  // Restore other tenants' reminders
  await db.update(tenants).set({ remindersEnabled: true }).where(ne(tenants.id, t.id));

  const ok = (byType["cheque_reminder"] ?? 0) >= 1 && (byType["cheque_overdue"] ?? 0) >= 1 && (byType["contract_expiry"] ?? 0) >= 1;
  console.log(ok ? "REMINDERS VALIDATION OK" : "REMINDERS VALIDATION FAILED");
  process.exit(ok ? 0 : 1);
}
main().catch((e) => { console.error("REMINDERS VALIDATION ERROR:", e); process.exit(1); });
