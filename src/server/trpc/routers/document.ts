import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  eq,
  and,
  or,
  ilike,
  desc,
  lt,
  gte,
  count,
} from "drizzle-orm";
import { createTRPCRouter, tenantProcedure } from "@/server/trpc/trpc";
import { db } from "@/server/db";
import { documents, listings } from "@/server/db/schema";
import {
  documentCreateSchema,
  documentListSchema,
} from "@/lib/validators/document";

export const documentRouter = createTRPCRouter({
  list: tenantProcedure
    .input(documentListSchema)
    .query(async ({ ctx, input }) => {
      const { page, pageSize, entityType, docType, search } = input;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const conditions: any[] = [];

      // Tenant scope
      if (ctx.role !== "super_admin" || ctx.tenantId) {
        conditions.push(eq(documents.tenantId, ctx.tenantId!));
      }

      // Filters
      if (entityType) {
        conditions.push(eq(documents.entityType, entityType as any)); // eslint-disable-line @typescript-eslint/no-explicit-any
      }
      if (docType) {
        conditions.push(eq(documents.docType, docType as any)); // eslint-disable-line @typescript-eslint/no-explicit-any
      }
      if (search) {
        conditions.push(ilike(documents.name, `%${search}%`));
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      // Get total count
      const totalResult = await db
        .select({ count: count() })
        .from(documents)
        .where(where);
      const total = totalResult[0]?.count ?? 0;

      // Get rows with sorting and pagination
      const rows = await db
        .select()
        .from(documents)
        .where(where)
        .orderBy(desc(documents.createdAt))
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

  listByEntity: tenantProcedure
    .input(
      z.object({
        entityType: z.string(),
        entityId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { entityType, entityId } = input;

      const rows = await db
        .select()
        .from(documents)
        .where(
          and(
            eq(documents.tenantId, ctx.tenantId!),
            eq(documents.entityType, entityType as any), // eslint-disable-line @typescript-eslint/no-explicit-any
            eq(documents.entityId, entityId)
          )
        )
        .orderBy(desc(documents.createdAt));

      return rows;
    }),

  grouped: tenantProcedure.query(async ({ ctx }) => {
    const rows = await db
      .select()
      .from(documents)
      .where(eq(documents.tenantId, ctx.tenantId!))
      .orderBy(desc(documents.createdAt));

    // Group by entityType in JS
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const groups: Record<string, any[]> = {};
    rows.forEach((doc) => {
      if (!groups[doc.entityType]) {
        groups[doc.entityType] = [];
      }
      groups[doc.entityType].push(doc);
    });

    // Return grouped list with top 50 per group
    return Object.entries(groups).map(([entityType, docs]) => ({
      entityType,
      count: docs.length,
      docs: docs.slice(0, 50),
    }));
  }),

  create: tenantProcedure
    .input(documentCreateSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No tenant selected",
        });
      }

      const [inserted] = await db
        .insert(documents)
        .values({
          ...input,
          tenantId: ctx.tenantId,
          uploadedBy: ctx.userId,
        } as any) // eslint-disable-line @typescript-eslint/no-explicit-any
        .returning({ id: documents.id });

      return { id: inserted.id };
    }),

  delete: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .delete(documents)
        .where(
          and(
            eq(documents.id, input.id),
            ctx.role === "super_admin" && ctx.tenantId === null
              ? undefined
              : eq(documents.tenantId, ctx.tenantId!)
          )
        );

      return { ok: true };
    }),

  expiringSoon: tenantProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Get documents expiring within 30 days or already expired
    const docRows = await db
      .select()
      .from(documents)
      .where(
        and(
          eq(documents.tenantId, ctx.tenantId!),
          or(
            lt(documents.expiryDate, now),
            and(
              gte(documents.expiryDate, now),
              lt(documents.expiryDate, thirtyDaysFromNow)
            )
          )
        )
      )
      .orderBy(documents.expiryDate ? desc(documents.expiryDate) : desc(documents.createdAt));

    // Get trakheesi permits expiring within 30 days or already expired
    const permitRows = await db
      .select()
      .from(listings)
      .where(
        and(
          eq(listings.tenantId, ctx.tenantId!),
          or(
            lt(listings.permitExpiry, now),
            and(
              gte(listings.permitExpiry, now),
              lt(listings.permitExpiry, thirtyDaysFromNow)
            )
          )
        )
      )
      .orderBy(listings.permitExpiry ? desc(listings.permitExpiry) : desc(listings.createdAt));

    // Normalize to a unified format
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any[] = [];

    docRows.forEach((doc) => {
      if (!doc.expiryDate) return;
      const daysLeft = Math.ceil(
        (doc.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      result.push({
        kind: "document",
        name: doc.name,
        docType: doc.docType,
        expiryDate: doc.expiryDate,
        daysLeft,
        entityType: doc.entityType,
      });
    });

    permitRows.forEach((listing) => {
      if (!listing.permitExpiry) return;
      const daysLeft = Math.ceil(
        (listing.permitExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      result.push({
        kind: "permit",
        name: listing.title,
        expiryDate: listing.permitExpiry,
        daysLeft,
      });
    });

    // Sort by daysLeft ascending
    result.sort((a, b) => a.daysLeft - b.daysLeft);

    return result;
  }),
});
