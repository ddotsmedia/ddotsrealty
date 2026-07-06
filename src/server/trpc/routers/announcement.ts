import { TRPCError } from "@trpc/server"
import { z } from "zod"
import {
  eq,
  and,
  ilike,
  desc,
  count,
} from "drizzle-orm"
import { createTRPCRouter, tenantProcedure } from "@/server/trpc/trpc"
import { db } from "@/server/db"
import {
  announcements,
  users,
} from "@/server/db/schema"
import {
  announcementCreateSchema,
  announcementListSchema,
} from "@/lib/validators/announcement"

export const announcementRouter = createTRPCRouter({
  list: tenantProcedure
    .input(announcementListSchema)
    .query(async ({ ctx, input }) => {
      const {
        page,
        pageSize,
        search,
      } = input

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const conditions: any[] = []

      // Tenant scope
      if (ctx.role !== "super_admin" || ctx.tenantId) {
        conditions.push(eq(announcements.tenantId, ctx.tenantId!))
      }

      // Search filter
      if (search) {
        conditions.push(
          ilike(announcements.title, `%${search}%`)
        )
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined

      // Get total count
      const totalResult = await db
        .select({ count: count() })
        .from(announcements)
        .where(where)
      const total = totalResult[0]?.count ?? 0

      // Get rows with pagination
      const rows = await db
        .select()
        .from(announcements)
        .where(where)
        .orderBy(desc(announcements.createdAt))
        .limit(pageSize)
        .offset((page - 1) * pageSize)

      // Enrich with createdByName
      const items = await Promise.all(
        rows.map(async (row) => {
          let createdByName: string | null = null
          if (row.createdBy) {
            const user = await db.query.users.findFirst({
              where: eq(users.id, row.createdBy),
              columns: { name: true },
            })
            createdByName = user?.name ?? null
          }

          return {
            ...row,
            createdByName,
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
      const announcement = await db.query.announcements.findFirst({
        where: and(
          eq(announcements.id, input.id),
          ctx.role === "super_admin" && ctx.tenantId === null
            ? undefined
            : eq(announcements.tenantId, ctx.tenantId!)
        ),
      })

      if (!announcement) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Announcement not found" })
      }

      // Get created by name
      let createdByName: string | null = null
      if (announcement.createdBy) {
        const user = await db.query.users.findFirst({
          where: eq(users.id, announcement.createdBy),
          columns: { name: true },
        })
        createdByName = user?.name ?? null
      }

      return {
        ...announcement,
        createdByName,
      }
    }),

  create: tenantProcedure
    .input(announcementCreateSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No tenant selected",
        })
      }

      const [inserted] = await db
        .insert(announcements)
        .values({
          ...input,
          tenantId: ctx.tenantId,
          createdBy: ctx.userId,
          publishedAt: new Date(),
        } as any) // eslint-disable-line @typescript-eslint/no-explicit-any
        .returning({ id: announcements.id })

      return { id: inserted.id }
    }),

  broadcast: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const announcement = await db.query.announcements.findFirst({
        where: and(
          eq(announcements.id, input.id),
          ctx.role === "super_admin" && ctx.tenantId === null
            ? undefined
            : eq(announcements.tenantId, ctx.tenantId!)
        ),
      })

      if (!announcement) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Announcement not found" })
      }

      // Mark as published if not already
      if (!announcement.publishedAt) {
        await db
          .update(announcements)
          .set({ publishedAt: new Date() })
          .where(eq(announcements.id, input.id))
      }

      // Return channels for display (scaffold: real delivery would iterate and send)
      return {
        ok: true,
        channels: announcement.sentVia,
      }
    }),

  delete: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .delete(announcements)
        .where(
          and(
            eq(announcements.id, input.id),
            ctx.role === "super_admin" && ctx.tenantId === null
              ? undefined
              : eq(announcements.tenantId, ctx.tenantId!)
          )
        )

      return { ok: true }
    }),
})
