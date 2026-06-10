import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { tenants, users, properties, owners, propertyTenants, contracts, cheques } from "@/server/db/schema";
import { createCaller } from "@/server/trpc/root";
import { hashPassword } from "@/lib/password";

async function main() {
  const [t] = await db.insert(tenants).values({ name: "Core Validation", slug: `core-${Date.now()}`, type: "agency", emirate: "dubai" }).returning();
  const [u] = await db.insert(users).values({ tenantId: t.id, email: `core-${Date.now()}@test.com`, name: "Admin", passwordHash: await hashPassword("Test1234!"), role: "admin" }).returning();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ctx: any = { db, session: { user: { id: u.id, role: "admin", tenantId: t.id } }, userId: u.id, tenantId: t.id, role: "admin" };
  const api = createCaller(ctx);

  const prop = await api.property.create({ title: "Marina Tower 1204", type: "apartment", purpose: "rent", status: "available", price: 120000, priceFrequency: "yearly", currency: "AED", emirate: "dubai", community: "Dubai Marina", amenities: [] });
  const owner = await api.owner.create({ name: "Ahmed Al Shamsi", phone: "+971501112222", emiratesId: "784-1990-1234567-1" });
  const ten = await api.propertyTenant.create({ name: "John Doe", phone: "+971502223333", emiratesId: "784-1985-7654321-2" });

  const start = new Date("2026-07-01");
  const end = new Date("2027-06-30");
  const contract = await api.contract.create({
    propertyId: prop.id, propertyTenantId: ten.id, ownerId: owner.id,
    contractType: "new", startDate: start, endDate: end,
    rentAmount: 120000, securityDeposit: 10000, commissionPct: 5,
    paymentMode: "cheques", numCheques: 4,
  });
  console.log("contract:", contract.id, "chequesCreated:", contract.chequesCreated);

  const chRows = await db.select().from(cheques).where(eq(cheques.contractId, contract.id));
  const sum = chRows.reduce((s, c) => s + Number(c.amount), 0);
  console.log("cheque count:", chRows.length, "sum:", sum, "(expect 4 / 120000)");

  // PII decrypt round-trip
  const ownerDetail = await api.owner.getById({ id: owner.id });
  console.log("owner PII decrypted:", ownerDetail.emiratesId === "784-1990-1234567-1" ? "OK" : `MISMATCH(${ownerDetail.emiratesId})`);

  // cheque calendar for July 2026
  const cal = await api.cheque.calendar({ year: 2026, month: 7 });
  console.log("july cheques in calendar:", Array.isArray(cal) ? cal.length : (cal.cheques?.length ?? JSON.stringify(Object.keys(cal))));

  // dashboard kpis
  const kpis = await api.dashboard.kpis();
  console.log("kpis activeProperties:", kpis.activeProperties, "chequesDueAmt:", kpis.chequesDueThisMonthAmount ?? kpis.chequesDueThisMonthCount);

  // cleanup
  await db.delete(cheques).where(eq(cheques.tenantId, t.id));
  await db.delete(contracts).where(eq(contracts.tenantId, t.id));
  await db.delete(properties).where(eq(properties.tenantId, t.id));
  await db.delete(owners).where(eq(owners.tenantId, t.id));
  await db.delete(propertyTenants).where(eq(propertyTenants.tenantId, t.id));
  await db.delete(users).where(eq(users.id, u.id));
  await db.delete(tenants).where(eq(tenants.id, t.id));

  const ok = chRows.length === 4 && Math.abs(sum - 120000) < 0.01;
  console.log(ok ? "CORE VALIDATION OK" : "CORE VALIDATION FAILED");
  process.exit(ok ? 0 : 1);
}

main().catch((e) => { console.error("CORE VALIDATION ERROR:", e); process.exit(1); });
