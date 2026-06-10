import { z } from "zod";
import {
  eq,
  and,
  or,
  ilike,
  gte,
  lte,
  inArray,
  count,
  sum,
  desc,
  asc,
  sql,
} from "drizzle-orm";
import { subMonths, startOfMonth, endOfMonth, format } from "date-fns";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, tenantProcedure } from "@/server/trpc/trpc";
import { db } from "@/server/db";
import { transactions } from "@/server/db/schema";
import {
  transactionCreateSchema,
  transactionListSchema,
} from "@/lib/validators/accounting";

export const transactionRouter = createTRPCRouter({
  list: tenantProcedure
    .input(transactionListSchema)
    .query(async ({ ctx, input }) => {
      const {
        page,
        pageSize,
        search,
        type,
        status,
        from,
        to,
        sortBy,
        sortDir,
      } = input;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const conditions: any[] = [];

      // Tenant scope: per-table filter
      if (ctx.role !== "super_admin" || ctx.tenantId) {
        conditions.push(eq(transactions.tenantId, ctx.tenantId!));
      }

      // Search filters
      if (search) {
        conditions.push(
          or(
            ilike(transactions.fromEntity, `%${search}%`),
            ilike(transactions.toEntity, `%${search}%`)
          )
        );
      }

      // Enum filters
      if (type) conditions.push(eq(transactions.type, type as any)); // eslint-disable-line @typescript-eslint/no-explicit-any
      if (status) conditions.push(eq(transactions.status, status as any)); // eslint-disable-line @typescript-eslint/no-explicit-any

      // Date range filters
      if (from) conditions.push(gte(transactions.transactionDate, from));
      if (to) {
        const toEnd = new Date(to);
        toEnd.setHours(23, 59, 59, 999);
        conditions.push(lte(transactions.transactionDate, toEnd));
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      // Get total count
      const totalResult = await db
        .select({ count: count() })
        .from(transactions)
        .where(where);
      const total = totalResult[0]?.count ?? 0;

      // Get rows with sorting and pagination
      const orderByColumn =
        sortBy === "amount" ? transactions.amount : transactions.transactionDate;
      const orderByDir = sortDir === "asc" ? asc : desc;

      const rows = await db
        .select()
        .from(transactions)
        .where(where)
        .orderBy(orderByDir(orderByColumn))
        .limit(pageSize)
        .offset((page - 1) * pageSize);

      return {
        items: rows,
        total,
        page,
        pageSize,
        pageCount: Math.ceil(total / pageSize),
      };
    }),

  create: tenantProcedure
    .input(transactionCreateSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No tenant selected",
        });
      }

      const transactionDate = input.transactionDate || new Date();

      const [inserted] = await db
        .insert(transactions)
        .values({
          tenantId: ctx.tenantId,
          type: input.type as any, // eslint-disable-line @typescript-eslint/no-explicit-any
          amount: input.amount.toString(),
          vatAmount: input.vatAmount ? input.vatAmount.toString() : null,
          currency: input.currency,
          referenceType: input.referenceType,
          referenceId: input.referenceId,
          fromEntity: input.fromEntity,
          toEntity: input.toEntity,
          paymentMethod: input.paymentMethod as any, // eslint-disable-line @typescript-eslint/no-explicit-any
          status: input.status as any, // eslint-disable-line @typescript-eslint/no-explicit-any
          notes: input.notes,
          transactionDate,
        } as any) // eslint-disable-line @typescript-eslint/no-explicit-any
        .returning({ id: transactions.id });

      return { id: inserted.id };
    }),

  summary: tenantProcedure.query(async ({ ctx }) => {
    // Per-table tenant filter
    const tf = (col: any) => // eslint-disable-line @typescript-eslint/no-explicit-any
      ctx.role === "super_admin" && ctx.tenantId === null
        ? undefined
        : eq(col, ctx.tenantId!);

    // Total income (rent_income + commission, completed)
    const [incomeResult] = await db
      .select({ total: sum(transactions.amount) })
      .from(transactions)
      .where(
        and(
          tf(transactions.tenantId),
          inArray(transactions.type, ["rent_income", "commission"]),
          eq(transactions.status, "completed")
        )
      );

    const totalIncome = Number(incomeResult?.total ?? 0);

    // Total expense (maintenance_cost, completed)
    const [expenseResult] = await db
      .select({ total: sum(transactions.amount) })
      .from(transactions)
      .where(
        and(
          tf(transactions.tenantId),
          eq(transactions.type, "maintenance_cost"),
          eq(transactions.status, "completed")
        )
      );

    const totalExpense = Number(expenseResult?.total ?? 0);

    // VAT collected
    const [vatResult] = await db
      .select({ total: sum(transactions.vatAmount) })
      .from(transactions)
      .where(tf(transactions.tenantId));

    const vatCollected = Number(vatResult?.total ?? 0);

    // Count totals by type
    const byTypeRows = await db
      .select({
        type: transactions.type,
        count: count(),
        total: sum(transactions.amount),
      })
      .from(transactions)
      .where(
        and(
          tf(transactions.tenantId),
          eq(transactions.status, "completed")
        )
      )
      .groupBy(transactions.type);

    const byType = byTypeRows.map((row) => ({
      type: row.type,
      count: row.count,
      amount: Number(row.total ?? 0),
    }));

    // Last 6 months income series
    const now = new Date();
    const incomeMonths = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);

      const [result] = await db
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

      incomeMonths.push({
        month: format(monthDate, "MMM"),
        value: Number(result?.total ?? 0),
      });
    }

    return {
      totalIncome,
      totalExpense,
      net: totalIncome - totalExpense,
      vatCollected,
      byType,
      incomeSeries: incomeMonths,
    };
  }),
});
