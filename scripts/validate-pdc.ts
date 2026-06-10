import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { tenants, users, properties, owners, propertyTenants, contracts, cheques, transactions, bankAccounts } from "@/server/db/schema";
import { createCaller } from "@/server/trpc/root";
import { hashPassword } from "@/lib/password";

async function main() {
  const [t] = await db.insert(tenants).values({ name: "PDC Validation", slug: `pdc-${Date.now()}`, type: "agency", emirate: "dubai" }).returning();
  const [u] = await db.insert(users).values({ tenantId: t.id, email: `pdc-${Date.now()}@test.com`, name: "Admin", passwordHash: await hashPassword("Test1234!"), role: "admin" }).returning();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ctx: any = { db, session: { user: { id: u.id, role: "admin", tenantId: t.id } }, userId: u.id, tenantId: t.id, role: "admin" };
  const api = createCaller(ctx);

  const prop = await api.property.create({ title: "PDC Unit", type: "apartment", purpose: "rent", status: "rented", amenities: [], emirate: "dubai" });
  const owner = await api.owner.create({ name: "Owner One", phone: "+971500000001" });
  const ten = await api.propertyTenant.create({ name: "Renter One", phone: "+971500000002" });

  // Contract with new lease-term fields
  const start = new Date(); start.setDate(1);
  const end = new Date(start); end.setFullYear(end.getFullYear() + 1);
  const contract = await api.contract.create({
    propertyId: prop.id, propertyTenantId: ten.id, ownerId: owner.id,
    contractType: "new", startDate: start, endDate: end,
    rentAmount: 100000, securityDeposit: 8000, commissionPct: 5,
    paymentMode: "cheques", numCheques: 4,
    rentFreeMonths: 1, gracePeriodDays: 5, escalationPct: 5,
    securityDepositStatus: "held", autoRenew: true, terminationNoticeDays: 90,
  });
  const [savedContract] = await db.select().from(contracts).where(eq(contracts.id, contract.id));
  console.log("contract fields → rentFree:", savedContract.rentFreeMonths, "grace:", savedContract.gracePeriodDays, "escalation:", savedContract.escalationPct, "autoRenew:", savedContract.autoRenew, "| cheques:", contract.chequesCreated);

  const chRows = await db.select().from(cheques).where(eq(cheques.contractId, contract.id));
  // Clear the first cheque → expect auto transaction
  await api.cheque.updateStatus({ id: chRows[0].id, status: "cleared" });
  const tx = await db.select().from(transactions).where(eq(transactions.referenceId, chRows[0].id));
  console.log("auto-transaction on clear:", tx.length === 1 ? `OK (${tx[0].type}, ${tx[0].amount})` : `FAIL (${tx.length})`);

  // Postpone the second cheque
  const newDue = new Date(chRows[1].dueDate); newDue.setMonth(newDue.getMonth() + 1);
  await api.cheque.postpone({ id: chRows[1].id, newDueDate: newDue, note: "Tenant requested delay" });
  const [postponed] = await db.select().from(cheques).where(eq(cheques.id, chRows[1].id));
  console.log("postpone:", postponed.postponed && postponed.originalDueDate && postponed.status === "postponed" ? "OK" : `FAIL (postponed=${postponed.postponed}, status=${postponed.status})`);

  // Bank account + assign to a cheque
  const bank = await api.bankAccount.create({ bankName: "Emirates NBD", accountNumber: "1234567890", isDefault: true });
  const bankSel = await api.bankAccount.selectable();
  await api.cheque.updateDetails({ id: chRows[2].id, direction: "payable", bankAccountId: bank.id, custodyHolder: "Front Office" });
  const [updated] = await db.select().from(cheques).where(eq(cheques.id, chRows[2].id));
  console.log("updateDetails:", updated.direction === "payable" && updated.bankAccountId === bank.id ? "OK" : "FAIL", "| bank selectable:", bankSel.length);

  // Dashboard widgets
  const next7 = await api.dashboard.chequesNext7Days();
  const aging = await api.dashboard.rentReceivableAging();
  console.log("dashboard next7:", Array.isArray(next7) ? next7.length : "n/a", "| aging buckets:", aging.length);

  // Today's cheques
  const today = await api.cheque.todaysCheques();
  console.log("todaysCheques:", Array.isArray(today) ? today.length : "n/a");

  // Owner statement
  const stmt = await api.owner.statement({ ownerId: owner.id, from: start, to: end });
  console.log("owner statement → rent:", stmt.totalRent, "commission:", stmt.totalCommission, "maint:", stmt.totalMaintenance, "net:", stmt.netPayable);

  // cleanup
  await db.delete(transactions).where(eq(transactions.tenantId, t.id));
  await db.delete(cheques).where(eq(cheques.tenantId, t.id));
  await db.delete(contracts).where(eq(contracts.tenantId, t.id));
  await db.delete(bankAccounts).where(eq(bankAccounts.tenantId, t.id));
  await db.delete(properties).where(eq(properties.tenantId, t.id));
  await db.delete(owners).where(eq(owners.tenantId, t.id));
  await db.delete(propertyTenants).where(eq(propertyTenants.tenantId, t.id));
  await db.delete(users).where(eq(users.id, u.id));
  await db.delete(tenants).where(eq(tenants.id, t.id));

  const ok = tx.length === 1 && postponed.postponed && updated.direction === "payable" && aging.length > 0;
  console.log(ok ? "PDC VALIDATION OK" : "PDC VALIDATION FAILED");
  process.exit(ok ? 0 : 1);
}
main().catch((e) => { console.error("PDC VALIDATION ERROR:", e); process.exit(1); });
