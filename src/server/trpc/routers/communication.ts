import { TRPCError } from "@trpc/server"
import { z } from "zod"
import {
  eq,
  and,
  or,
  ilike,
  desc,
  count,
} from "drizzle-orm"
import { createTRPCRouter, tenantProcedure } from "@/server/trpc/trpc"
import { db } from "@/server/db"
import {
  communications,
  users,
} from "@/server/db/schema"
import {
  communicationCreateSchema,
  communicationListSchema,
} from "@/lib/validators/communication"

export const communicationRouter = createTRPCRouter({
  list: tenantProcedure
    .input(communicationListSchema)
    .query(async ({ ctx, input }) => {
      const {
        page,
        pageSize,
        entityType,
        channel,
        search,
      } = input

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const conditions: any[] = []

      // Tenant scope
      if (ctx.role !== "super_admin" || ctx.tenantId) {
        conditions.push(eq(communications.tenantId, ctx.tenantId!))
      }

      // Search filters
      if (search) {
        conditions.push(
          or(
            ilike(communications.subject, `%${search}%`),
            ilike(communications.content, `%${search}%`)
          )
        )
      }

      // Entity type filter
      if (entityType) {
        conditions.push(eq(communications.entityType, entityType as any)) // eslint-disable-line @typescript-eslint/no-explicit-any
      }

      // Channel filter
      if (channel) {
        conditions.push(eq(communications.channel, channel as any)) // eslint-disable-line @typescript-eslint/no-explicit-any
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined

      // Get total count
      const totalResult = await db
        .select({ count: count() })
        .from(communications)
        .where(where)
      const total = totalResult[0]?.count ?? 0

      // Get rows with pagination
      const rows = await db
        .select()
        .from(communications)
        .where(where)
        .orderBy(desc(communications.createdAt))
        .limit(pageSize)
        .offset((page - 1) * pageSize)

      // Enrich with sentByName
      const items = await Promise.all(
        rows.map(async (row) => {
          let sentByName: string | null = null
          if (row.sentBy) {
            const user = await db.query.users.findFirst({
              where: eq(users.id, row.sentBy),
              columns: { name: true },
            })
            sentByName = user?.name ?? null
          }

          return {
            ...row,
            sentByName,
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

  listByEntity: tenantProcedure
    .input(z.object({
      entityType: z.string(),
      entityId: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      const { entityType, entityId } = input

      const rows = await db
        .select()
        .from(communications)
        .where(
          and(
            ctx.role === "super_admin" && ctx.tenantId === null
              ? undefined
              : eq(communications.tenantId, ctx.tenantId!),
            eq(communications.entityType, entityType as any), // eslint-disable-line @typescript-eslint/no-explicit-any
            eq(communications.entityId, entityId)
          )
        )
        .orderBy(desc(communications.createdAt))

      // Enrich with sentByName
      const items = await Promise.all(
        rows.map(async (row) => {
          let sentByName: string | null = null
          if (row.sentBy) {
            const user = await db.query.users.findFirst({
              where: eq(users.id, row.sentBy),
              columns: { name: true },
            })
            sentByName = user?.name ?? null
          }

          return {
            ...row,
            sentByName,
          }
        })
      )

      return items
    }),

  create: tenantProcedure
    .input(communicationCreateSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No tenant selected",
        })
      }

      const [inserted] = await db
        .insert(communications)
        .values({
          ...input,
          tenantId: ctx.tenantId,
          sentBy: ctx.userId,
        } as any) // eslint-disable-line @typescript-eslint/no-explicit-any
        .returning({ id: communications.id })

      return { id: inserted.id }
    }),

  delete: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .delete(communications)
        .where(
          and(
            eq(communications.id, input.id),
            ctx.role === "super_admin" && ctx.tenantId === null
              ? undefined
              : eq(communications.tenantId, ctx.tenantId!)
          )
        )

      return { ok: true }
    }),
})
