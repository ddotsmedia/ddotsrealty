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
  parkingSlots,
  properties,
  propertyTenants,
} from "@/server/db/schema"
import {
  parkingCreateSchema,
  parkingUpdateSchema,
  parkingListSchema,
  parkingAssignSchema,
  parkingUnassignSchema,
} from "@/lib/validators/parking"

export const parkingRouter = createTRPCRouter({
  list: tenantProcedure
    .input(parkingListSchema)
    .query(async ({ ctx, input }) => {
      const { page, pageSize, type, propertyId, isAvailable } = input

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const conditions: any[] = []

      // Tenant scope
      if (ctx.role !== "super_admin" || ctx.tenantId) {
        conditions.push(eq(parkingSlots.tenantId, ctx.tenantId!))
      }

      // Filter by type
      if (type) {
        conditions.push(eq(parkingSlots.type, type as any)) // eslint-disable-line @typescript-eslint/no-explicit-any
      }

      // Filter by property
      if (propertyId) {
        conditions.push(eq(parkingSlots.propertyId, propertyId))
      }

      // Filter by availability
      if (isAvailable !== undefined) {
        conditions.push(eq(parkingSlots.isAvailable, isAvailable))
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined

      // Get total count
      const totalResult = await db
        .select({ count: count() })
        .from(parkingSlots)
        .where(where)
      const total = totalResult[0]?.count ?? 0

      const rows = await db
        .select()
        .from(parkingSlots)
        .where(where)
        .orderBy(desc(parkingSlots.createdAt))
        .limit(pageSize)
        .offset((page - 1) * pageSize)

      // Enrich with property title and assigned tenant name
      const items = await Promise.all(
        rows.map(async (row) => {
          const property = await db.query.properties.findFirst({
            where: eq(properties.id, row.propertyId),
            columns: { id: true, title: true },
          })

          let assignedTenantName: string | null = null
          if (row.assignedTo) {
            const tenant = await db.query.propertyTenants.findFirst({
              where: eq(propertyTenants.id, row.assignedTo),
              columns: { id: true, name: true },
            })
            assignedTenantName = tenant?.name ?? null
          }

          return {
            ...row,
            propertyTitle: property?.title ?? null,
            assignedTenantName,
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
      const slot = await db.query.parkingSlots.findFirst({
        where: and(
          eq(parkingSlots.id, input.id),
          ctx.role === "super_admin" && ctx.tenantId === null
            ? undefined
            : eq(parkingSlots.tenantId, ctx.tenantId!)
        ),
      })

      if (!slot) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Parking slot not found" })
      }

      // Get property
      const property = await db.query.properties.findFirst({
        where: eq(properties.id, slot.propertyId),
        columns: { id: true, title: true },
      })

      // Get assigned tenant if any
      let assignedTenant = null
      if (slot.assignedTo) {
        assignedTenant = await db.query.propertyTenants.findFirst({
          where: eq(propertyTenants.id, slot.assignedTo),
          columns: { id: true, name: true },
        })
      }

      return {
        ...slot,
        property: property ?? null,
        assignedTenant: assignedTenant ?? null,
      }
    }),

  create: tenantProcedure
    .input(parkingCreateSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No tenant selected",
        })
      }

      const [inserted] = await db
        .insert(parkingSlots)
        .values({
          ...input,
          tenantId: ctx.tenantId,
        } as any) // eslint-disable-line @typescript-eslint/no-explicit-any
        .returning({ id: parkingSlots.id })

      return { id: inserted.id }
    }),

  update: tenantProcedure
    .input(parkingUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input

      await db
        .update(parkingSlots)
        .set(data as any) // eslint-disable-line @typescript-eslint/no-explicit-any
        .where(
          and(
            eq(parkingSlots.id, id),
            ctx.role === "super_admin" && ctx.tenantId === null
              ? undefined
              : eq(parkingSlots.tenantId, ctx.tenantId!)
          )
        )

      return { id }
    }),

  assign: tenantProcedure
    .input(parkingAssignSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, assignedTo, contractId, vehiclePlate, vehicleMake } = input

      await db
        .update(parkingSlots)
        .set({
          assignedTo,
          contractId: contractId ?? undefined,
          vehiclePlate: vehiclePlate ?? undefined,
          vehicleMake: vehicleMake ?? undefined,
          isAvailable: false,
        })
        .where(
          and(
            eq(parkingSlots.id, id),
            ctx.role === "super_admin" && ctx.tenantId === null
              ? undefined
              : eq(parkingSlots.tenantId, ctx.tenantId!)
          )
        )

      return { id }
    }),

  unassign: tenantProcedure
    .input(parkingUnassignSchema)
    .mutation(async ({ ctx, input }) => {
      const { id } = input

      await db
        .update(parkingSlots)
        .set({
          assignedTo: null,
          contractId: null,
          vehiclePlate: null,
          vehicleMake: null,
          isAvailable: true,
        })
        .where(
          and(
            eq(parkingSlots.id, id),
            ctx.role === "super_admin" && ctx.tenantId === null
              ? undefined
              : eq(parkingSlots.tenantId, ctx.tenantId!)
          )
        )

      return { id }
    }),

  delete: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .delete(parkingSlots)
        .where(
          and(
            eq(parkingSlots.id, input.id),
            ctx.role === "super_admin" && ctx.tenantId === null
              ? undefined
              : eq(parkingSlots.tenantId, ctx.tenantId!)
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
})
