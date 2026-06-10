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
import { listings, properties, users } from "@/server/db/schema"
import {
  listingCreateSchema,
  listingUpdateSchema,
  listingListSchema,
  listingStatusSchema,
} from "@/lib/validators/listing"

export const listingRouter = createTRPCRouter({
  list: tenantProcedure
    .input(listingListSchema)
    .query(async ({ ctx, input }) => {
      const { page, pageSize, search, status, listingType, sortBy, sortDir } = input

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const conditions: any[] = []

      // Tenant scope
      if (ctx.role !== "super_admin" || ctx.tenantId) {
        conditions.push(eq(listings.tenantId, ctx.tenantId!))
      }

      // Search filters
      if (search) {
        conditions.push(
          or(
            ilike(listings.title, `%${search}%`)
          )
        )
      }

      // Enum filters
      if (status) conditions.push(eq(listings.status, status as any)) // eslint-disable-line @typescript-eslint/no-explicit-any
      if (listingType) conditions.push(eq(listings.listingType, listingType as any)) // eslint-disable-line @typescript-eslint/no-explicit-any

      const where = conditions.length > 0 ? and(...conditions) : undefined

      // Get total count
      const totalResult = await db
        .select({ count: count() })
        .from(listings)
        .where(where)
      const total = totalResult[0]?.count ?? 0

      // Get rows with sorting and pagination
      const orderByColumn =
        sortBy === "price"
          ? listings.price
          : sortBy === "publishedAt"
            ? listings.publishedAt
            : listings.createdAt

      const orderByDir = sortDir === "asc" ? asc : desc

      const rows = await db
        .select()
        .from(listings)
        .where(where)
        .orderBy(orderByDir(orderByColumn))
        .limit(pageSize)
        .offset((page - 1) * pageSize)

      // Enrich with property title, emirate and broker name
      const items = await Promise.all(
        rows.map(async (row) => {
          const property = await db.query.properties.findFirst({
            where: eq(properties.id, row.propertyId),
            columns: { id: true, title: true, emirate: true },
          })

          let brokerName: string | null = null
          if (row.brokerId) {
            const broker = await db.query.users.findFirst({
              where: eq(users.id, row.brokerId),
              columns: { id: true, name: true },
            })
            brokerName = broker?.name ?? null
          }

          return {
            ...row,
            propertyTitle: property?.title ?? null,
            propertyEmirate: property?.emirate ?? null,
            brokerName,
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
      const listing = await db.query.listings.findFirst({
        where: and(
          eq(listings.id, input.id),
          ctx.role === "super_admin" && ctx.tenantId === null
            ? undefined
            : eq(listings.tenantId, ctx.tenantId!)
        ),
      })

      if (!listing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Listing not found" })
      }

      const property = await db.query.properties.findFirst({
        where: eq(properties.id, listing.propertyId),
        columns: { id: true, title: true, referenceNo: true, emirate: true, community: true },
      })

      let brokerName: string | null = null
      if (listing.brokerId) {
        const broker = await db.query.users.findFirst({
          where: eq(users.id, listing.brokerId),
          columns: { id: true, name: true },
        })
        brokerName = broker?.name ?? null
      }

      return {
        ...listing,
        property: property ?? null,
        brokerName,
      }
    }),

  create: tenantProcedure
    .input(listingCreateSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No tenant selected",
        })
      }

      const [inserted] = await db
        .insert(listings)
        .values({
          ...input,
          tenantId: ctx.tenantId,
          price: input.price ? String(input.price) : null,
          brokerId: input.brokerId ?? null,
        } as any) // eslint-disable-line @typescript-eslint/no-explicit-any
        .returning({ id: listings.id })

      return { id: inserted.id }
    }),

  update: tenantProcedure
    .input(listingUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input

      await db
        .update(listings)
        .set({
          ...data,
          updatedAt: new Date(),
          price: data.price ? String(data.price) : undefined,
        } as any) // eslint-disable-line @typescript-eslint/no-explicit-any
        .where(
          and(
            eq(listings.id, id),
            ctx.role === "super_admin" && ctx.tenantId === null
              ? undefined
              : eq(listings.tenantId, ctx.tenantId!)
          )
        )

      return { id }
    }),

  delete: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .delete(listings)
        .where(
          and(
            eq(listings.id, input.id),
            ctx.role === "super_admin" && ctx.tenantId === null
              ? undefined
              : eq(listings.tenantId, ctx.tenantId!)
          )
        )

      return { ok: true }
    }),

  publish: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const listing = await db.query.listings.findFirst({
        where: and(
          eq(listings.id, input.id),
          ctx.role === "super_admin" && ctx.tenantId === null
            ? undefined
            : eq(listings.tenantId, ctx.tenantId!)
        ),
      })

      if (!listing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Listing not found" })
      }

      const property = await db.query.properties.findFirst({
        where: eq(properties.id, listing.propertyId),
        columns: { emirate: true },
      })

      // Check Trakheesi permit for Dubai listings
      if (property?.emirate === "dubai" && !listing.trakheesiPermit) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Trakheesi permit required to publish Dubai listings",
        })
      }

      await db
        .update(listings)
        .set({
          status: "active",
          publishedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(listings.id, input.id))

      return { ok: true }
    }),

  updateStatus: tenantProcedure
    .input(listingStatusSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, status } = input

      const updateData: any = { // eslint-disable-line @typescript-eslint/no-explicit-any
        status,
        updatedAt: new Date(),
      }

      if (status === "active") {
        updateData.publishedAt = new Date()
      }

      await db
        .update(listings)
        .set(updateData)
        .where(
          and(
            eq(listings.id, id),
            ctx.role === "super_admin" && ctx.tenantId === null
              ? undefined
              : eq(listings.tenantId, ctx.tenantId!)
          )
        )

      return { id }
    }),

  toggleFeature: tenantProcedure
    .input(z.object({ id: z.string().uuid(), isFeatured: z.boolean(), featuredUntil: z.coerce.date().optional() }))
    .mutation(async ({ ctx, input }) => {
      const { id, isFeatured, featuredUntil } = input

      await db
        .update(listings)
        .set({
          isFeatured,
          featuredUntil: isFeatured ? featuredUntil : null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(listings.id, id),
            ctx.role === "super_admin" && ctx.tenantId === null
              ? undefined
              : eq(listings.tenantId, ctx.tenantId!)
          )
        )

      return { id }
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

  selectableBrokers: tenantProcedure.query(async ({ ctx }) => {
    const rows = await db.query.users.findMany({
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
    return rows.map((r) => ({
      id: r.id,
      label: r.name,
    }))
  }),
})
