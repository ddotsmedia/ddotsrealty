import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { createCaller } from "@/server/trpc/root";

async function main() {
  const [admin] = await db.select().from(users).where(eq(users.email, "admin@alshamsi.ae")).limit(1);
  if (!admin) throw new Error("seeded admin not found");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ctx: any = { db, session: { user: { id: admin.id, role: admin.role, tenantId: admin.tenantId } }, userId: admin.id, tenantId: admin.tenantId, role: admin.role };
  const api = createCaller(ctx);

  const txSummary = await api.transaction.summary();
  const txList = await api.transaction.list({ page: 1, pageSize: 20 });
  const commSummary = await api.commission.summary();
  const commList = await api.commission.list({ page: 1, pageSize: 20 });
  const portfolio = await api.report.portfolio();
  const chequeBreakdown = await api.report.chequeBreakdown();
  const leadConversion = await api.report.leadConversion();

  console.log("tx summary:", JSON.stringify(txSummary).slice(0, 200));
  console.log("tx list total:", txList.total);
  console.log("commission summary:", JSON.stringify(commSummary));
  console.log("commission list total:", commList.total);
  console.log("portfolio:", JSON.stringify(portfolio).slice(0, 200));
  console.log("chequeBreakdown:", JSON.stringify(chequeBreakdown).slice(0, 200));
  console.log("leadConversion:", JSON.stringify(leadConversion).slice(0, 200));

  console.log("ACCOUNTING VALIDATION OK");
  process.exit(0);
}
main().catch((e) => { console.error("ACCOUNTING VALIDATION ERROR:", e); process.exit(1); });
