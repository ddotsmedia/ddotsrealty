import { z } from "zod";
import {
  eq,
  and,
  inArray,
  count,
  sum,
  desc,
  asc,
} from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, tenantProcedure } from "@/server/trpc/trpc";
import { db } from "@/server/db";
import { commissions, users } from "@/server/db/schema";
import {
  commissionListSchema,
  commissionStatusSchema,
} from "@/lib/validators/accounting";

export const commissionRouter = createTRPCRouter({
  list: tenantProcedure
    .input(commissionListSchema)
    .query(async ({ ctx, input }) => {
      const { page, pageSize, status, sortBy, sortDir } = input;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const conditions: any[] = [];

      // Tenant scope
      if (ctx.role !== "super_admin" || ctx.tenantId) {
        conditions.push(eq(commissions.tenantId, ctx.tenantId!));
      }

      // Status filter
      if (status) conditions.push(eq(commissions.status, status as any)); // eslint-disable-line @typescript-eslint/no-explicit-any

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      // Get total count
      const totalResult = await db
        .select({ count: count() })
        .from(commissions)
        .where(where);
      const total = totalResult[0]?.count ?? 0;

      // Get rows with sorting and pagination
      const orderByColumn =
        sortBy === "commissionAmount"
          ? commissions.commissionAmount
          : commissions.createdAt;
      const orderByDir = sortDir === "asc" ? asc : desc;

      const rows = await db
        .select({
          id: commissions.id,
          tenantId: commissions.tenantId,
          brokerId: commissions.brokerId,
          dealType: commissions.dealType,
          dealValue: commissions.dealValue,
          commissionPct: commissions.commissionPct,
          commissionAmount: commissions.commissionAmount,
          companyShare: commissions.companyShare,
          brokerShare: commissions.brokerShare,
          status: commissions.status,
          paidDate: commissions.paidDate,
          createdAt: commissions.createdAt,
        })
        .from(commissions)
        .where(where)
        .orderBy(orderByDir(orderByColumn))
        .limit(pageSize)
        .offset((page - 1) * pageSize);

      // Fetch broker names
      const brokerIds = rows
        .filter((r) => r.brokerId)
        .map((r) => r.brokerId as string);
      const brokerMap: Record<string, string> = {};
      if (brokerIds.length > 0) {
        const brokers = await db
          .select({ id: users.id, name: users.name })
          .from(users)
          .where(inArray(users.id, brokerIds));
        brokers.forEach((b) => {
          brokerMap[b.id] = b.name;
        });
      }

      // Enrich items with broker names
      const items = rows.map((row) => ({
        ...row,
        brokerName: row.brokerId ? brokerMap[row.brokerId] || "Unknown" : null,
      }));

      return {
        items,
        total,
        page,
        pageSize,
        pageCount: Math.ceil(total / pageSize),
      };
    }),

  updateStatus: tenantProcedure
    .input(commissionStatusSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, status } = input;

      const commission = await db.query.commissions.findFirst({
        where: and(
          eq(commissions.id, id),
          ctx.role === "super_admin" && ctx.tenantId === null
            ? undefined
            : eq(commissions.tenantId, ctx.tenantId!)
        ),
      });

      if (!commission) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const paidDate = status === "paid" ? new Date() : null;

      await db
        .update(commissions)
        .set({
          status: status as any, // eslint-disable-line @typescript-eslint/no-explicit-any
          paidDate,
        })
        .where(eq(commissions.id, id));

      return { ok: true };
    }),

  summary: tenantProcedure.query(async ({ ctx }) => {
    // Per-table tenant filter
    const tf = (col: any) => // eslint-disable-line @typescript-eslint/no-explicit-any
      ctx.role === "super_admin" && ctx.tenantId === null
        ? undefined
        : eq(col, ctx.tenantId!);

    // Pending commissions
    const [pendingResult] = await db
      .select({
        count: count(),
        total: sum(commissions.commissionAmount),
      })
      .from(commissions)
      .where(
        and(
          tf(commissions.tenantId),
          eq(commissions.status, "pending")
        )
      );

    const pendingCount = pendingResult?.count ?? 0;
    const pendingAmount = Number(pendingResult?.total ?? 0);

    // Paid commissions
    const [paidResult] = await db
      .select({
        count: count(),
        total: sum(commissions.commissionAmount),
      })
      .from(commissions)
      .where(
        and(
          tf(commissions.tenantId),
          eq(commissions.status, "paid")
        )
      );

    const paidCount = paidResult?.count ?? 0;
    const paidAmount = Number(paidResult?.total ?? 0);

    return {
      pendingCount,
      pendingAmount,
      paidCount,
      paidAmount,
    };
  }),
});
