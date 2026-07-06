import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import {
  tenants, users, properties, owners, propertyTenants, contracts, cheques,
  contractOccupants, inspections, inspectionItems, keyHandovers, utilityAccounts,
  parkingSlots, communications, announcements, nocRequests, tenantClearances,
} from "@/server/db/schema";
import { createCaller } from "@/server/trpc/root";
import { hashPassword } from "@/lib/password";

async function main() {
  const [t] = await db.insert(tenants).values({ name: "TenOps Validation", slug: `tenops-${Date.now()}`, type: "agency", emirate: "dubai" }).returning();
  const [u] = await db.insert(users).values({ tenantId: t.id, email: `tenops-${Date.now()}@test.com`, name: "Admin", passwordHash: await hashPassword("Test1234!"), role: "admin" }).returning();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ctx: any = { db, session: { user: { id: u.id, role: "admin", tenantId: t.id } }, userId: u.id, tenantId: t.id, role: "admin" };
  const api = createCaller(ctx);

  const prop = await api.property.create({ title: "TenOps Unit", type: "apartment", purpose: "rent", status: "rented", amenities: [], emirate: "dubai" });
  const owner = await api.owner.create({ name: "Owner X", phone: "+971500000010" });
  const ptenant = await api.propertyTenant.create({ name: "Tenant X", phone: "+971500000011" });
  const start = new Date(); const end = new Date(start); end.setFullYear(end.getFullYear() + 1);
  const contract = await api.contract.create({ propertyId: prop.id, propertyTenantId: ptenant.id, ownerId: owner.id, contractType: "new", startDate: start, endDate: end, rentAmount: 90000, paymentMode: "cheques", numCheques: 2 });

  const results: string[] = [];

  // Occupants
  await api.occupant.create({ contractId: contract.id, name: "Spouse X", relationship: "spouse", emiratesId: "784-1990-0000001-1" });
  const occ = await api.occupant.listByContract({ contractId: contract.id });
  results.push(`occupants=${occ.length}`);

  // Tenant screening + blacklist + outstanding
  await api.propertyTenant.setScreening({ id: ptenant.id, screeningStatus: "approved", screeningNotes: "Verified" });
  await api.propertyTenant.setBlacklist({ id: ptenant.id, blacklisted: true, reason: "test" });
  const ob = await api.propertyTenant.outstandingBalance({ id: ptenant.id });
  const td = await api.propertyTenant.getById({ id: ptenant.id });
  results.push(`screening=${td.screeningStatus},blacklisted=${td.blacklisted},outstanding=${ob.total}`);

  // Inspection with items
  const insp = await api.inspection.create({ propertyId: prop.id, contractId: contract.id, type: "move_in", inspectorName: "Inspector A", overallCondition: "good", items: [
    { room: "living_room", item: "Walls", condition: "good", photos: [], deductionAmount: 0 },
    { room: "kitchen", item: "Sink", condition: "fair", photos: [], deductionAmount: 150 },
  ] });
  const inspDetail = await api.inspection.getById({ id: insp.id });
  results.push(`inspectionItems=${inspDetail.items.length}`);

  // Key handover
  const kh = await api.keyHandover.create({ propertyId: prop.id, contractId: contract.id, type: "handover", keys: [{ type: "main_door", quantity: 2, condition: "good" }], receivedBy: "Tenant X" });
  const khList = await api.keyHandover.list({ page: 1, pageSize: 10 });
  results.push(`keyHandovers=${khList.total}`);

  // Utility
  const util = await api.utility.create({ propertyId: prop.id, contractId: contract.id, utilityType: "dewa", premiseNumber: "PR-123", status: "pending_activation", securityDeposit: 2000 });
  await api.utility.updateStatus({ id: util.id, status: "active" });
  const utilList = await api.utility.list({ page: 1, pageSize: 10 });
  results.push(`utilities=${utilList.total}`);

  // Parking assign/unassign
  const park = await api.parking.create({ propertyId: prop.id, slotNumber: "P-12", type: "covered", isAvailable: true });
  await api.parking.assign({ id: park.id, assignedTo: ptenant.id, vehiclePlate: "DXB-12345" });
  const parkDetail = await api.parking.getById({ id: park.id });
  results.push(`parkingAssigned=${parkDetail.isAvailable === false}`);

  // Communication + announcement
  await api.communication.create({ entityType: "property_tenant", entityId: ptenant.id, channel: "whatsapp", direction: "outbound", subject: "Welcome", content: "Hi" });
  const comms = await api.communication.list({ page: 1, pageSize: 10 });
  const ann = await api.announcement.create({ title: "Pool maintenance", content: "Closed Friday", targetType: "all", sentVia: ["whatsapp"] });
  const bc = await api.announcement.broadcast({ id: ann.id });
  results.push(`comms=${comms.total},announceBroadcast=${bc.ok}`);

  // NOC create + review
  const noc = await api.noc.create({ propertyTenantId: ptenant.id, contractId: contract.id, nocType: "pet", description: "Small cat" });
  await api.noc.review({ id: noc.id, status: "approved" });
  const nocDetail = await api.noc.getById({ id: noc.id });
  results.push(`nocStatus=${nocDetail.status}`);

  // Clearance create → update (totalOutstanding) → complete (frees unit)
  const clr = await api.clearance.create({ contractId: contract.id, propertyId: prop.id, propertyTenantId: ptenant.id, plannedMoveOut: end, depositAmount: 9000 });
  await api.clearance.update({ id: clr.id, outstandingRent: 1000, outstandingUtility: 200, outstandingMaintenance: 300, penaltyAmount: 500, settlementStatus: "pending" });
  const clrDetail = await api.clearance.getById({ id: clr.id });
  await api.clearance.complete({ id: clr.id });
  const [propAfter] = await db.select().from(properties).where(eq(properties.id, prop.id));
  results.push(`clearanceTotalOutstanding=${clrDetail.totalOutstanding},unitFreed=${propAfter.status === "available"}`);

  console.log(results.join(" | "));

  // cleanup
  for (const tbl of [contractOccupants, inspectionItems, inspections, keyHandovers, utilityAccounts, parkingSlots, communications, announcements, nocRequests, tenantClearances, cheques, contracts, properties, owners, propertyTenants]) {
    await db.delete(tbl).where(eq(tbl.tenantId, t.id));
  }
  await db.delete(users).where(eq(users.id, u.id));
  await db.delete(tenants).where(eq(tenants.id, t.id));

  const ok = occ.length === 1 && inspDetail.items.length === 2 && parkDetail.isAvailable === false && nocDetail.status === "approved" && Math.abs(Number(clrDetail.totalOutstanding) - 2000) < 0.01 && propAfter.status === "available";
  console.log(ok ? "TENANT-OPS VALIDATION OK" : "TENANT-OPS VALIDATION FAILED");
  process.exit(ok ? 0 : 1);
}
main().catch((e) => { console.error("TENANT-OPS VALIDATION ERROR:", e); process.exit(1); });
