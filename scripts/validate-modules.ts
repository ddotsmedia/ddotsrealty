import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { tenants, users, properties, leads, leadActivities, maintenanceRequests } from "@/server/db/schema";
import { createCaller } from "@/server/trpc/root";
import { hashPassword } from "@/lib/password";

async function main() {
  const [t] = await db.insert(tenants).values({ name: "Mod Validation", slug: `mod-${Date.now()}`, type: "agency", emirate: "dubai" }).returning();
  const [u] = await db.insert(users).values({ tenantId: t.id, email: `mod-${Date.now()}@test.com`, name: "Admin", passwordHash: await hashPassword("Test1234!"), role: "admin" }).returning();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ctx: any = { db, session: { user: { id: u.id, role: "admin", tenantId: t.id } }, userId: u.id, tenantId: t.id, role: "admin" };
  const api = createCaller(ctx);

  const prop = await api.property.create({ title: "Maint Unit", type: "apartment", purpose: "rent", status: "rented", amenities: [], emirate: "dubai" });

  const lead = await api.lead.create({ name: "Sara Khan", phone: "+971501234567", source: "whatsapp", status: "new", budgetMin: 80000, budgetMax: 120000 });
  await api.lead.addActivity({ leadId: lead.id, type: "call", content: "Initial call" });
  const board = await api.lead.board();
  const leadList = await api.lead.list({ page: 1, pageSize: 20 });
  const leadDetail = await api.lead.getById({ id: lead.id });
  console.log("lead board:", board.length, "list total:", leadList.total, "activities:", leadDetail.activities.length);

  const mr = await api.maintenance.create({ propertyId: prop.id, category: "plumbing", priority: "high", status: "reported", description: "Leaking tap", beforePhotos: [] });
  const mrList = await api.maintenance.list({ page: 1, pageSize: 20 });
  const mrDetail = await api.maintenance.getById({ id: mr.id });
  await api.maintenance.updateStatus({ id: mr.id, status: "in_progress" });
  console.log("maintenance list total:", mrList.total, "detail property:", mrDetail.property?.title);

  // cleanup
  await db.delete(leadActivities).where(eq(leadActivities.leadId, lead.id));
  await db.delete(leads).where(eq(leads.tenantId, t.id));
  await db.delete(maintenanceRequests).where(eq(maintenanceRequests.tenantId, t.id));
  await db.delete(properties).where(eq(properties.tenantId, t.id));
  await db.delete(users).where(eq(users.id, u.id));
  await db.delete(tenants).where(eq(tenants.id, t.id));

  const ok = board.length === 1 && leadList.total === 1 && mrList.total === 1 && mrDetail.property?.title === "Maint Unit";
  console.log(ok ? "MODULES VALIDATION OK" : "MODULES VALIDATION FAILED");
  process.exit(ok ? 0 : 1);
}
main().catch((e) => { console.error("MODULES VALIDATION ERROR:", e); process.exit(1); });
