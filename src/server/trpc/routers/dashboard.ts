import { z } from "zod";
import {
  eq,
  and,
  gte,
  lte,
  ne,
  count,
  sum,
  sql,
  desc,
  inArray,
} from "drizzle-orm";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  subMonths,
  format,
} from "date-fns";
import { createTRPCRouter, tenantProcedure } from "@/server/trpc/trpc";
import { db } from "@/server/db";
import {
  properties,
  cheques,
  leads,
  contracts,
  transactions,
} from "@/server/db/schema";

export const dashboardRouter = createTRPCRouter({
  kpis: tenantProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const weekStart = startOfWeek(now);

    // Per-table tenant filter (super_admin with no tenant sees all)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tf = (col: any) =>
      ctx.role === "super_admin" && ctx.tenantId === null
        ? undefined
        : eq(col, ctx.tenantId!);

    // Active Properties (not off_market)
    const [activeResult] = await db
      .select({ count: count() })
      .from(properties)
      .where(and(tf(properties.tenantId), ne(properties.status, "off_market")));
    const activeProperties = activeResult?.count ?? 0;

    // Vacant Units (status = available)
    const [vacantResult] = await db
      .select({ count: count() })
      .from(properties)
      .where(and(tf(properties.tenantId), eq(properties.status, "available")));
    const vacantUnits = vacantResult?.count ?? 0;

    // Cheques Due This Month (pending status, dueDate in current month)
    const chequeDueWhere = and(
      tf(cheques.tenantId),
      eq(cheques.status, "pending"),
      gte(cheques.dueDate, monthStart),
      lte(cheques.dueDate, monthEnd)
    );
    const [chequeCountResult] = await db
      .select({ count: count() })
      .from(cheques)
      .where(chequeDueWhere);

    const [chequeAmountResult] = await db
      .select({ total: sum(cheques.amount) })
      .from(cheques)
      .where(chequeDueWhere);

    const chequesDueThisMonthCount = chequeCountResult?.count ?? 0;
    const chequesDueThisMonthAmount = Number(chequeAmountResult?.total ?? 0);

    // New Leads This Week
    const [leadsResult] = await db
      .select({ count: count() })
      .from(leads)
      .where(and(tf(leads.tenantId), gte(leads.createdAt, weekStart)));
    const newLeadsThisWeek = leadsResult?.count ?? 0;

    // Revenue MTD (sum rent_income + commission, status=completed)
    const [revenueResult] = await db
      .select({ total: sum(transactions.amount) })
      .from(transactions)
      .where(
        and(
          tf(transactions.tenantId),
          inArray(transactions.type, ["rent_income", "commission"]),
          eq(transactions.status, "completed"),
          gte(transactions.transactionDate, monthStart)
        )
      );

    const revenueMtd = Number(revenueResult?.total ?? 0);

    return {
      activeProperties,
      vacantUnits,
      chequesDueThisMonthCount,
      chequesDueThisMonthAmount,
      newLeadsThisWeek,
      revenueMtd,
    };
  }),

  chequeCalendar: tenantProcedure
    .input(z.object({ year: z.coerce.number(), month: z.coerce.number() }))
    .query(async ({ ctx, input }) => {
      const { year, month } = input;
      const monthStart = new Date(year, month - 1, 1);
      const monthEnd = endOfMonth(monthStart);

      const tenantFilter =
        ctx.role === "super_admin" && ctx.tenantId === null
          ? undefined
          : eq(cheques.tenantId, ctx.tenantId!);

      const rows = await db
        .select({
          id: cheques.id,
          dueDate: cheques.dueDate,
          amount: cheques.amount,
          status: cheques.status,
        })
        .from(cheques)
        .where(
          tenantFilter
            ? and(
                tenantFilter,
                eq(cheques.status, "pending"),
                gte(cheques.dueDate, monthStart),
                lte(cheques.dueDate, monthEnd)
              )
            : and(
                eq(cheques.status, "pending"),
                gte(cheques.dueDate, monthStart),
                lte(cheques.dueDate, monthEnd)
              )
        )
        .orderBy(cheques.dueDate);

      return rows;
    }),

  recentActivity: tenantProcedure.query(async ({ ctx }) => {
    const tenantFilter = (col: any) =>
      ctx.role === "super_admin" && ctx.tenantId === null
        ? undefined
        : eq(col, ctx.tenantId!);

    // Fetch recent leads
    const recentLeads = await db
      .select({
        id: leads.id,
        title: leads.name,
        subtitle: leads.source,
        date: leads.createdAt,
      })
      .from(leads)
      .where(tenantFilter(leads.tenantId))
      .orderBy(desc(leads.createdAt))
      .limit(8);

    // Fetch recent contracts
    const recentContracts = await db
      .select({
        id: contracts.id,
        contractId: contracts.id,
        subtitle: contracts.status,
        date: contracts.createdAt,
      })
      .from(contracts)
      .where(tenantFilter(contracts.tenantId))
      .orderBy(desc(contracts.createdAt))
      .limit(8);

    // Fetch recent cheque updates
    const recentCheques = await db
      .select({
        id: cheques.id,
        chequeNumber: cheques.chequeNumber,
        subtitle: cheques.status,
        date: cheques.updatedAt,
      })
      .from(cheques)
      .where(tenantFilter(cheques.tenantId))
      .orderBy(desc(cheques.updatedAt))
      .limit(8);

    // Merge and sort, limit to 12
    const allItems = [
      ...recentLeads.map((r) => ({
        type: "lead",
        title: r.title,
        subtitle: r.subtitle,
        date: r.date,
      })),
      ...recentContracts.map((r) => ({
        type: "contract",
        title: `Contract #${r.contractId?.toString().substring(0, 8) || "..."}`,
        subtitle: r.subtitle,
        date: r.date,
      })),
      ...recentCheques.map((r) => ({
        type: "cheque",
        title: `Cheque #${r.chequeNumber || "..."}`,
        subtitle: r.subtitle,
        date: r.date,
      })),
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 12);

    return allItems.map((item) => ({
      type: item.type,
      title: item.title,
      subtitle: item.subtitle,
      date: new Date(item.date),
    }));
  }),

  contractExpiry: tenantProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const inNinetyDays = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    const tenantFilter =
      ctx.role === "super_admin" && ctx.tenantId === null
        ? undefined
        : eq(contracts.tenantId, ctx.tenantId!);

    const rows = await db
      .select({
        id: contracts.id,
        propertyTitle: properties.title,
        endDate: contracts.endDate,
      })
      .from(contracts)
      .innerJoin(properties, eq(contracts.propertyId, properties.id))
      .where(
        tenantFilter
          ? and(
              tenantFilter,
              eq(contracts.status, "active"),
              gte(contracts.endDate, now),
              lte(contracts.endDate, inNinetyDays)
            )
          : and(
              eq(contracts.status, "active"),
              gte(contracts.endDate, now),
              lte(contracts.endDate, inNinetyDays)
            )
      )
      .orderBy(contracts.endDate)
      .limit(10);

    return rows.map((row) => ({
      id: row.id,
      propertyTitle: row.propertyTitle,
      endDate: row.endDate,
      daysLeft: Math.ceil(
        (new Date(row.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      ),
    }));
  }),

  charts: tenantProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const tenantFilter = (col: any) =>
      ctx.role === "super_admin" && ctx.tenantId === null
        ? undefined
        : eq(col, ctx.tenantId!);

    // Revenue trend: last 6 months
    const sixMonthsAgo = subMonths(now, 6);
    const revenueTrendData = [];

    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);

      const [result] = await db
        .select({ total: sum(transactions.amount) })
        .from(transactions)
        .where(
          tenantFilter(transactions.tenantId)
            ? and(
                tenantFilter(transactions.tenantId),
                inArray(transactions.type, ["rent_income", "commission"]),
                eq(transactions.status, "completed"),
                gte(transactions.transactionDate, monthStart),
                lte(transactions.transactionDate, monthEnd)
              )
            : and(
                inArray(transactions.type, ["rent_income", "commission"]),
                eq(transactions.status, "completed"),
                gte(transactions.transactionDate, monthStart),
                lte(transactions.transactionDate, monthEnd)
              )
        );

      revenueTrendData.push({
        month: format(monthDate, "MMM"),
        value: Number(result?.total ?? 0),
      });
    }

    // Occupancy: available vs rented vs other
    const [availableCount] = await db
      .select({ count: count() })
      .from(properties)
      .where(
        tenantFilter(properties.tenantId)
          ? and(tenantFilter(properties.tenantId), eq(properties.status, "available"))
          : eq(properties.status, "available")
      );

    const [rentedCount] = await db
      .select({ count: count() })
      .from(properties)
      .where(
        tenantFilter(properties.tenantId)
          ? and(tenantFilter(properties.tenantId), eq(properties.status, "rented"))
          : eq(properties.status, "rented")
      );

    const [otherCount] = await db
      .select({ count: count() })
      .from(properties)
      .where(
        tenantFilter(properties.tenantId)
          ? and(
              tenantFilter(properties.tenantId),
              ne(properties.status, "available"),
              ne(properties.status, "rented"),
              ne(properties.status, "off_market")
            )
          : and(
              ne(properties.status, "available"),
              ne(properties.status, "rented"),
              ne(properties.status, "off_market")
            )
      );

    const occupancy = {
      available: availableCount?.count ?? 0,
      rented: rentedCount?.count ?? 0,
      other: otherCount?.count ?? 0,
    };

    // Lead pipeline: group by status
    const leadRows = await db
      .select({
        status: leads.status,
        count: count(),
      })
      .from(leads)
      .where(tenantFilter(leads.tenantId))
      .groupBy(leads.status);

    const leadPipeline = leadRows.map((row) => ({
      status: row.status,
      count: row.count,
    }));

    return {
      revenueTrend: revenueTrendData,
      occupancy,
      leadPipeline,
    };
  }),
});
