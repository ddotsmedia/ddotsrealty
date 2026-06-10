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
  leads,
  leadActivities,
  listings,
  users,
} from "@/server/db/schema"
import {
  leadCreateSchema,
  leadUpdateSchema,
  leadListSchema,
  leadStatusSchema,
  leadActivitySchema,
} from "@/lib/validators/lead"

export const leadRouter = createTRPCRouter({
  list: tenantProcedure
    .input(leadListSchema)
    .query(async ({ ctx, input }) => {
      const {
        page,
        pageSize,
        search,
        status,
        source,
        assignedTo,
        sortBy,
        sortDir,
      } = input

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const conditions: any[] = []

      // Tenant scope
      if (ctx.role !== "super_admin" || ctx.tenantId) {
        conditions.push(eq(leads.tenantId, ctx.tenantId!))
      }

      // Search filters
      if (search) {
        conditions.push(
          or(
            ilike(leads.name, `%${search}%`),
            ilike(leads.phone, `%${search}%`),
            ilike(leads.email, `%${search}%`)
          )
        )
      }

      // Enum filters
      if (status) conditions.push(eq(leads.status, status as any)) // eslint-disable-line @typescript-eslint/no-explicit-any
      if (source) conditions.push(eq(leads.source, source as any)) // eslint-disable-line @typescript-eslint/no-explicit-any

      // Assignee filter
      if (assignedTo) conditions.push(eq(leads.assignedTo, assignedTo))

      const where = conditions.length > 0 ? and(...conditions) : undefined

      // Get total count
      const totalResult = await db
        .select({ count: count() })
        .from(leads)
        .where(where)
      const total = totalResult[0]?.count ?? 0

      // Get rows with sorting and pagination
      const orderByColumn =
        sortBy === "nextFollowUp"
          ? leads.nextFollowUp
          : leads.createdAt

      const orderByDir = sortDir === "asc" ? asc : desc

      const rows = await db
        .select()
        .from(leads)
        .where(where)
        .orderBy(orderByDir(orderByColumn))
        .limit(pageSize)
        .offset((page - 1) * pageSize)

      // Enrich with assignedName and listingTitle
      const items = await Promise.all(
        rows.map(async (row) => {
          let assignedName: string | null = null
          if (row.assignedTo) {
            const broker = await db.query.users.findFirst({
              where: eq(users.id, row.assignedTo),
              columns: { name: true },
            })
            assignedName = broker?.name ?? null
          }

          let listingTitle: string | null = null
          if (row.listingId) {
            const listing = await db.query.listings.findFirst({
              where: eq(listings.id, row.listingId),
              columns: { title: true },
            })
            listingTitle = listing?.title ?? null
          }

          return {
            ...row,
            assignedName,
            listingTitle,
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

  board: tenantProcedure
    .query(async ({ ctx }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const conditions: any[] = []

      // Tenant scope
      if (ctx.role !== "super_admin" || ctx.tenantId) {
        conditions.push(eq(leads.tenantId, ctx.tenantId!))
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined

      const rows = await db
        .select({
          id: leads.id,
          name: leads.name,
          phone: leads.phone,
          status: leads.status,
          source: leads.source,
          budgetMin: leads.budgetMin,
          budgetMax: leads.budgetMax,
          nextFollowUp: leads.nextFollowUp,
          assignedTo: leads.assignedTo,
        })
        .from(leads)
        .where(where)
        .limit(500)

      return rows
    }),

  getById: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const lead = await db.query.leads.findFirst({
        where: and(
          eq(leads.id, input.id),
          ctx.role === "super_admin" && ctx.tenantId === null
            ? undefined
            : eq(leads.tenantId, ctx.tenantId!)
        ),
      })

      if (!lead) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Lead not found" })
      }

      // Get activities
      const activities = await db
        .select()
        .from(leadActivities)
        .where(eq(leadActivities.leadId, lead.id))
        .orderBy(desc(leadActivities.createdAt))

      // Get assigned broker name
      let assignedName: string | null = null
      if (lead.assignedTo) {
        const broker = await db.query.users.findFirst({
          where: eq(users.id, lead.assignedTo),
          columns: { name: true },
        })
        assignedName = broker?.name ?? null
      }

      // Get listing title
      let listingTitle: string | null = null
      if (lead.listingId) {
        const listing = await db.query.listings.findFirst({
          where: eq(listings.id, lead.listingId),
          columns: { title: true },
        })
        listingTitle = listing?.title ?? null
      }

      return {
        ...lead,
        activities,
        assignedName,
        listingTitle,
      }
    }),

  create: tenantProcedure
    .input(leadCreateSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No tenant selected",
        })
      }

      const [inserted] = await db
        .insert(leads)
        .values({
          ...input,
          tenantId: ctx.tenantId,
          budgetMin: input.budgetMin ? String(input.budgetMin) : null,
          budgetMax: input.budgetMax ? String(input.budgetMax) : null,
        } as any) // eslint-disable-line @typescript-eslint/no-explicit-any
        .returning({ id: leads.id })

      return { id: inserted.id }
    }),

  update: tenantProcedure
    .input(leadUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: any = {
        ...data,
        updatedAt: new Date(),
      }
      if (data.budgetMin !== undefined) updateData.budgetMin = data.budgetMin ? String(data.budgetMin) : null
      if (data.budgetMax !== undefined) updateData.budgetMax = data.budgetMax ? String(data.budgetMax) : null

      await db
        .update(leads)
        .set(updateData)
        .where(
          and(
            eq(leads.id, id),
            ctx.role === "super_admin" && ctx.tenantId === null
              ? undefined
              : eq(leads.tenantId, ctx.tenantId!)
          )
        )

      return { id }
    }),

  delete: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Delete activities first
      await db
        .delete(leadActivities)
        .where(eq(leadActivities.leadId, input.id))

      // Delete lead
      await db
        .delete(leads)
        .where(
          and(
            eq(leads.id, input.id),
            ctx.role === "super_admin" && ctx.tenantId === null
              ? undefined
              : eq(leads.tenantId, ctx.tenantId!)
          )
        )

      return { ok: true }
    }),

  updateStatus: tenantProcedure
    .input(leadStatusSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, status } = input

      await db
        .update(leads)
        .set({
          status: status as any, // eslint-disable-line @typescript-eslint/no-explicit-any
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(leads.id, id),
            ctx.role === "super_admin" && ctx.tenantId === null
              ? undefined
              : eq(leads.tenantId, ctx.tenantId!)
          )
        )

      return { id }
    }),

  addActivity: tenantProcedure
    .input(leadActivitySchema)
    .mutation(async ({ ctx, input }) => {
      const { leadId, type, content, scheduledAt } = input

      // Verify lead exists and is in tenant scope
      const lead = await db.query.leads.findFirst({
        where: and(
          eq(leads.id, leadId),
          ctx.role === "super_admin" && ctx.tenantId === null
            ? undefined
            : eq(leads.tenantId, ctx.tenantId!)
        ),
      })

      if (!lead) {
        throw new TRPCError({ code: "NOT_FOUND" })
      }

      const [activity] = await db
        .insert(leadActivities)
        .values({
          leadId,
          userId: ctx.userId,
          type: type as any, // eslint-disable-line @typescript-eslint/no-explicit-any
          content: content ?? null,
          scheduledAt: scheduledAt ?? null,
        })
        .returning({ id: leadActivities.id })

      // If scheduledAt is provided, update lead.nextFollowUp
      if (scheduledAt) {
        await db
          .update(leads)
          .set({ nextFollowUp: scheduledAt, updatedAt: new Date() })
          .where(eq(leads.id, leadId))
      }

      return { id: activity.id }
    }),

  selectableBrokers: tenantProcedure.query(async ({ ctx }) => {
    return await db.query.users.findMany({
      where: and(
        ctx.role === "super_admin" && ctx.tenantId === null
          ? undefined
          : eq(users.tenantId, ctx.tenantId!),
        or(
          eq(users.role, "broker"),
          eq(users.role, "manager"),
          eq(users.role, "admin")
        )
      ),
      orderBy: asc(users.name),
      columns: { id: true, name: true },
    })
  }),

  selectableListings: tenantProcedure.query(async ({ ctx }) => {
    return await db.query.listings.findMany({
      where:
        ctx.role === "super_admin" && ctx.tenantId === null
          ? undefined
          : eq(listings.tenantId, ctx.tenantId!),
      orderBy: asc(listings.title),
      columns: { id: true, title: true },
    })
  }),
})
