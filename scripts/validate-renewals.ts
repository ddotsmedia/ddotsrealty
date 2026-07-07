import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { tenants, users, properties, owners, propertyTenants, contracts, cheques } from "@/server/db/schema";
import { createCaller } from "@/server/trpc/root";
import { hashPassword } from "@/lib/password";
import { calcRentIncrease } from "@/lib/rera";

async function main() {
  const results: string[] = [];

  // RERA calc (pure): current 80k, market 100k → 20% below → 10% allowed → max 88k
  const rera = calcRentIncrease({ currentRent: 80000, marketRent: 100000 });
  results.push(`rera: below=${rera.pctBelowMarket}% allowed=${rera.allowedIncreasePct}% max=${rera.maxNewRent}`);

  const [t] = await db.insert(tenants).values({ name: "Renew Validation", slug: `renew-${Date.now()}`, type: "agency", emirate: "dubai" }).returning();
  const [u] = await db.insert(users).values({ tenantId: t.id, email: `renew-${Date.now()}@test.com`, name: "Admin", passwordHash: await hashPassword("Test1234!"), role: "admin" }).returning();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ctx: any = { db, session: { user: { id: u.id, role: "admin", tenantId: t.id } }, userId: u.id, tenantId: t.id, role: "admin" };
  const api = createCaller(ctx);

  const prop = await api.property.create({ title: "Renew Unit", type: "apartment", purpose: "rent", status: "rented", amenities: [], emirate: "dubai", price: 100000 });
  const owner = await api.owner.create({ name: "Owner R", phone: "+971500000020" });
  const pt = await api.propertyTenant.create({ name: "Tenant R", phone: "+971500000021" });
  const start = new Date("2025-07-01"); const end = new Date("2026-06-30");
  const orig = await api.contract.create({ propertyId: prop.id, propertyTenantId: pt.id, ownerId: owner.id, contractType: "new", startDate: start, endDate: end, rentAmount: 80000, paymentMode: "cheques", numCheques: 2 });

  // Renew with escalated rent
  const newStart = new Date("2026-07-01"); const newEnd = new Date("2027-06-30");
  const renewed = await api.contract.renew({ contractId: orig.id, startDate: newStart, endDate: newEnd, rentAmount: 88000, numCheques: 4 });
  const [newContract] = await db.select().from(contracts).where(eq(contracts.id, renewed.id));
  const [oldContract] = await db.select().from(contracts).where(eq(contracts.id, orig.id));
  const newCheques = await db.select().from(cheques).where(eq(cheques.contractId, renewed.id));
  results.push(`renew: type=${newContract.contractType} from=${newContract.renewedFromContractId === orig.id} rent=${newContract.rentAmount} cheques=${newCheques.length} oldStatus=${oldContract.status} chequesCreated=${renewed.chequesCreated}`);

  const chain = await api.contract.renewalChain({ id: renewed.id });
  results.push(`renewalChain: prev=${chain ? "present" : "null"}`);

  // AI (fallback text when no key)
  const desc = await api.ai.describeListing({ title: "2BR Marina Apartment", type: "apartment", bedrooms: 2, community: "Dubai Marina", price: 120000 });
  const reply = await api.ai.suggestLeadReply({ leadName: "Sara", enquiry: "Is the villa still available?" });
  const aiStatus = await api.ai.status();
  results.push(`ai: descLen=${desc.text.length} replyLen=${reply.text.length} configured=${aiStatus.configured}`);

  // Reports
  const rr = await api.report.rentRoll();
  const vac = await api.report.vacancy();
  const le = await api.report.leaseExpiry();
  results.push(`reports: rentRoll=${rr.items?.length ?? "n/a"} vacancy=${vac.items?.length ?? "n/a"} leaseExpiryBuckets=${le.buckets?.length ?? "n/a"}`);

  console.log(results.join("\n"));

  // cleanup
  await db.delete(cheques).where(eq(cheques.tenantId, t.id));
  await db.delete(contracts).where(eq(contracts.tenantId, t.id));
  await db.delete(properties).where(eq(properties.tenantId, t.id));
  await db.delete(owners).where(eq(owners.tenantId, t.id));
  await db.delete(propertyTenants).where(eq(propertyTenants.tenantId, t.id));
  await db.delete(users).where(eq(users.id, u.id));
  await db.delete(tenants).where(eq(tenants.id, t.id));

  const ok = rera.allowedIncreasePct === 5 && rera.maxNewRent === 84000 && newContract.contractType === "renewal" && newContract.renewedFromContractId === orig.id && newCheques.length === 4 && oldContract.status === "expired" && desc.text.length > 0 && reply.text.length > 0;
  console.log(ok ? "RENEWALS VALIDATION OK" : "RENEWALS VALIDATION FAILED");
  process.exit(ok ? 0 : 1);
}
main().catch((e) => { console.error("RENEWALS VALIDATION ERROR:", e); process.exit(1); });
