import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { createCaller } from "@/server/trpc/root";
import { verifyPassword } from "@/lib/password";

async function main() {
  const [admin] = await db.select().from(users).where(eq(users.email, "admin@alshamsi.ae")).limit(1);
  if (!admin) throw new Error("seeded admin not found");
  const pwOk = await verifyPassword("Password123!", admin.passwordHash!);
  console.log("login password verify:", pwOk ? "OK" : "FAIL");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ctx: any = { db, session: { user: { id: admin.id, role: admin.role, tenantId: admin.tenantId } }, userId: admin.id, tenantId: admin.tenantId, role: admin.role };
  const api = createCaller(ctx);

  const now = new Date();
  const kpis = await api.dashboard.kpis();
  const charts = await api.dashboard.charts();
  const activity = await api.dashboard.recentActivity();
  const expiry = await api.dashboard.contractExpiry();
  const props = await api.property.list({ page: 1, pageSize: 12 });
  const chStats = await api.cheque.stats();
  const cal = await api.cheque.calendar({ year: now.getFullYear(), month: now.getMonth() + 1 });
  const board = await api.lead.board();
  const maint = await api.maintenance.list({ page: 1, pageSize: 20 });
  const docs = await api.document.grouped();
  const expSoon = await api.document.expiringSoon();

  console.log("KPIs:", JSON.stringify(kpis));
  console.log("charts revenueTrend pts:", charts.revenueTrend.length, "occupancy:", JSON.stringify(charts.occupancy), "pipeline buckets:", charts.leadPipeline.length);
  console.log("recentActivity:", activity.length, "| contractExpiry:", expiry.length);
  console.log("properties total:", props.total, "| cheque stats:", JSON.stringify(chStats));
  console.log("cheque calendar (this month):", Array.isArray(cal) ? cal.length : "n/a");
  console.log("lead board:", board.length, "| maintenance total:", maint.total);
  console.log("document groups:", docs.length, "| expiring soon:", expSoon.length);

  const ok = pwOk && props.total > 0 && board.length > 0;
  console.log(ok ? "SEEDED E2E OK" : "SEEDED E2E FAILED");
  process.exit(ok ? 0 : 1);
}
main().catch((e) => { console.error("SEEDED E2E ERROR:", e); process.exit(1); });
