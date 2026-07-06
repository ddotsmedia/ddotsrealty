import { TRPCError } from "@trpc/server"
import { z } from "zod"
import {
  eq,
  and,
  count,
  desc,
  asc,
} from "drizzle-orm"
import { createTRPCRouter, tenantProcedure } from "@/server/trpc/trpc"
import { db } from "@/server/db"
import {
  utilityAccounts,
  properties,
  propertyTenants,
} from "@/server/db/schema"
import {
  utilityCreateSchema,
  utilityUpdateSchema,
  utilityListSchema,
  utilityStatusSchema,
} from "@/lib/validators/utility"

export const utilityRouter = createTRPCRouter({
  list: tenantProcedure
    .input(utilityListSchema)
    .query(async ({ ctx, input }) => {
      const { page, pageSize, utilityType, status, propertyId } = input

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const conditions: any[] = []

      // Tenant scope
      if (ctx.role !== "super_admin" || ctx.tenantId) {
        conditions.push(eq(utilityAccounts.tenantId, ctx.tenantId!))
      }

      // Filter by utility type
      if (utilityType) {
        conditions.push(eq(utilityAccounts.utilityType, utilityType as any)) // eslint-disable-line @typescript-eslint/no-explicit-any
      }

      // Filter by status
      if (status) {
        conditions.push(eq(utilityAccounts.status, status as any)) // eslint-disable-line @typescript-eslint/no-explicit-any
      }

      // Filter by property
      if (propertyId) {
        conditions.push(eq(utilityAccounts.propertyId, propertyId))
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined

      // Get total count
      const totalResult = await db
        .select({ count: count() })
        .from(utilityAccounts)
        .where(where)
      const total = totalResult[0]?.count ?? 0

      const rows = await db
        .select()
        .from(utilityAccounts)
        .where(where)
        .orderBy(desc(utilityAccounts.createdAt))
        .limit(pageSize)
        .offset((page - 1) * pageSize)

      // Enrich with property title
      const items = await Promise.all(
        rows.map(async (row) => {
          const property = await db.query.properties.findFirst({
            where: eq(properties.id, row.propertyId),
            columns: { id: true, title: true },
          })
          return {
            ...row,
            propertyTitle: property?.title ?? null,
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
      const utility = await db.query.utilityAccounts.findFirst({
        where: and(
          eq(utilityAccounts.id, input.id),
          ctx.role === "super_admin" && ctx.tenantId === null
            ? undefined
            : eq(utilityAccounts.tenantId, ctx.tenantId!)
        ),
      })

      if (!utility) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Utility account not found" })
      }

      // Get property
      const property = await db.query.properties.findFirst({
        where: eq(properties.id, utility.propertyId),
        columns: { id: true, title: true },
      })

      // Get tenant if assigned
      let tenant = null
      if (utility.propertyTenantId) {
        tenant = await db.query.propertyTenants.findFirst({
          where: eq(propertyTenants.id, utility.propertyTenantId),
          columns: { id: true, name: true },
        })
      }

      return {
        ...utility,
        property: property ?? null,
        tenant: tenant ?? null,
      }
    }),

  create: tenantProcedure
    .input(utilityCreateSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No tenant selected",
        })
      }

      const [inserted] = await db
        .insert(utilityAccounts)
        .values({
          ...input,
          tenantId: ctx.tenantId,
          securityDeposit: input.securityDeposit ? String(input.securityDeposit) : null,
        } as any) // eslint-disable-line @typescript-eslint/no-explicit-any
        .returning({ id: utilityAccounts.id })

      return { id: inserted.id }
    }),

  update: tenantProcedure
    .input(utilityUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: any = {
        ...data,
        updatedAt: new Date(),
      }
      if (data.securityDeposit !== undefined) {
        updateData.securityDeposit = data.securityDeposit ? String(data.securityDeposit) : null
      }

      await db
        .update(utilityAccounts)
        .set(updateData)
        .where(
          and(
            eq(utilityAccounts.id, id),
            ctx.role === "super_admin" && ctx.tenantId === null
              ? undefined
              : eq(utilityAccounts.tenantId, ctx.tenantId!)
          )
        )

      return { id }
    }),

  updateStatus: tenantProcedure
    .input(utilityStatusSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, status, clearanceCertUrl, depositRefunded } = input

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: any = {
        status,
        updatedAt: new Date(),
      }

      if (clearanceCertUrl !== undefined) {
        updateData.clearanceCertUrl = clearanceCertUrl
      }

      if (depositRefunded !== undefined) {
        updateData.depositRefunded = depositRefunded
      }

      await db
        .update(utilityAccounts)
        .set(updateData)
        .where(
          and(
            eq(utilityAccounts.id, id),
            ctx.role === "super_admin" && ctx.tenantId === null
              ? undefined
              : eq(utilityAccounts.tenantId, ctx.tenantId!)
          )
        )

      return { id }
    }),

  delete: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .delete(utilityAccounts)
        .where(
          and(
            eq(utilityAccounts.id, input.id),
            ctx.role === "super_admin" && ctx.tenantId === null
              ? undefined
              : eq(utilityAccounts.tenantId, ctx.tenantId!)
          )
        )

      return { ok: true }
    }),

  selectableProperties: tenantProcedure.query(async ({ ctx }) => {
    const rows = await db.query.properties.findMany({
      where:
        ctx.role === "super_admin" && ctx.tenantId === null
          ? undefined
          : eq(properties.tenantId, ctx.tenantId!),
      orderBy: asc(properties.title),
      columns: { id: true, title: true },
    })
    return rows.map((r) => ({
      id: r.id,
      label: r.title,
    }))
  }),
})
