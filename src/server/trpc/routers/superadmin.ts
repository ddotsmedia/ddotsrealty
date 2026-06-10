import { createTRPCRouter, superAdminProcedure } from "@/server/trpc/trpc";
import { db } from "@/server/db";
import { tenants, users, properties } from "@/server/db/schema";
import { count, eq } from "drizzle-orm";

export const superadminRouter = createTRPCRouter({
  allTenants: superAdminProcedure.query(async () => {
    // TODO: Implement tenant listing with user & property counts
    // - Query all tenants
    // - Count users per tenant
    // - Count properties per tenant
    // - Return combined data

    const allTenants = await db.select().from(tenants);

    const tenantsWithCounts = await Promise.all(
      allTenants.map(async (tenant) => {
        const userCount = await db
          .select({ count: count() })
          .from(users)
          .where(eq(users.tenantId, tenant.id));

        const propertyCount = await db
          .select({ count: count() })
          .from(properties)
          .where(eq(properties.tenantId, tenant.id));

        return {
          ...tenant,
          userCount: userCount[0]?.count ?? 0,
          propertyCount: propertyCount[0]?.count ?? 0,
        };
      }),
    );

    return tenantsWithCounts;
  }),

  tenantStats: superAdminProcedure.query(async () => {
    // TODO: Implement platform-wide statistics
    // - Total tenant count
    // - Total user count
    // - Total property count
    // - Active contract count
    // - Total cheque value

    const tenantCount = await db
      .select({ count: count() })
      .from(tenants);

    const userCount = await db
      .select({ count: count() })
      .from(users);

    const propertyCount = await db
      .select({ count: count() })
      .from(properties);

    return {
      tenantCount: tenantCount[0]?.count ?? 0,
      userCount: userCount[0]?.count ?? 0,
      propertyCount: propertyCount[0]?.count ?? 0,
      activeContracts: 0, // TODO: Query actual active contracts
      totalChequeValue: 0, // TODO: Sum cheque amounts from cheques table
    };
  }),

  subscriptions: superAdminProcedure.query(async () => {
    // TODO: Implement subscription listing
    // - Query all tenants with subscription info
    // - Filter to show subscription tier, expiry date, active status
    // - Return array of tenant subscription details

    const allTenants = await db.select().from(tenants);

    return allTenants.map((tenant) => ({
      id: tenant.id,
      name: tenant.name,
      subscription: tenant.subscription,
      subscriptionExpiresAt: tenant.subscriptionExpiresAt,
      isActive:
        tenant.isActive && (!tenant.subscriptionExpiresAt || new Date() < tenant.subscriptionExpiresAt),
    }));
  }),
});
