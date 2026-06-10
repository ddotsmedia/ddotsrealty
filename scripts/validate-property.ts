import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { tenants, users, properties } from "@/server/db/schema";
import { createCaller } from "@/server/trpc/root";
import { hashPassword } from "@/lib/password";

async function main() {
  const [t] = await db
    .insert(tenants)
    .values({ name: "Validation Co", slug: `val-${Date.now()}`, type: "agency", emirate: "dubai" })
    .returning();
  const [u] = await db
    .insert(users)
    .values({
      tenantId: t.id,
      email: `val-${Date.now()}@test.com`,
      name: "Val Admin",
      passwordHash: await hashPassword("Test1234!"),
      role: "admin",
    })
    .returning();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ctx: any = {
    db,
    session: { user: { id: u.id, role: "admin", tenantId: t.id } },
    userId: u.id,
    tenantId: t.id,
    role: "admin",
  };
  const caller = createCaller(ctx);

  const created = await caller.property.create({
    title: "Test Villa",
    type: "villa",
    purpose: "rent",
    status: "available",
    price: 120000,
    priceFrequency: "yearly",
    currency: "AED",
    emirate: "dubai",
    community: "Dubai Marina",
    amenities: [],
  });
  const list = await caller.property.list({ page: 1, pageSize: 12 });
  const detail = await caller.property.getById({ id: created.id });

  console.log("created:", created.id);
  console.log("list total:", list.total, "items:", list.items.length);
  console.log("detail title:", detail.title, "owner:", detail.ownerName);

  // cleanup
  await db.delete(properties).where(eq(properties.tenantId, t.id));
  await db.delete(users).where(eq(users.id, u.id));
  await db.delete(tenants).where(eq(tenants.id, t.id));
  console.log("VALIDATION OK");
  process.exit(0);
}

main().catch((e) => {
  console.error("VALIDATION FAILED:", e);
  process.exit(1);
});
