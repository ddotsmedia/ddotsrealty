import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  eq,
  and,
  or,
  ilike,
  asc,
  desc,
  count,
} from "drizzle-orm";
import { createTRPCRouter, adminProcedure, tenantProcedure } from "@/server/trpc/trpc";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import {
  staffCreateSchema,
  staffUpdateSchema,
  staffListSchema,
} from "@/lib/validators/staff";
import { hashPassword } from "@/lib/password";

export const staffRouter = createTRPCRouter({
  list: tenantProcedure
    .input(staffListSchema)
    .query(async ({ ctx, input }) => {
      const { page, pageSize, search, role } = input;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const conditions: any[] = [];

      // Tenant scope
      if (ctx.role !== "super_admin" || ctx.tenantId) {
        conditions.push(eq(users.tenantId, ctx.tenantId!));
      }

      // Search filters
      if (search) {
        conditions.push(
          or(
            ilike(users.name, `%${search}%`),
            ilike(users.email, `%${search}%`)
          )
        );
      }

      // Role filter
      if (role) {
        conditions.push(eq(users.role, role as any)); // eslint-disable-line @typescript-eslint/no-explicit-any
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      // Get total count
      const totalResult = await db
        .select({ count: count() })
        .from(users)
        .where(where);
      const total = totalResult[0]?.count ?? 0;

      // Get rows with sorting and pagination
      const rows = await db
        .select({
          id: users.id,
          tenantId: users.tenantId,
          email: users.email,
          phone: users.phone,
          name: users.name,
          role: users.role,
          reraBrn: users.reraBrn,
          avatarUrl: users.avatarUrl,
          isActive: users.isActive,
          lastLogin: users.lastLogin,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .where(where)
        .orderBy(desc(users.createdAt))
        .limit(pageSize)
        .offset((page - 1) * pageSize);

      return {
        items: rows,
        total,
        page,
        pageSize,
        pageCount: Math.ceil(total / pageSize),
      };
    }),

  getById: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const user = await db.query.users.findFirst({
        where: and(
          eq(users.id, input.id),
          ctx.role === "super_admin" && ctx.tenantId === null
            ? undefined
            : eq(users.tenantId, ctx.tenantId!)
        ),
      });

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Staff member not found" });
      }

      // Never return passwordHash
      const { passwordHash, ...safeUser } = user;
      return safeUser;
    }),

  create: adminProcedure
    .input(staffCreateSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No tenant selected",
        });
      }

      // Check for duplicate email
      const existing = await db.query.users.findFirst({
        where: and(
          eq(users.email, input.email),
          eq(users.tenantId, ctx.tenantId)
        ),
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Email already in use",
        });
      }

      const passwordHash = await hashPassword(input.password);

      const [inserted] = await db
        .insert(users)
        .values({
          tenantId: ctx.tenantId,
          email: input.email,
          phone: input.phone,
          name: input.name,
          passwordHash,
          role: input.role as any, // eslint-disable-line @typescript-eslint/no-explicit-any
          reraBrn: input.reraBrn,
          isActive: true,
        })
        .returning({ id: users.id });

      return { id: inserted.id };
    }),

  update: adminProcedure
    .input(staffUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      // Verify user is in tenant scope
      const existing = await db.query.users.findFirst({
        where: and(
          eq(users.id, id),
          ctx.role === "super_admin" && ctx.tenantId === null
            ? undefined
            : eq(users.tenantId, ctx.tenantId!)
        ),
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const updateData: any = {}; // eslint-disable-line @typescript-eslint/no-explicit-any
      if (data.name !== undefined) updateData.name = data.name;
      if (data.phone !== undefined) updateData.phone = data.phone;
      if (data.role !== undefined) updateData.role = data.role;
      if (data.reraBrn !== undefined) updateData.reraBrn = data.reraBrn;
      if (data.isActive !== undefined) updateData.isActive = data.isActive;
      updateData.updatedAt = new Date();

      await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, id));

      return { id };
    }),

  setActive: adminProcedure
    .input(z.object({ id: z.string().uuid(), isActive: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      // Verify user is in tenant scope
      const existing = await db.query.users.findFirst({
        where: and(
          eq(users.id, input.id),
          ctx.role === "super_admin" && ctx.tenantId === null
            ? undefined
            : eq(users.tenantId, ctx.tenantId!)
        ),
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      await db
        .update(users)
        .set({ isActive: input.isActive, updatedAt: new Date() })
        .where(eq(users.id, input.id));

      return { ok: true };
    }),
});
