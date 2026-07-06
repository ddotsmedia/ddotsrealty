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
  sum,
  inArray,
  lt,
} from "drizzle-orm";
import { createTRPCRouter, tenantProcedure } from "@/server/trpc/trpc";
import { db } from "@/server/db";
import { propertyTenants, cheques } from "@/server/db/schema";
import {
  tenantCreateSchema,
  tenantUpdateSchema,
  tenantListSchema,
} from "@/lib/validators/contact";
import { encryptPII, decryptPII } from "@/lib/crypto";

export const propertyTenantRouter = createTRPCRouter({
  list: tenantProcedure
    .input(tenantListSchema)
    .query(async ({ ctx, input }) => {
      const { page, pageSize, search, sortBy, sortDir } = input;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const conditions: any[] = [];

      // Tenant scope
      if (ctx.role !== "super_admin" || ctx.tenantId) {
        conditions.push(eq(propertyTenants.tenantId, ctx.tenantId!));
      }

      // Search filters
      if (search) {
        conditions.push(
          or(
            ilike(propertyTenants.name, `%${search}%`),
            ilike(propertyTenants.phone, `%${search}%`),
            ilike(propertyTenants.email, `%${search}%`),
            ilike(propertyTenants.companyName, `%${search}%`)
          )
        );
      }

      // Filter by blacklisted status
      if (input.blacklisted !== undefined) {
        conditions.push(eq(propertyTenants.blacklisted, input.blacklisted));
      }

      // Filter by screening status
      if (input.screeningStatus !== undefined) {
        conditions.push(eq(propertyTenants.screeningStatus, input.screeningStatus));
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      // Get total count
      const totalResult = await db
        .select({ count: count() })
        .from(propertyTenants)
        .where(where);
      const total = totalResult[0]?.count ?? 0;

      // Get rows with sorting and pagination
      const orderByColumn =
        sortBy === "name" ? propertyTenants.name : propertyTenants.createdAt;

      const orderByDir = sortDir === "asc" ? asc : desc;

      const rows = await db
        .select({
          id: propertyTenants.id,
          tenantId: propertyTenants.tenantId,
          name: propertyTenants.name,
          phone: propertyTenants.phone,
          email: propertyTenants.email,
          nationality: propertyTenants.nationality,
          companyName: propertyTenants.companyName,
          emergencyContact: propertyTenants.emergencyContact,
          notes: propertyTenants.notes,
          blacklisted: propertyTenants.blacklisted,
          screeningStatus: propertyTenants.screeningStatus,
          visaStatus: propertyTenants.visaStatus,
          salaryRange: propertyTenants.salaryRange,
          createdAt: propertyTenants.createdAt,
          updatedAt: propertyTenants.updatedAt,
        })
        .from(propertyTenants)
        .where(where)
        .orderBy(orderByDir(orderByColumn))
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
      const tenant = await db.query.propertyTenants.findFirst({
        where: and(
          eq(propertyTenants.id, input.id),
          ctx.role === "super_admin" && ctx.tenantId === null
            ? undefined
            : eq(propertyTenants.tenantId, ctx.tenantId!)
        ),
      });

      if (!tenant) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Tenant not found" });
      }

      // Decrypt PII
      const decryptedEmiratesId = tenant.emiratesId ? decryptPII(tenant.emiratesId) : null;
      const decryptedPassportNo = tenant.passportNo ? decryptPII(tenant.passportNo) : null;

      return {
        ...tenant,
        emiratesId: decryptedEmiratesId,
        passportNo: decryptedPassportNo,
      };
    }),

  create: tenantProcedure
    .input(tenantCreateSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No tenant selected",
        });
      }

      const encryptedEmiratesId = input.emiratesId ? encryptPII(input.emiratesId) : null;
      const encryptedPassportNo = input.passportNo ? encryptPII(input.passportNo) : null;

      // Prepare screening data with proper null handling
      const screeningData = {
        photoUrl: input.photoUrl || null,
        visaStatus: input.visaStatus || null,
        visaExpiry: input.visaExpiry || null,
        visaUid: input.visaUid || null,
        salaryRange: input.salaryRange || null,
        employerName: input.employerName || null,
        employerPhone: input.employerPhone || null,
        previousAddress: input.previousAddress || null,
        previousLandlord: input.previousLandlord || null,
        previousLandlordPhone: input.previousLandlordPhone || null,
        blacklisted: input.blacklisted || false,
        blacklistReason: input.blacklistReason || null,
        screeningStatus: input.screeningStatus || "pending",
        screeningDate: input.screeningDate || null,
        screeningNotes: input.screeningNotes || null,
      };

      const [inserted] = await db
        .insert(propertyTenants)
        .values({
          ...input,
          ...screeningData,
          tenantId: ctx.tenantId,
          emiratesId: encryptedEmiratesId,
          passportNo: encryptedPassportNo,
        } as any) // eslint-disable-line @typescript-eslint/no-explicit-any
        .returning({ id: propertyTenants.id });

      return { id: inserted.id };
    }),

  update: tenantProcedure
    .input(tenantUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const encryptedData: any = { ...data }; // eslint-disable-line @typescript-eslint/no-explicit-any
      if (data.emiratesId !== undefined) {
        encryptedData.emiratesId = data.emiratesId ? encryptPII(data.emiratesId) : null;
      }
      if (data.passportNo !== undefined) {
        encryptedData.passportNo = data.passportNo ? encryptPII(data.passportNo) : null;
      }

      await db
        .update(propertyTenants)
        .set({
          ...encryptedData,
          updatedAt: new Date(),
        } as any) // eslint-disable-line @typescript-eslint/no-explicit-any
        .where(
          and(
            eq(propertyTenants.id, id),
            ctx.role === "super_admin" && ctx.tenantId === null
              ? undefined
              : eq(propertyTenants.tenantId, ctx.tenantId!)
          )
        );

      return { id };
    }),

  delete: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .delete(propertyTenants)
        .where(
          and(
            eq(propertyTenants.id, input.id),
            ctx.role === "super_admin" && ctx.tenantId === null
              ? undefined
              : eq(propertyTenants.tenantId, ctx.tenantId!)
          )
        );

      return { ok: true };
    }),

  setBlacklist: tenantProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        blacklisted: z.boolean(),
        reason: z.string().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, blacklisted, reason } = input;

      await db
        .update(propertyTenants)
        .set({
          blacklisted,
          blacklistReason: blacklisted ? reason || null : null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(propertyTenants.id, id),
            ctx.role === "super_admin" && ctx.tenantId === null
              ? undefined
              : eq(propertyTenants.tenantId, ctx.tenantId!)
          )
        );

      return { id };
    }),

  setScreening: tenantProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        screeningStatus: z.enum(["pending", "approved", "rejected", "waived"]),
        screeningNotes: z.string().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, screeningStatus, screeningNotes } = input;

      await db
        .update(propertyTenants)
        .set({
          screeningStatus,
          screeningDate: new Date(),
          screeningNotes: screeningNotes || null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(propertyTenants.id, id),
            ctx.role === "super_admin" && ctx.tenantId === null
              ? undefined
              : eq(propertyTenants.tenantId, ctx.tenantId!)
          )
        );

      return { id };
    }),

  outstandingBalance: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const chequeResults = await db
        .select({
          total: sum(cheques.amount),
        })
        .from(cheques)
        .where(
          and(
            eq(cheques.propertyTenantId, input.id),
            eq(cheques.direction, "receivable"),
            inArray(cheques.status, ["pending", "collected", "in_custody", "pending_deposit", "postponed", "bounced"])
          )
        );

      const total = chequeResults[0]?.total ? Number(chequeResults[0].total) : 0;

      // Get overdue cheques
      const overdueResults = await db
        .select({
          total: sum(cheques.amount),
        })
        .from(cheques)
        .where(
          and(
            eq(cheques.propertyTenantId, input.id),
            eq(cheques.direction, "receivable"),
            inArray(cheques.status, ["pending", "collected", "in_custody", "pending_deposit", "postponed", "bounced"]),
            lt(cheques.dueDate, new Date())
          )
        );

      const overdue = overdueResults[0]?.total ? Number(overdueResults[0].total) : 0;

      return { total, overdue };
    }),
});
