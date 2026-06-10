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
  sql,
  gte,
  lte,
  sum,
} from "drizzle-orm";
import { createTRPCRouter, tenantProcedure } from "@/server/trpc/trpc";
import { db } from "@/server/db";
import { owners, properties, contracts, cheques, commissions, maintenanceRequests } from "@/server/db/schema";
import {
  ownerCreateSchema,
  ownerUpdateSchema,
  ownerListSchema,
} from "@/lib/validators/contact";
import { encryptPII, decryptPII } from "@/lib/crypto";

export const ownerRouter = createTRPCRouter({
  list: tenantProcedure
    .input(ownerListSchema)
    .query(async ({ ctx, input }) => {
      const { page, pageSize, search, sortBy, sortDir } = input;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const conditions: any[] = [];

      // Tenant scope
      if (ctx.role !== "super_admin" || ctx.tenantId) {
        conditions.push(eq(owners.tenantId, ctx.tenantId!));
      }

      // Search filters
      if (search) {
        conditions.push(
          or(
            ilike(owners.name, `%${search}%`),
            ilike(owners.phone, `%${search}%`),
            ilike(owners.email, `%${search}%`)
          )
        );
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      // Get total count
      const totalResult = await db
        .select({ count: count() })
        .from(owners)
        .where(where);
      const total = totalResult[0]?.count ?? 0;

      // Get rows with sorting and pagination
      const orderByColumn =
        sortBy === "name" ? owners.name : owners.createdAt;

      const orderByDir = sortDir === "asc" ? asc : desc;

      const rows = await db
        .select({
          id: owners.id,
          tenantId: owners.tenantId,
          name: owners.name,
          phone: owners.phone,
          email: owners.email,
          nationality: owners.nationality,
          bankName: owners.bankName,
          bankIban: owners.bankIban,
          notes: owners.notes,
          createdAt: owners.createdAt,
          updatedAt: owners.updatedAt,
        })
        .from(owners)
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
      const owner = await db.query.owners.findFirst({
        where: and(
          eq(owners.id, input.id),
          ctx.role === "super_admin" && ctx.tenantId === null
            ? undefined
            : eq(owners.tenantId, ctx.tenantId!)
        ),
      });

      if (!owner) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Owner not found" });
      }

      // Decrypt PII
      const decryptedEmiratesId = owner.emiratesId ? decryptPII(owner.emiratesId) : null;
      const decryptedPassportNo = owner.passportNo ? decryptPII(owner.passportNo) : null;

      // Get count of linked properties
      const propertiesResult = await db
        .select({ count: count() })
        .from(properties)
        .where(eq(properties.ownerId, owner.id));

      const linkedPropertiesCount = propertiesResult[0]?.count ?? 0;

      return {
        ...owner,
        emiratesId: decryptedEmiratesId,
        passportNo: decryptedPassportNo,
        linkedPropertiesCount,
      };
    }),

  create: tenantProcedure
    .input(ownerCreateSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No tenant selected",
        });
      }

      const encryptedEmiratesId = input.emiratesId ? encryptPII(input.emiratesId) : null;
      const encryptedPassportNo = input.passportNo ? encryptPII(input.passportNo) : null;

      const [inserted] = await db
        .insert(owners)
        .values({
          ...input,
          tenantId: ctx.tenantId,
          emiratesId: encryptedEmiratesId,
          passportNo: encryptedPassportNo,
        } as any) // eslint-disable-line @typescript-eslint/no-explicit-any
        .returning({ id: owners.id });

      return { id: inserted.id };
    }),

  update: tenantProcedure
    .input(ownerUpdateSchema)
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
        .update(owners)
        .set({
          ...encryptedData,
          updatedAt: new Date(),
        } as any) // eslint-disable-line @typescript-eslint/no-explicit-any
        .where(
          and(
            eq(owners.id, id),
            ctx.role === "super_admin" && ctx.tenantId === null
              ? undefined
              : eq(owners.tenantId, ctx.tenantId!)
          )
        );

      return { id };
    }),

  delete: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .delete(owners)
        .where(
          and(
            eq(owners.id, input.id),
            ctx.role === "super_admin" && ctx.tenantId === null
              ? undefined
              : eq(owners.tenantId, ctx.tenantId!)
          )
        );

      return { ok: true };
    }),

  statement: tenantProcedure
    .input(
      z.object({
        ownerId: z.string().uuid(),
        from: z.coerce.date(),
        to: z.coerce.date(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { ownerId, from, to } = input;

      // Get owner
      const owner = await db.query.owners.findFirst({
        where: and(
          eq(owners.id, ownerId),
          ctx.role === "super_admin" && ctx.tenantId === null
            ? undefined
            : eq(owners.tenantId, ctx.tenantId!)
        ),
      });

      if (!owner) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Owner not found" });
      }

      // Calculate totalRent: sum of cleared cheques (status='cleared', direction='receivable')
      // whose clearedDate (fallback dueDate) is within the period
      const rentResult = await db
        .select({ total: sum(cheques.amount) })
        .from(cheques)
        .where(
          and(
            eq(cheques.ownerId, ownerId),
            eq(cheques.direction, "receivable"),
            eq(cheques.status, "cleared"),
            gte(cheques.clearedDate, from),
            lte(cheques.clearedDate, to),
            ctx.role === "super_admin" && ctx.tenantId === null
              ? undefined
              : eq(cheques.tenantId, ctx.tenantId!)
          )
        );

      const totalRent = rentResult[0]?.total ? Number(rentResult[0].total) : 0;

      // Calculate totalCommission: sum of commissions.commissionAmount
      // for commissions linked to contracts of this owner within the period
      const commissionResult = await db
        .select({ total: sum(commissions.commissionAmount) })
        .from(commissions)
        .innerJoin(contracts, eq(commissions.contractId, contracts.id))
        .where(
          and(
            eq(contracts.ownerId, ownerId),
            gte(commissions.createdAt, from),
            lte(commissions.createdAt, to),
            ctx.role === "super_admin" && ctx.tenantId === null
              ? undefined
              : eq(commissions.tenantId, ctx.tenantId!)
          )
        );

      const totalCommission = commissionResult[0]?.total
        ? Number(commissionResult[0].total)
        : 0;

      // Calculate totalMaintenance: sum of maintenanceRequests.costActual
      // for properties owned by this owner with completedAt in the period
      const maintenanceResult = await db
        .select({ total: sum(maintenanceRequests.costActual) })
        .from(maintenanceRequests)
        .innerJoin(properties, eq(maintenanceRequests.propertyId, properties.id))
        .where(
          and(
            eq(properties.ownerId, ownerId),
            gte(maintenanceRequests.completedAt, from),
            lte(maintenanceRequests.completedAt, to),
            ctx.role === "super_admin" && ctx.tenantId === null
              ? undefined
              : eq(maintenanceRequests.tenantId, ctx.tenantId!)
          )
        );

      const totalMaintenance = maintenanceResult[0]?.total
        ? Number(maintenanceResult[0].total)
        : 0;

      // Calculate netPayable
      const netPayable = totalRent - totalCommission - totalMaintenance;

      return {
        owner: {
          id: owner.id,
          name: owner.name,
        },
        from,
        to,
        totalRent,
        totalCommission,
        totalMaintenance,
        netPayable,
      };
    }),
});
