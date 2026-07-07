import { z } from "zod";
import {
  eq,
  and,
  inArray,
  count,
  sum,
  lte,
  gte,
  desc,
  sql,
} from "drizzle-orm";
import { subMonths, startOfMonth, endOfMonth, format, differenceInCalendarDays } from "date-fns";
import { createTRPCRouter, tenantProcedure } from "@/server/trpc/trpc";
import { db } from "@/server/db";
import {
  properties,
  transactions,
  cheques,
  leads,
  commissions,
  contracts,
  propertyTenants,
} from "@/server/db/schema";

export const reportRouter = createTRPCRouter({
  portfolio: tenantProcedure.query(async ({ ctx }) => {
    // Per-table tenant filter
    const tf = (col: any) => // eslint-disable-line @typescript-eslint/no-explicit-any
      ctx.role === "super_admin" && ctx.tenantId === null
        ? undefined
        : eq(col, ctx.tenantId!);

    // Count properties by status
    const statusRows = await db
      .select({
        status: properties.status,
        count: count(),
      })
      .from(properties)
      .where(tf(properties.tenantId))
      .groupBy(properties.status);

    const statusBreakdown = statusRows.map((row) => ({
      status: row.status,
      count: row.count,
    }));

    // Total portfolio value (sum of prices)
    const [valueResult] = await db
      .select({ total: sum(properties.price) })
      .from(properties)
      .where(tf(properties.tenantId));

    const totalPortfolioValue = Number(valueResult?.total ?? 0);

    // Occupancy rate: rented / (rented + available)
    const [rentedResult] = await db
      .select({ count: count() })
      .from(properties)
      .where(
        and(
          tf(properties.tenantId),
          eq(properties.status, "rented")
        )
      );

    const [availableResult] = await db
      .select({ count: count() })
      .from(properties)
      .where(
        and(
          tf(properties.tenantId),
          eq(properties.status, "available")
        )
      );

    const rented = rentedResult?.count ?? 0;
    const available = availableResult?.count ?? 0;
    const occupancyRate =
      rented + available > 0 ? (rented / (rented + available)) * 100 : 0;

    return {
      statusBreakdown,
      totalPortfolioValue,
      occupancyRate,
    };
  }),

  chequeBreakdown: tenantProcedure.query(async ({ ctx }) => {
    // Per-table tenant filter
    const tf = (col: any) => // eslint-disable-line @typescript-eslint/no-explicit-any
      ctx.role === "super_admin" && ctx.tenantId === null
        ? undefined
        : eq(col, ctx.tenantId!);

    // Cheques by status
    const statusRows = await db
      .select({
        status: cheques.status,
        count: count(),
        total: sum(cheques.amount),
      })
      .from(cheques)
      .where(tf(cheques.tenantId))
      .groupBy(cheques.status);

    const breakdown = statusRows.map((row) => ({
      status: row.status,
      count: row.count,
      amount: Number(row.total ?? 0),
    }));

    // Overdue cheques (pending and dueDate < now)
    const now = new Date();
    const [overdueResult] = await db
      .select({
        count: count(),
        total: sum(cheques.amount),
      })
      .from(cheques)
      .where(
        and(
          tf(cheques.tenantId),
          eq(cheques.status, "pending"),
          lte(cheques.dueDate, now)
        )
      );

    const overdueCount = overdueResult?.count ?? 0;
    const overdueAmount = Number(overdueResult?.total ?? 0);

    return {
      breakdown,
      overdueCount,
      overdueAmount,
    };
  }),

  leadConversion: tenantProcedure.query(async ({ ctx }) => {
    // Per-table tenant filter
    const tf = (col: any) => // eslint-disable-line @typescript-eslint/no-explicit-any
      ctx.role === "super_admin" && ctx.tenantId === null
        ? undefined
        : eq(col, ctx.tenantId!);

    // Lead counts by status
    const statusRows = await db
      .select({
        status: leads.status,
        count: count(),
      })
      .from(leads)
      .where(tf(leads.tenantId))
      .groupBy(leads.status);

    const breakdown = statusRows.map((row) => ({
      status: row.status,
      count: row.count,
    }));

    // Total leads
    const [totalResult] = await db
      .select({ count: count() })
      .from(leads)
      .where(tf(leads.tenantId));

    const totalLeads = totalResult?.count ?? 0;

    // Won leads
    const [wonResult] = await db
      .select({ count: count() })
      .from(leads)
      .where(
        and(
          tf(leads.tenantId),
          eq(leads.status, "won")
        )
      );

    const wonCount = wonResult?.count ?? 0;
    const conversionRate = totalLeads > 0 ? (wonCount / totalLeads) * 100 : 0;

    return {
      breakdown,
      totalLeads,
      wonCount,
      conversionRate,
    };
  }),

  financial: tenantProcedure.query(async ({ ctx }) => {
    // Per-table tenant filter
    const tf = (col: any) => // eslint-disable-line @typescript-eslint/no-explicit-any
      ctx.role === "super_admin" && ctx.tenantId === null
        ? undefined
        : eq(col, ctx.tenantId!);

    // Last 6 months income vs expense
    const now = new Date();
    const data = [];

    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);

      // Income
      const [incomeResult] = await db
        .select({ total: sum(transactions.amount) })
        .from(transactions)
        .where(
          and(
            tf(transactions.tenantId),
            inArray(transactions.type, ["rent_income", "commission"]),
            eq(transactions.status, "completed"),
            gte(transactions.transactionDate, monthStart),
            lte(transactions.transactionDate, monthEnd)
          )
        );

      // Expense
      const [expenseResult] = await db
        .select({ total: sum(transactions.amount) })
        .from(transactions)
        .where(
          and(
            tf(transactions.tenantId),
            eq(transactions.type, "maintenance_cost"),
            eq(transactions.status, "completed"),
            gte(transactions.transactionDate, monthStart),
            lte(transactions.transactionDate, monthEnd)
          )
        );

      const income = Number(incomeResult?.total ?? 0);
      const expense = Number(expenseResult?.total ?? 0);

      data.push({
        month: format(monthDate, "MMM"),
        income,
        expense,
        net: income - expense,
      });
    }

    return data;
  }),

  rentRoll: tenantProcedure.query(async ({ ctx }) => {
    const tf = (col: any) => // eslint-disable-line @typescript-eslint/no-explicit-any
      ctx.role === "super_admin" && ctx.tenantId === null
        ? undefined
        : eq(col, ctx.tenantId!);

    const rows = await db
      .select({
        contractId: contracts.id,
        propertyTitle: properties.title,
        community: properties.community,
        tenantName: propertyTenants.name,
        rentAmount: contracts.rentAmount,
        startDate: contracts.startDate,
        endDate: contracts.endDate,
        status: contracts.status,
      })
      .from(contracts)
      .innerJoin(properties, eq(contracts.propertyId, properties.id))
      .innerJoin(propertyTenants, eq(contracts.propertyTenantId, propertyTenants.id))
      .where(
        and(
          tf(contracts.tenantId),
          eq(contracts.status, "active")
        )
      )
      .orderBy(properties.title);

    const [valueResult] = await db
      .select({ total: sum(contracts.rentAmount) })
      .from(contracts)
      .where(
        and(
          tf(contracts.tenantId),
          eq(contracts.status, "active")
        )
      );

    const totalAnnualRent = Number(valueResult?.total ?? 0) * 12;

    return {
      items: rows.map((row) => ({
        contractId: row.contractId,
        propertyTitle: row.propertyTitle,
        community: row.community,
        tenantName: row.tenantName,
        rentAmount: Number(row.rentAmount),
        startDate: row.startDate,
        endDate: row.endDate,
        status: row.status,
      })),
      totalAnnualRent,
    };
  }),

  vacancy: tenantProcedure.query(async ({ ctx }) => {
    const tf = (col: any) => // eslint-disable-line @typescript-eslint/no-explicit-any
      ctx.role === "super_admin" && ctx.tenantId === null
        ? undefined
        : eq(col, ctx.tenantId!);

    const now = new Date();
    const rows = await db
      .select({
        id: properties.id,
        title: properties.title,
        community: properties.community,
        emirate: properties.emirate,
        since: properties.updatedAt,
        price: properties.price,
      })
      .from(properties)
      .where(
        and(
          tf(properties.tenantId),
          eq(properties.status, "available")
        )
      )
      .orderBy(desc(properties.updatedAt));

    const items = rows.map((row) => {
      const daysVacant = differenceInCalendarDays(now, row.since);
      return {
        id: row.id,
        title: row.title,
        community: row.community,
        emirate: row.emirate,
        since: row.since,
        daysVacant,
      };
    });

    const count = items.length;
    const estimatedMonthlyLoss = rows.reduce((sum, row) => {
      const price = Number(row.price ?? 0);
      return sum + (price > 0 ? price / 12 : 0);
    }, 0);

    items.sort((a, b) => b.daysVacant - a.daysVacant);

    return {
      items,
      count,
      estimatedMonthlyLoss,
    };
  }),

  leaseExpiry: tenantProcedure.query(async ({ ctx }) => {
    const tf = (col: any) => // eslint-disable-line @typescript-eslint/no-explicit-any
      ctx.role === "super_admin" && ctx.tenantId === null
        ? undefined
        : eq(col, ctx.tenantId!);

    const now = new Date();
    const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    const rows = await db
      .select({
        contractId: contracts.id,
        propertyTitle: properties.title,
        tenantName: propertyTenants.name,
        endDate: contracts.endDate,
      })
      .from(contracts)
      .innerJoin(properties, eq(contracts.propertyId, properties.id))
      .innerJoin(propertyTenants, eq(contracts.propertyTenantId, propertyTenants.id))
      .where(
        and(
          tf(contracts.tenantId),
          eq(contracts.status, "active"),
          gte(contracts.endDate, now),
          lte(contracts.endDate, ninetyDaysFromNow)
        )
      )
      .orderBy(contracts.endDate);

    const items = rows.map((row) => {
      const daysLeft = differenceInCalendarDays(row.endDate, now);
      let bucket = "90+";
      if (daysLeft <= 30) bucket = "0-30";
      else if (daysLeft <= 60) bucket = "31-60";
      else if (daysLeft <= 90) bucket = "61-90";

      return {
        contractId: row.contractId,
        propertyTitle: row.propertyTitle,
        tenantName: row.tenantName,
        endDate: row.endDate,
        daysLeft,
        bucket,
      };
    });

    // Count by bucket
    const bucketCounts = {
      "0-30": items.filter((i) => i.bucket === "0-30").length,
      "31-60": items.filter((i) => i.bucket === "31-60").length,
      "61-90": items.filter((i) => i.bucket === "61-90").length,
      "90+": 0,
    };

    return {
      buckets: [
        { bucket: "0-30", count: bucketCounts["0-30"] },
        { bucket: "31-60", count: bucketCounts["31-60"] },
        { bucket: "61-90", count: bucketCounts["61-90"] },
        { bucket: "90+", count: bucketCounts["90+"] },
      ],
      items,
    };
  }),
});
