import { TRPCError } from "@trpc/server"
import { z } from "zod"
import {
  eq,
  and,
  gte,
  lte,
  desc,
  asc,
  count,
  sql,
} from "drizzle-orm"
import { createTRPCRouter, tenantProcedure } from "@/server/trpc/trpc"
import { db } from "@/server/db"
import {
  cheques,
  contracts,
  properties,
  propertyTenants,
  transactions,
} from "@/server/db/schema"
import {
  chequeListSchema,
  chequeCalendarSchema,
  chequeUpdateStatusSchema,
  manualChequeSchema,
  chequePostponeSchema,
  chequeDetailsSchema,
} from "@/lib/validators/cheque"
import {
  startOfMonth,
  endOfMonth,
  startOfDay,
  endOfDay,
} from "date-fns"

export const chequeRouter = createTRPCRouter({
  list: tenantProcedure
    .input(chequeListSchema)
    .query(async ({ ctx, input }) => {
      const { page, pageSize, status, propertyId, propertyTenantId, from, to, sortBy, sortDir, direction, dueOn } = input

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const conditions: any[] = []

      if (ctx.role !== "super_admin" || ctx.tenantId) {
        conditions.push(eq(cheques.tenantId, ctx.tenantId!))
      }

      if (status) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        conditions.push(eq(cheques.status, status as any))
      }
      if (direction) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        conditions.push(eq(cheques.direction, direction as any))
      }
      if (propertyId) {
        conditions.push(eq(cheques.propertyId, propertyId))
      }
      if (propertyTenantId) {
        conditions.push(eq(cheques.propertyTenantId, propertyTenantId))
      }
      if (dueOn) {
        conditions.push(gte(cheques.dueDate, startOfDay(dueOn)))
        conditions.push(lte(cheques.dueDate, endOfDay(dueOn)))
      } else {
        if (from) {
          conditions.push(gte(cheques.dueDate, from))
        }
        if (to) {
          conditions.push(lte(cheques.dueDate, to))
        }
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined

      const totalResult = await db
        .select({ count: count() })
        .from(cheques)
        .where(where)
      const total = totalResult[0]?.count ?? 0

      const orderByColumn = sortBy === "amount" ? cheques.amount : cheques.dueDate
      const orderByDir = sortDir === "desc" ? desc : asc

      const rows = await db
        .select()
        .from(cheques)
        .where(where)
        .orderBy(orderByDir(orderByColumn))
        .limit(pageSize)
        .offset((page - 1) * pageSize)

      const items = await Promise.all(
        rows.map(async (row) => {
          const property = row.propertyId
            ? await db.query.properties.findFirst({
                where: eq(properties.id, row.propertyId),
                columns: { id: true, title: true, referenceNo: true },
              })
            : null
          const tenant = row.propertyTenantId
            ? await db.query.propertyTenants.findFirst({
                where: eq(propertyTenants.id, row.propertyTenantId),
                columns: { id: true, name: true, phone: true },
              })
            : null
          return {
            ...row,
            propertyTitle: property?.title ?? null,
            tenantName: tenant?.name ?? null,
            tenantPhone: tenant?.phone ?? null,
          }
        })
      )

      return {
        items,
        total,
        page,
        pageSize,
        pageCount: Math.ceil(total / pageSize),
      }
    }),

  getById: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const cheque = await db.query.cheques.findFirst({
        where: and(
          eq(cheques.id, input.id),
          ctx.role === "super_admin" && ctx.tenantId === null
            ? undefined
            : eq(cheques.tenantId, ctx.tenantId!)
        ),
      })

      if (!cheque) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Cheque not found" })
      }

      const property = cheque.propertyId
        ? await db.query.properties.findFirst({
            where: eq(properties.id, cheque.propertyId),
            columns: { id: true, title: true, referenceNo: true },
          })
        : null

      const tenant = cheque.propertyTenantId
        ? await db.query.propertyTenants.findFirst({
            where: eq(propertyTenants.id, cheque.propertyTenantId),
            columns: { id: true, name: true, phone: true },
          })
        : null

      const contract = cheque.contractId
        ? await db.query.contracts.findFirst({
            where: eq(contracts.id, cheque.contractId),
            columns: { id: true, status: true, startDate: true, endDate: true, rentAmount: true },
          })
        : null

      // Check if a transaction was auto-created for this cheque
      const linkedTransaction = await db.query.transactions.findFirst({
        where: and(
          eq(transactions.referenceType, "cheque"),
          eq(transactions.referenceId, cheque.id),
          ctx.role === "super_admin" && ctx.tenantId === null
            ? undefined
            : eq(transactions.tenantId, ctx.tenantId!)
        ),
        columns: { id: true },
      })

      return {
        ...cheque,
        property: property ?? null,
        tenant: tenant ?? null,
        contract: contract ?? null,
        linkedTransactionId: linkedTransaction?.id ?? null,
      }
    }),

  calendar: tenantProcedure
    .input(chequeCalendarSchema)
    .query(async ({ ctx, input }) => {
      const { year, month } = input
      // month is 1-based
      const monthStart = startOfMonth(new Date(year, month - 1, 1))
      const monthEnd = endOfMonth(monthStart)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const conditions: any[] = [
        gte(cheques.dueDate, monthStart),
        lte(cheques.dueDate, monthEnd),
      ]

      if (ctx.role !== "super_admin" || ctx.tenantId) {
        conditions.push(eq(cheques.tenantId, ctx.tenantId!))
      }

      const rows = await db
        .select()
        .from(cheques)
        .where(and(...conditions))
        .orderBy(asc(cheques.dueDate))

      const items = await Promise.all(
        rows.map(async (row) => {
          const property = row.propertyId
            ? await db.query.properties.findFirst({
                where: eq(properties.id, row.propertyId),
                columns: { id: true, title: true },
              })
            : null
          const tenant = row.propertyTenantId
            ? await db.query.propertyTenants.findFirst({
                where: eq(propertyTenants.id, row.propertyTenantId),
                columns: { id: true, name: true },
              })
            : null
          return {
            id: row.id,
            dueDate: row.dueDate,
            amount: row.amount,
            status: row.status,
            chequeNumber: row.chequeNumber,
            propertyTitle: property?.title ?? null,
            tenantName: tenant?.name ?? null,
          }
        })
      )

      // Monthly totals by status
      const statusTotals: Record<string, { count: number; amount: number }> = {}
      for (const item of items) {
        if (!statusTotals[item.status]) {
          statusTotals[item.status] = { count: 0, amount: 0 }
        }
        statusTotals[item.status].count += 1
        statusTotals[item.status].amount += Number(item.amount)
      }

      return { cheques: items, statusTotals }
    }),

  updateStatus: tenantProcedure
    .input(chequeUpdateStatusSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, status, depositedDate, clearedDate, bounceReason, chequeImageUrl } = input

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: any = {
        status,
        updatedAt: new Date(),
      }

      if (status === "deposited" && depositedDate) {
        updateData.depositedDate = depositedDate
      } else if (status === "deposited") {
        updateData.depositedDate = new Date()
      }

      if (status === "cleared" && clearedDate) {
        updateData.clearedDate = clearedDate
      } else if (status === "cleared") {
        updateData.clearedDate = new Date()
      }

      if (bounceReason) updateData.bounceReason = bounceReason
      if (chequeImageUrl) updateData.chequeImageUrl = chequeImageUrl

      await db
        .update(cheques)
        .set(updateData)
        .where(
          and(
            eq(cheques.id, id),
            ctx.role === "super_admin" && ctx.tenantId === null
              ? undefined
              : eq(cheques.tenantId, ctx.tenantId!)
          )
        )

      // Auto-create transaction when cleared
      if (status === "cleared") {
        try {
          // Re-fetch the cheque to get amount/direction
          const cheque = await db.query.cheques.findFirst({
            where: and(
              eq(cheques.id, id),
              ctx.role === "super_admin" && ctx.tenantId === null
                ? undefined
                : eq(cheques.tenantId, ctx.tenantId!)
            ),
          })

          if (cheque && ctx.tenantId) {
            // Check if a transaction already exists for this cheque
            const existing = await db.query.transactions.findFirst({
              where: and(
                eq(transactions.referenceType, "cheque"),
                eq(transactions.referenceId, id),
                eq(transactions.tenantId, ctx.tenantId)
              ),
              columns: { id: true },
            })

            if (!existing) {
              await db.insert(transactions).values({
                tenantId: ctx.tenantId,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                type: (cheque.direction === "payable" ? "other" : "rent_income") as any,
                amount: String(cheque.amount),
                currency: "AED",
                referenceType: "cheque",
                referenceId: cheque.id,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                paymentMethod: "cheque" as any,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                status: "completed" as any,
                transactionDate: clearedDate ?? new Date(),
                notes: `Auto-created from cleared cheque ${cheque.chequeNumber ?? cheque.id}`,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              } as any)
            }
          }
        } catch (err) {
          console.error("Failed to auto-create transaction for cleared cheque:", err)
        }
      }

      return { ok: true }
    }),

  postpone: tenantProcedure
    .input(chequePostponeSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, newDueDate, note } = input

      const cheque = await db.query.cheques.findFirst({
        where: and(
          eq(cheques.id, id),
          ctx.role === "super_admin" && ctx.tenantId === null
            ? undefined
            : eq(cheques.tenantId, ctx.tenantId!)
        ),
      })

      if (!cheque) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Cheque not found" })
      }

      // Preserve the first original due date (don't overwrite if already postponed)
      const originalDueDate = cheque.originalDueDate ?? cheque.dueDate

      // Append note to existing notes
      const existingNotes = cheque.notes ?? ""
      const noteTimestamp = new Date().toISOString().split("T")[0]
      const appendedNote = note
        ? `${existingNotes}${existingNotes ? "\n" : ""}[${noteTimestamp}] Postponed: ${note}`
        : existingNotes

      await db
        .update(cheques)
        .set({
          dueDate: newDueDate,
          originalDueDate,
          postponed: true,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          status: "postponed" as any,
          notes: appendedNote || null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(cheques.id, id),
            ctx.role === "super_admin" && ctx.tenantId === null
              ? undefined
              : eq(cheques.tenantId, ctx.tenantId!)
          )
        )

      return { id }
    }),

  updateDetails: tenantProcedure
    .input(chequeDetailsSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, direction, bankAccountId, custodyHolder, custodyDate, penaltyAmount, receiptNumber } = input

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: any = { updatedAt: new Date() }

      if (direction !== undefined) updateData.direction = direction
      if (bankAccountId !== undefined) updateData.bankAccountId = bankAccountId ?? null
      if (custodyHolder !== undefined) updateData.custodyHolder = custodyHolder ?? null
      if (custodyDate !== undefined) updateData.custodyDate = custodyDate ?? null
      if (penaltyAmount !== undefined) updateData.penaltyAmount = penaltyAmount != null ? String(penaltyAmount) : null
      if (receiptNumber !== undefined) updateData.receiptNumber = receiptNumber ?? null

      await db
        .update(cheques)
        .set(updateData)
        .where(
          and(
            eq(cheques.id, id),
            ctx.role === "super_admin" && ctx.tenantId === null
              ? undefined
              : eq(cheques.tenantId, ctx.tenantId!)
          )
        )

      return { ok: true }
    }),

  todaysCheques: tenantProcedure.query(async ({ ctx }) => {
    const now = new Date()
    const dayStart = startOfDay(now)
    const dayEnd = endOfDay(now)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const conditions: any[] = [
      gte(cheques.dueDate, dayStart),
      lte(cheques.dueDate, dayEnd),
    ]

    if (ctx.role !== "super_admin" || ctx.tenantId) {
      conditions.push(eq(cheques.tenantId, ctx.tenantId!))
    }

    const rows = await db
      .select()
      .from(cheques)
      .where(and(...conditions))
      .orderBy(asc(cheques.dueDate))

    const items = await Promise.all(
      rows.map(async (row) => {
        const property = row.propertyId
          ? await db.query.properties.findFirst({
              where: eq(properties.id, row.propertyId),
              columns: { id: true, title: true },
            })
          : null
        const tenant = row.propertyTenantId
          ? await db.query.propertyTenants.findFirst({
              where: eq(propertyTenants.id, row.propertyTenantId),
              columns: { id: true, name: true },
            })
          : null
        return {
          ...row,
          propertyTitle: property?.title ?? null,
          tenantName: tenant?.name ?? null,
        }
      })
    )

    return items
  }),

  addManual: tenantProcedure
    .input(manualChequeSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No tenant selected" })
      }

      const [inserted] = await db
        .insert(cheques)
        .values({
          tenantId: ctx.tenantId,
          contractId: input.contractId ?? null,
          propertyId: input.propertyId ?? null,
          propertyTenantId: input.propertyTenantId ?? null,
          ownerId: input.ownerId ?? null,
          chequeNumber: input.chequeNumber ?? null,
          bankName: input.bankName ?? null,
          amount: String(input.amount),
          dueDate: input.dueDate,
          status: "pending",
        })
        .returning({ id: cheques.id })

      return { id: inserted.id }
    }),

  sendReminder: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const cheque = await db.query.cheques.findFirst({
        where: and(
          eq(cheques.id, input.id),
          ctx.role === "super_admin" && ctx.tenantId === null
            ? undefined
            : eq(cheques.tenantId, ctx.tenantId!)
        ),
      })

      if (!cheque) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Cheque not found" })
      }

      let phone: string | null = null
      let tenantName = "Tenant"
      if (cheque.propertyTenantId) {
        const tenant = await db.query.propertyTenants.findFirst({
          where: eq(propertyTenants.id, cheque.propertyTenantId),
          columns: { id: true, name: true, phone: true },
        })
        phone = tenant?.phone ?? null
        tenantName = tenant?.name ?? "Tenant"
      }

      const dueStr = cheque.dueDate
        ? new Date(cheque.dueDate).toLocaleDateString("en-AE", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "N/A"
      const amountStr = new Intl.NumberFormat("en-AE", {
        style: "currency",
        currency: "AED",
        maximumFractionDigits: 0,
      }).format(Number(cheque.amount))

      const message = `Dear ${tenantName}, this is a reminder that your cheque of ${amountStr} (Cheque #${cheque.chequeNumber ?? "N/A"}) is due on ${dueStr}. Please ensure it is ready for deposit. Thank you.`

      return { ok: true, phone, message }
    }),

  stats: tenantProcedure.query(async ({ ctx }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tenantCondition: any =
      ctx.role !== "super_admin" || ctx.tenantId
        ? eq(cheques.tenantId, ctx.tenantId!)
        : undefined

    const now = new Date()

    // Grouped counts and sums by status
    const grouped = await db
      .select({
        status: cheques.status,
        cnt: count(),
        total: sql<string>`COALESCE(SUM(CAST(${cheques.amount} AS NUMERIC)), 0)`,
      })
      .from(cheques)
      .where(tenantCondition)
      .groupBy(cheques.status)

    const statsMap: Record<string, { count: number; amount: number }> = {}
    for (const row of grouped) {
      statsMap[row.status] = { count: Number(row.cnt), amount: Number(row.total) }
    }

    // Overdue: pending AND dueDate < now
    const overdueResult = await db
      .select({
        cnt: count(),
        total: sql<string>`COALESCE(SUM(CAST(${cheques.amount} AS NUMERIC)), 0)`,
      })
      .from(cheques)
      .where(
        tenantCondition
          ? and(
              tenantCondition,
              eq(cheques.status, "pending"),
              lte(cheques.dueDate, now)
            )
          : and(eq(cheques.status, "pending"), lte(cheques.dueDate, now))
      )

    return {
      pending: statsMap["pending"]?.count ?? 0,
      pendingAmount: statsMap["pending"]?.amount ?? 0,
      deposited: statsMap["deposited"]?.count ?? 0,
      cleared: statsMap["cleared"]?.count ?? 0,
      bounced: statsMap["bounced"]?.count ?? 0,
      overdueCount: Number(overdueResult[0]?.cnt ?? 0),
      overdueAmount: Number(overdueResult[0]?.total ?? 0),
    }
  }),
})
