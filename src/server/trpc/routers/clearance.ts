import { TRPCError } from "@trpc/server"
import { z } from "zod"
import { eq, and, desc, count } from "drizzle-orm"
import { createTRPCRouter, tenantProcedure } from "@/server/trpc/trpc"
import { db } from "@/server/db"
import {
  tenantClearances,
  contracts,
  properties,
  propertyTenants,
} from "@/server/db/schema"
import {
  clearanceCreateSchema,
  clearanceUpdateSchema,
  clearanceListSchema,
} from "@/lib/validators/clearance"

export const clearanceRouter = createTRPCRouter({
  list: tenantProcedure
    .input(clearanceListSchema)
    .query(async ({ ctx, input }) => {
      const { page, pageSize, clearanceStatus } = input

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const conditions: any[] = []

      if (ctx.role !== "super_admin" || ctx.tenantId) {
        conditions.push(eq(tenantClearances.tenantId, ctx.tenantId!))
      }

      if (clearanceStatus) {
        conditions.push(
          eq(tenantClearances.clearanceStatus, clearanceStatus as any) // eslint-disable-line @typescript-eslint/no-explicit-any
        )
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined

      const totalResult = await db
        .select({ count: count() })
        .from(tenantClearances)
        .where(where)
      const total = totalResult[0]?.count ?? 0

      const rows = await db
        .select()
        .from(tenantClearances)
        .where(where)
        .orderBy(desc(tenantClearances.createdAt))
        .limit(pageSize)
        .offset((page - 1) * pageSize)

      const items = await Promise.all(
        rows.map(async (row) => {
          let propertyTitle: string | null = null
          if (row.propertyId) {
            const prop = await db.query.properties.findFirst({
              where: eq(properties.id, row.propertyId),
              columns: { id: true, title: true },
            })
            propertyTitle = prop?.title ?? null
          }

          let tenantName: string | null = null
          if (row.propertyTenantId) {
            const pt = await db.query.propertyTenants.findFirst({
              where: eq(propertyTenants.id, row.propertyTenantId),
              columns: { id: true, name: true },
            })
            tenantName = pt?.name ?? null
          }

          return { ...row, propertyTitle, tenantName }
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
      const clearance = await db.query.tenantClearances.findFirst({
        where: and(
          eq(tenantClearances.id, input.id),
          ctx.role === "super_admin" && ctx.tenantId === null
            ? undefined
            : eq(tenantClearances.tenantId, ctx.tenantId!)
        ),
      })

      if (!clearance) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Clearance not found" })
      }

      let propertyTitle: string | null = null
      if (clearance.propertyId) {
        const prop = await db.query.properties.findFirst({
          where: eq(properties.id, clearance.propertyId),
          columns: { id: true, title: true },
        })
        propertyTitle = prop?.title ?? null
      }

      let tenantName: string | null = null
      if (clearance.propertyTenantId) {
        const pt = await db.query.propertyTenants.findFirst({
          where: eq(propertyTenants.id, clearance.propertyTenantId),
          columns: { id: true, name: true },
        })
        tenantName = pt?.name ?? null
      }

      return { ...clearance, propertyTitle, tenantName }
    }),

  create: tenantProcedure
    .input(clearanceCreateSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No tenant selected" })
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const insertData: any = {
        tenantId: ctx.tenantId,
        contractId: input.contractId,
        propertyId: input.propertyId ?? null,
        propertyTenantId: input.propertyTenantId ?? null,
        noticeDate: input.noticeDate ?? null,
        noticePeriodDays: input.noticePeriodDays ?? null,
        plannedMoveOut: input.plannedMoveOut ?? null,
        depositAmount: input.depositAmount != null ? String(input.depositAmount) : null,
        clearanceStatus: "in_progress",
      }

      const [inserted] = await db
        .insert(tenantClearances)
        .values(insertData)
        .returning({ id: tenantClearances.id })

      return { id: inserted.id }
    }),

  update: tenantProcedure
    .input(clearanceUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input

      const outstandingRent = Number(data.outstandingRent ?? 0)
      const outstandingUtility = Number(data.outstandingUtility ?? 0)
      const outstandingMaintenance = Number(data.outstandingMaintenance ?? 0)
      const penaltyAmount = Number(data.penaltyAmount ?? 0)
      const totalOutstanding =
        outstandingRent + outstandingUtility + outstandingMaintenance + penaltyAmount

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: any = {
        updatedAt: new Date(),
        totalOutstanding: String(totalOutstanding),
      }

      if (data.noticeDate !== undefined) updateData.noticeDate = data.noticeDate
      if (data.noticePeriodDays !== undefined) updateData.noticePeriodDays = data.noticePeriodDays
      if (data.plannedMoveOut !== undefined) updateData.plannedMoveOut = data.plannedMoveOut
      if (data.actualMoveOut !== undefined) updateData.actualMoveOut = data.actualMoveOut
      if (data.depositAmount !== undefined)
        updateData.depositAmount = data.depositAmount != null ? String(data.depositAmount) : null
      if (data.damageDeductions !== undefined)
        updateData.damageDeductions = data.damageDeductions != null ? String(data.damageDeductions) : null
      if (data.outstandingRent !== undefined)
        updateData.outstandingRent = String(outstandingRent)
      if (data.outstandingUtility !== undefined)
        updateData.outstandingUtility = String(outstandingUtility)
      if (data.outstandingMaintenance !== undefined)
        updateData.outstandingMaintenance = String(outstandingMaintenance)
      if (data.penaltyAmount !== undefined)
        updateData.penaltyAmount = String(penaltyAmount)
      if (data.settlementStatus !== undefined)
        updateData.settlementStatus = data.settlementStatus
      if (data.depositDeductions !== undefined)
        updateData.depositDeductions = data.depositDeductions != null ? String(data.depositDeductions) : null
      if (data.depositRefundAmount !== undefined)
        updateData.depositRefundAmount = data.depositRefundAmount != null ? String(data.depositRefundAmount) : null
      if (data.depositRefundMethod !== undefined)
        updateData.depositRefundMethod = data.depositRefundMethod
      if (data.depositRefundDate !== undefined)
        updateData.depositRefundDate = data.depositRefundDate
      if (data.depositRefundRef !== undefined)
        updateData.depositRefundRef = data.depositRefundRef
      if (data.chequesReturned !== undefined)
        updateData.chequesReturned = data.chequesReturned
      if (data.dewaCleared !== undefined)
        updateData.dewaCleared = data.dewaCleared
      if (data.ejariCancelled !== undefined)
        updateData.ejariCancelled = data.ejariCancelled
      if (data.keysReturned !== undefined)
        updateData.keysReturned = data.keysReturned
      if (data.clearanceStatus !== undefined)
        updateData.clearanceStatus = data.clearanceStatus

      await db
        .update(tenantClearances)
        .set(updateData)
        .where(
          and(
            eq(tenantClearances.id, id),
            ctx.role === "super_admin" && ctx.tenantId === null
              ? undefined
              : eq(tenantClearances.tenantId, ctx.tenantId!)
          )
        )

      return { id }
    }),

  complete: tenantProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        clearanceCertUrl: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, clearanceCertUrl } = input

      // Fetch the clearance to get propertyId
      const clearance = await db.query.tenantClearances.findFirst({
        where: and(
          eq(tenantClearances.id, id),
          ctx.role === "super_admin" && ctx.tenantId === null
            ? undefined
            : eq(tenantClearances.tenantId, ctx.tenantId!)
        ),
        columns: { id: true, propertyId: true },
      })

      if (!clearance) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Clearance not found" })
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: any = {
        clearanceStatus: "completed",
        clearedBy: ctx.userId,
        clearedAt: new Date(),
        updatedAt: new Date(),
      }

      if (clearanceCertUrl !== undefined) {
        updateData.clearanceCertUrl = clearanceCertUrl
      }

      await db
        .update(tenantClearances)
        .set(updateData)
        .where(eq(tenantClearances.id, id))

      // Free the property — set status to 'available'
      if (clearance.propertyId) {
        await db
          .update(properties)
          .set({ status: "available", updatedAt: new Date() })
          .where(
            and(
              eq(properties.id, clearance.propertyId),
              ctx.role === "super_admin" && ctx.tenantId === null
                ? undefined
                : eq(properties.tenantId, ctx.tenantId!)
            )
          )
      }

      return { id }
    }),

  delete: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .delete(tenantClearances)
        .where(
          and(
            eq(tenantClearances.id, input.id),
            ctx.role === "super_admin" && ctx.tenantId === null
              ? undefined
              : eq(tenantClearances.tenantId, ctx.tenantId!)
          )
        )

      return { ok: true }
    }),

  selectableContracts: tenantProcedure.query(async ({ ctx }) => {
    const rows = await db.query.contracts.findMany({
      where:
        ctx.role === "super_admin" && ctx.tenantId === null
          ? undefined
          : eq(contracts.tenantId, ctx.tenantId!),
      orderBy: desc(contracts.createdAt),
      columns: { id: true, ejariNumber: true, startDate: true, endDate: true },
    })
    return rows.map((r) => ({
      id: r.id,
      label: r.ejariNumber
        ? `Ejari: ${r.ejariNumber}`
        : `Contract ${r.id.slice(0, 8)}`,
    }))
  }),
})
