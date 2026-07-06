import { TRPCError } from "@trpc/server"
import { z } from "zod"
import {
  eq,
  and,
  desc,
  asc,
  count,
} from "drizzle-orm"
import { createTRPCRouter, tenantProcedure } from "@/server/trpc/trpc"
import { db } from "@/server/db"
import {
  keyHandovers,
  properties,
  propertyTenants,
  contracts,
} from "@/server/db/schema"
import {
  keyHandoverCreateSchema,
  keyHandoverUpdateSchema,
  keyHandoverListSchema,
} from "@/lib/validators/key-handover"

export const keyHandoverRouter = createTRPCRouter({
  list: tenantProcedure
    .input(keyHandoverListSchema)
    .query(async ({ ctx, input }) => {
      const { page, pageSize, type, propertyId } = input

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const conditions: any[] = []

      // Tenant scope
      if (ctx.role !== "super_admin" || ctx.tenantId) {
        conditions.push(eq(keyHandovers.tenantId, ctx.tenantId!))
      }

      // Type filter
      if (type) {
        conditions.push(eq(keyHandovers.type, type as any)) // eslint-disable-line @typescript-eslint/no-explicit-any
      }

      // Property filter
      if (propertyId) {
        conditions.push(eq(keyHandovers.propertyId, propertyId))
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined

      // Get total count
      const totalResult = await db
        .select({ count: count() })
        .from(keyHandovers)
        .where(where)
      const total = totalResult[0]?.count ?? 0

      const rows = await db
        .select()
        .from(keyHandovers)
        .where(where)
        .orderBy(desc(keyHandovers.createdAt))
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
      const handover = await db.query.keyHandovers.findFirst({
        where: and(
          eq(keyHandovers.id, input.id),
          ctx.role === "super_admin" && ctx.tenantId === null
            ? undefined
            : eq(keyHandovers.tenantId, ctx.tenantId!)
        ),
      })

      if (!handover) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Key handover not found" })
      }

      // Get property
      const property = await db.query.properties.findFirst({
        where: eq(properties.id, handover.propertyId),
        columns: { id: true, title: true },
      })

      // Get tenant
      let tenant = null
      if (handover.propertyTenantId) {
        tenant = await db.query.propertyTenants.findFirst({
          where: eq(propertyTenants.id, handover.propertyTenantId),
          columns: { id: true, name: true },
        })
      }

      return {
        ...handover,
        property: property ?? null,
        tenant: tenant ?? null,
      }
    }),

  create: tenantProcedure
    .input(keyHandoverCreateSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No tenant selected",
        })
      }

      const [inserted] = await db
        .insert(keyHandovers)
        .values({
          ...input,
          tenantId: ctx.tenantId,
          handoverDate: input.handoverDate || null,
        } as any) // eslint-disable-line @typescript-eslint/no-explicit-any
        .returning({ id: keyHandovers.id })

      return { id: inserted.id }
    }),

  update: tenantProcedure
    .input(keyHandoverUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: any = {
        ...data,
      }
      if (data.handoverDate !== undefined) {
        updateData.handoverDate = data.handoverDate || null
      }

      await db
        .update(keyHandovers)
        .set(updateData)
        .where(
          and(
            eq(keyHandovers.id, id),
            ctx.role === "super_admin" && ctx.tenantId === null
              ? undefined
              : eq(keyHandovers.tenantId, ctx.tenantId!)
          )
        )

      return { id }
    }),

  delete: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .delete(keyHandovers)
        .where(
          and(
            eq(keyHandovers.id, input.id),
            ctx.role === "super_admin" && ctx.tenantId === null
              ? undefined
              : eq(keyHandovers.tenantId, ctx.tenantId!)
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
