import { TRPCError } from "@trpc/server"
import { z } from "zod"
import {
  eq,
  and,
  or,
  ilike,
  desc,
  asc,
  count,
} from "drizzle-orm"
import { createTRPCRouter, tenantProcedure } from "@/server/trpc/trpc"
import { db } from "@/server/db"
import {
  maintenanceRequests,
  properties,
  propertyTenants,
  users,
} from "@/server/db/schema"
import {
  maintenanceCreateSchema,
  maintenanceUpdateSchema,
  maintenanceListSchema,
  maintenanceStatusSchema,
  costApproveSchema,
} from "@/lib/validators/maintenance"

export const maintenanceRouter = createTRPCRouter({
  list: tenantProcedure
    .input(maintenanceListSchema)
    .query(async ({ ctx, input }) => {
      const {
        page,
        pageSize,
        search,
        status,
        priority,
        category,
        sortBy,
        sortDir,
      } = input

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const conditions: any[] = []

      // Tenant scope
      if (ctx.role !== "super_admin" || ctx.tenantId) {
        conditions.push(eq(maintenanceRequests.tenantId, ctx.tenantId!))
      }

      // Search filter
      if (search) {
        conditions.push(
          ilike(maintenanceRequests.description, `%${search}%`)
        )
      }

      // Status filter
      if (status) {
        conditions.push(eq(maintenanceRequests.status, status as any)) // eslint-disable-line @typescript-eslint/no-explicit-any
      }

      // Priority filter
      if (priority) {
        conditions.push(eq(maintenanceRequests.priority, priority as any)) // eslint-disable-line @typescript-eslint/no-explicit-any
      }

      // Category filter
      if (category) {
        conditions.push(eq(maintenanceRequests.category, category as any)) // eslint-disable-line @typescript-eslint/no-explicit-any
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined

      // Get total count
      const totalResult = await db
        .select({ count: count() })
        .from(maintenanceRequests)
        .where(where)
      const total = totalResult[0]?.count ?? 0

      // Sort column
      const orderByColumn =
        sortBy === "priority"
          ? maintenanceRequests.priority
          : maintenanceRequests.createdAt

      const orderByDir = sortDir === "asc" ? asc : desc

      const rows = await db
        .select()
        .from(maintenanceRequests)
        .where(where)
        .orderBy(orderByDir(orderByColumn))
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
      const request = await db.query.maintenanceRequests.findFirst({
        where: and(
          eq(maintenanceRequests.id, input.id),
          ctx.role === "super_admin" && ctx.tenantId === null
            ? undefined
            : eq(maintenanceRequests.tenantId, ctx.tenantId!)
        ),
      })

      if (!request) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Maintenance request not found" })
      }

      // Get property
      const property = await db.query.properties.findFirst({
        where: eq(properties.id, request.propertyId),
        columns: { id: true, title: true },
      })

      // Get tenant
      let tenant = null
      if (request.propertyTenantId) {
        tenant = await db.query.propertyTenants.findFirst({
          where: eq(propertyTenants.id, request.propertyTenantId),
          columns: { id: true, name: true },
        })
      }

      // Get reported by user name
      let reportedByName: string | null = null
      if (request.reportedBy) {
        const user = await db.query.users.findFirst({
          where: eq(users.id, request.reportedBy),
          columns: { id: true, name: true },
        })
        reportedByName = user?.name ?? null
      }

      return {
        ...request,
        property: property ?? null,
        tenant: tenant ?? null,
        reportedByName,
      }
    }),

  create: tenantProcedure
    .input(maintenanceCreateSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No tenant selected",
        })
      }

      const [inserted] = await db
        .insert(maintenanceRequests)
        .values({
          ...input,
          tenantId: ctx.tenantId,
          reportedBy: ctx.userId,
          costEstimate: input.costEstimate ? String(input.costEstimate) : null,
        } as any) // eslint-disable-line @typescript-eslint/no-explicit-any
        .returning({ id: maintenanceRequests.id })

      return { id: inserted.id }
    }),

  update: tenantProcedure
    .input(maintenanceUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: any = {
        ...data,
        updatedAt: new Date(),
      }
      if (data.costEstimate !== undefined) {
        updateData.costEstimate = data.costEstimate ? String(data.costEstimate) : null
      }

      await db
        .update(maintenanceRequests)
        .set(updateData)
        .where(
          and(
            eq(maintenanceRequests.id, id),
            ctx.role === "super_admin" && ctx.tenantId === null
              ? undefined
              : eq(maintenanceRequests.tenantId, ctx.tenantId!)
          )
        )

      return { id }
    }),

  updateStatus: tenantProcedure
    .input(maintenanceStatusSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, status, costActual, afterPhotos, invoiceUrl } = input

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: any = {
        status,
        updatedAt: new Date(),
      }

      if (status === "completed") {
        updateData.completedAt = new Date()
      }

      if (costActual !== undefined) {
        updateData.costActual = costActual ? String(costActual) : null
      }

      if (afterPhotos !== undefined) {
        updateData.afterPhotos = afterPhotos
      }

      if (invoiceUrl !== undefined) {
        updateData.invoiceUrl = invoiceUrl
      }

      await db
        .update(maintenanceRequests)
        .set(updateData)
        .where(
          and(
            eq(maintenanceRequests.id, id),
            ctx.role === "super_admin" && ctx.tenantId === null
              ? undefined
              : eq(maintenanceRequests.tenantId, ctx.tenantId!)
          )
        )

      return { id }
    }),

  approveCost: tenantProcedure
    .input(costApproveSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, costApproved } = input

      await db
        .update(maintenanceRequests)
        .set({
          costApproved,
          costApprovedBy: costApproved ? ctx.userId : null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(maintenanceRequests.id, id),
            ctx.role === "super_admin" && ctx.tenantId === null
              ? undefined
              : eq(maintenanceRequests.tenantId, ctx.tenantId!)
          )
        )

      return { id }
    }),

  delete: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .delete(maintenanceRequests)
        .where(
          and(
            eq(maintenanceRequests.id, input.id),
            ctx.role === "super_admin" && ctx.tenantId === null
              ? undefined
              : eq(maintenanceRequests.tenantId, ctx.tenantId!)
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
