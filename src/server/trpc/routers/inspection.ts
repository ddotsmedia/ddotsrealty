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
  inspections,
  inspectionItems,
  properties,
  propertyTenants,
  contracts,
} from "@/server/db/schema"
import {
  inspectionCreateSchema,
  inspectionUpdateSchema,
  inspectionListSchema,
  inspectionItemCreateSchema,
} from "@/lib/validators/inspection"

export const inspectionRouter = createTRPCRouter({
  list: tenantProcedure
    .input(inspectionListSchema)
    .query(async ({ ctx, input }) => {
      const { page, pageSize, type, propertyId } = input

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const conditions: any[] = []

      // Tenant scope
      if (ctx.role !== "super_admin" || ctx.tenantId) {
        conditions.push(eq(inspections.tenantId, ctx.tenantId!))
      }

      // Type filter
      if (type) {
        conditions.push(eq(inspections.type, type as any)) // eslint-disable-line @typescript-eslint/no-explicit-any
      }

      // Property filter
      if (propertyId) {
        conditions.push(eq(inspections.propertyId, propertyId))
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined

      // Get total count
      const totalResult = await db
        .select({ count: count() })
        .from(inspections)
        .where(where)
      const total = totalResult[0]?.count ?? 0

      const rows = await db
        .select()
        .from(inspections)
        .where(where)
        .orderBy(desc(inspections.createdAt))
        .limit(pageSize)
        .offset((page - 1) * pageSize)

      // Enrich with property title and item count
      const items = await Promise.all(
        rows.map(async (row) => {
          const property = await db.query.properties.findFirst({
            where: eq(properties.id, row.propertyId),
            columns: { id: true, title: true },
          })

          const itemsResult = await db
            .select({ count: count() })
            .from(inspectionItems)
            .where(eq(inspectionItems.inspectionId, row.id))
          const itemCount = itemsResult[0]?.count ?? 0

          return {
            ...row,
            propertyTitle: property?.title ?? null,
            itemCount,
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
      const inspection = await db.query.inspections.findFirst({
        where: and(
          eq(inspections.id, input.id),
          ctx.role === "super_admin" && ctx.tenantId === null
            ? undefined
            : eq(inspections.tenantId, ctx.tenantId!)
        ),
      })

      if (!inspection) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Inspection not found" })
      }

      // Get items ordered by room
      const items = await db
        .select()
        .from(inspectionItems)
        .where(eq(inspectionItems.inspectionId, inspection.id))
        .orderBy(asc(inspectionItems.room))

      // Get property
      const property = await db.query.properties.findFirst({
        where: eq(properties.id, inspection.propertyId),
        columns: { id: true, title: true },
      })

      // Get tenant
      let tenant = null
      if (inspection.propertyTenantId) {
        tenant = await db.query.propertyTenants.findFirst({
          where: eq(propertyTenants.id, inspection.propertyTenantId),
          columns: { id: true, name: true },
        })
      }

      return {
        ...inspection,
        property: property ?? null,
        tenant: tenant ?? null,
        items,
      }
    }),

  create: tenantProcedure
    .input(inspectionCreateSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No tenant selected",
        })
      }

      const { items, ...inspectionData } = input

      const [inserted] = await db
        .insert(inspections)
        .values({
          ...inspectionData,
          tenantId: ctx.tenantId,
          inspectionDate: inspectionData.inspectionDate || null,
        } as any) // eslint-disable-line @typescript-eslint/no-explicit-any
        .returning({ id: inspections.id })

      // Insert items if any
      if (items && items.length > 0) {
        await db.insert(inspectionItems).values(
          items.map((item) => ({
            ...item,
            inspectionId: inserted.id,
            tenantId: ctx.tenantId,
            deductionAmount: item.deductionAmount ? String(item.deductionAmount) : null,
          }))
        )
      }

      return { id: inserted.id }
    }),

  update: tenantProcedure
    .input(inspectionUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, items, ...data } = input

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: any = {
        ...data,
        updatedAt: new Date(),
      }
      if (data.inspectionDate !== undefined) {
        updateData.inspectionDate = data.inspectionDate || null
      }

      await db
        .update(inspections)
        .set(updateData)
        .where(
          and(
            eq(inspections.id, id),
            ctx.role === "super_admin" && ctx.tenantId === null
              ? undefined
              : eq(inspections.tenantId, ctx.tenantId!)
          )
        )

      return { id }
    }),

  addItem: tenantProcedure
    .input(inspectionItemCreateSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No tenant selected",
        })
      }

      const [inserted] = await db
        .insert(inspectionItems)
        .values({
          ...input,
          tenantId: ctx.tenantId,
          deductionAmount: input.deductionAmount ? String(input.deductionAmount) : null,
        } as any) // eslint-disable-line @typescript-eslint/no-explicit-any
        .returning({ id: inspectionItems.id })

      return { id: inserted.id }
    }),

  removeItem: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .delete(inspectionItems)
        .where(
          and(
            eq(inspectionItems.id, input.id),
            ctx.role === "super_admin" && ctx.tenantId === null
              ? undefined
              : eq(inspectionItems.tenantId, ctx.tenantId!)
          )
        )

      return { ok: true }
    }),

  delete: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Delete items first
      await db
        .delete(inspectionItems)
        .where(eq(inspectionItems.inspectionId, input.id))

      // Then delete inspection
      await db
        .delete(inspections)
        .where(
          and(
            eq(inspections.id, input.id),
            ctx.role === "super_admin" && ctx.tenantId === null
              ? undefined
              : eq(inspections.tenantId, ctx.tenantId!)
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

  selectableContracts: tenantProcedure.query(async ({ ctx }) => {
    const rows = await db.query.contracts.findMany({
      where:
        ctx.role === "super_admin" && ctx.tenantId === null
          ? undefined
          : eq(contracts.tenantId, ctx.tenantId!),
      orderBy: asc(contracts.startDate),
      columns: { id: true, propertyId: true },
    })

    // Enrich with property title
    const result = await Promise.all(
      rows.map(async (contract) => {
        const property = await db.query.properties.findFirst({
          where: eq(properties.id, contract.propertyId),
          columns: { title: true },
        })
        return {
          id: contract.id,
          label: property?.title ?? "Unknown Property",
        }
      })
    )

    return result
  }),
})
