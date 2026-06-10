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
import { subMonths, startOfMonth, endOfMonth, format } from "date-fns";
import { createTRPCRouter, tenantProcedure } from "@/server/trpc/trpc";
import { db } from "@/server/db";
import {
  properties,
  transactions,
  cheques,
  leads,
  commissions,
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
});
