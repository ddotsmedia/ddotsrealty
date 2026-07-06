import { TRPCError } from "@trpc/server"
import { z } from "zod"
import { eq, and, desc, asc, count } from "drizzle-orm"
import { createTRPCRouter, tenantProcedure } from "@/server/trpc/trpc"
import { db } from "@/server/db"
import {
  nocRequests,
  propertyTenants,
  contracts,
} from "@/server/db/schema"
import { nocCreateSchema, nocReviewSchema, nocListSchema } from "@/lib/validators/noc"

export const nocRouter = createTRPCRouter({
  list: tenantProcedure
    .input(nocListSchema)
    .query(async ({ ctx, input }) => {
      const { page, pageSize, status, nocType } = input

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const conditions: any[] = []

      if (ctx.role !== "super_admin" || ctx.tenantId) {
        conditions.push(eq(nocRequests.tenantId, ctx.tenantId!))
      }

      if (status) {
        conditions.push(eq(nocRequests.status, status as any)) // eslint-disable-line @typescript-eslint/no-explicit-any
      }

      if (nocType) {
        conditions.push(eq(nocRequests.nocType, nocType as any)) // eslint-disable-line @typescript-eslint/no-explicit-any
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined

      const totalResult = await db
        .select({ count: count() })
        .from(nocRequests)
        .where(where)
      const total = totalResult[0]?.count ?? 0

      const rows = await db
        .select()
        .from(nocRequests)
        .where(where)
        .orderBy(desc(nocRequests.createdAt))
        .limit(pageSize)
        .offset((page - 1) * pageSize)

      const items = await Promise.all(
        rows.map(async (row) => {
          let tenantName: string | null = null
          if (row.propertyTenantId) {
            const pt = await db.query.propertyTenants.findFirst({
              where: eq(propertyTenants.id, row.propertyTenantId),
              columns: { id: true, name: true },
            })
            tenantName = pt?.name ?? null
          }
          return { ...row, tenantName }
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
      const noc = await db.query.nocRequests.findFirst({
        where: and(
          eq(nocRequests.id, input.id),
          ctx.role === "super_admin" && ctx.tenantId === null
            ? undefined
            : eq(nocRequests.tenantId, ctx.tenantId!)
        ),
      })

      if (!noc) {
        throw new TRPCError({ code: "NOT_FOUND", message: "NOC request not found" })
      }

      let tenantName: string | null = null
      if (noc.propertyTenantId) {
        const pt = await db.query.propertyTenants.findFirst({
          where: eq(propertyTenants.id, noc.propertyTenantId),
          columns: { id: true, name: true },
        })
        tenantName = pt?.name ?? null
      }

      let contractInfo: { id: string; ejariNumber: string | null; startDate: Date; endDate: Date } | null = null
      if (noc.contractId) {
        const c = await db.query.contracts.findFirst({
          where: eq(contracts.id, noc.contractId),
          columns: { id: true, ejariNumber: true, startDate: true, endDate: true },
        })
        contractInfo = c ?? null
      }

      return { ...noc, tenantName, contractInfo }
    }),

  create: tenantProcedure
    .input(nocCreateSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No tenant selected" })
      }

      const [inserted] = await db
        .insert(nocRequests)
        .values({
          ...input,
          tenantId: ctx.tenantId,
          status: "requested",
        } as any) // eslint-disable-line @typescript-eslint/no-explicit-any
        .returning({ id: nocRequests.id })

      return { id: inserted.id }
    }),

  review: tenantProcedure
    .input(nocReviewSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, status, rejectionReason, validUntil, nocDocumentUrl } = input

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: any = {
        status,
        reviewedBy: ctx.userId,
        reviewedAt: new Date(),
      }

      if (rejectionReason !== undefined) updateData.rejectionReason = rejectionReason
      if (validUntil !== undefined) updateData.validUntil = validUntil
      if (nocDocumentUrl !== undefined) updateData.nocDocumentUrl = nocDocumentUrl

      await db
        .update(nocRequests)
        .set(updateData)
        .where(
          and(
            eq(nocRequests.id, id),
            ctx.role === "super_admin" && ctx.tenantId === null
              ? undefined
              : eq(nocRequests.tenantId, ctx.tenantId!)
          )
        )

      return { id }
    }),

  delete: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .delete(nocRequests)
        .where(
          and(
            eq(nocRequests.id, input.id),
            ctx.role === "super_admin" && ctx.tenantId === null
              ? undefined
              : eq(nocRequests.tenantId, ctx.tenantId!)
          )
        )

      return { ok: true }
    }),

  selectableTenants: tenantProcedure.query(async ({ ctx }) => {
    const rows = await db.query.propertyTenants.findMany({
      where:
        ctx.role === "super_admin" && ctx.tenantId === null
          ? undefined
          : eq(propertyTenants.tenantId, ctx.tenantId!),
      orderBy: asc(propertyTenants.name),
      columns: { id: true, name: true },
    })
    return rows.map((r) => ({ id: r.id, label: r.name }))
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
