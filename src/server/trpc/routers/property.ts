import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  eq,
  and,
  or,
  ilike,
  gte,
  lte,
  desc,
  asc,
  count,
  inArray,
  sql,
} from "drizzle-orm";
import { createTRPCRouter, tenantProcedure } from "@/server/trpc/trpc";
import { db } from "@/server/db";
import { properties, propertyPhotos, owners, users } from "@/server/db/schema";
import {
  propertyCreateSchema,
  propertyUpdateSchema,
  propertyListSchema,
} from "@/lib/validators/property";

export const propertyRouter = createTRPCRouter({
  list: tenantProcedure
    .input(propertyListSchema)
    .query(async ({ ctx, input }) => {
      const {
        page,
        pageSize,
        search,
        type,
        status,
        purpose,
        community,
        emirate,
        minPrice,
        maxPrice,
        bedrooms,
        sortBy,
        sortDir,
      } = input;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const conditions: any[] = [];

      // Tenant scope
      if (ctx.role !== "super_admin" || ctx.tenantId) {
        conditions.push(eq(properties.tenantId, ctx.tenantId!));
      }

      // Search filters
      if (search) {
        conditions.push(
          or(
            ilike(properties.title, `%${search}%`),
            ilike(properties.referenceNo, `%${search}%`),
            ilike(properties.buildingName, `%${search}%`)
          )
        );
      }

      // Enum filters
      if (type) conditions.push(eq(properties.type, type as any)); // eslint-disable-line @typescript-eslint/no-explicit-any
      if (status) conditions.push(eq(properties.status, status as any)); // eslint-disable-line @typescript-eslint/no-explicit-any
      if (purpose) conditions.push(eq(properties.purpose, purpose as any)); // eslint-disable-line @typescript-eslint/no-explicit-any
      if (emirate) conditions.push(eq(properties.emirate, emirate as any)); // eslint-disable-line @typescript-eslint/no-explicit-any

      // Text filters
      if (community) conditions.push(ilike(properties.community, `%${community}%`));

      // Numeric filters
      if (minPrice !== undefined) conditions.push(gte(sql`CAST(${properties.price} AS NUMERIC)`, minPrice));
      if (maxPrice !== undefined) conditions.push(lte(sql`CAST(${properties.price} AS NUMERIC)`, maxPrice));
      if (bedrooms !== undefined) conditions.push(gte(properties.bedrooms, bedrooms));

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      // Get total count
      const totalResult = await db
        .select({ count: count() })
        .from(properties)
        .where(where);
      const total = totalResult[0]?.count ?? 0;

      // Get rows with sorting and pagination
      const orderByColumn =
        sortBy === "price"
          ? properties.price
          : sortBy === "title"
            ? properties.title
            : properties.createdAt;

      const orderByDir = sortDir === "asc" ? asc : desc;

      const rows = await db
        .select()
        .from(properties)
        .where(where)
        .orderBy(orderByDir(orderByColumn))
        .limit(pageSize)
        .offset((page - 1) * pageSize);

      // Fetch primary photos
      const ids = rows.map((r) => r.id);
      const photosResult =
        ids.length > 0
          ? await db
              .select()
              .from(propertyPhotos)
              .where(
                and(
                  inArray(propertyPhotos.propertyId, ids),
                  eq(propertyPhotos.isPrimary, true)
                )
              )
          : [];

      // Map items with primary photos
      const items = rows.map((row) => {
        const primaryPhoto = photosResult.find(
          (p) => p.propertyId === row.id
        );
        return {
          ...row,
          primaryPhoto: primaryPhoto?.url ?? null,
        };
      });

      return {
        items,
        total,
        page,
        pageSize,
        pageCount: Math.ceil(total / pageSize),
      };
    }),

  getById: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const property = await db.query.properties.findFirst({
        where: and(
          eq(properties.id, input.id),
          ctx.role === "super_admin" && ctx.tenantId === null
            ? undefined
            : eq(properties.tenantId, ctx.tenantId!)
        ),
      });

      if (!property) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Property not found" });
      }

      // Get all photos
      const photos = await db
        .select()
        .from(propertyPhotos)
        .where(eq(propertyPhotos.propertyId, property.id))
        .orderBy(asc(propertyPhotos.sortOrder));

      // Get owner name
      let ownerName: string | null = null;
      if (property.ownerId) {
        const owner = await db.query.owners.findFirst({
          where: eq(owners.id, property.ownerId),
        });
        ownerName = owner?.name ?? null;
      }

      // Get broker name
      let brokerName: string | null = null;
      if (property.assignedBroker) {
        const broker = await db.query.users.findFirst({
          where: eq(users.id, property.assignedBroker),
        });
        brokerName = broker?.name ?? null;
      }

      return {
        ...property,
        photos,
        ownerName,
        brokerName,
      };
    }),

  create: tenantProcedure
    .input(propertyCreateSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No tenant selected",
        });
      }

      const referenceNo =
        input.referenceNo || "PROP-" + Date.now().toString().slice(-6);

      const [inserted] = await db
        .insert(properties)
        .values({
          ...input,
          tenantId: ctx.tenantId,
          referenceNo,
          areaSqft: input.areaSqft ? String(input.areaSqft) : null,
          price: input.price ? String(input.price) : null,
        } as any) // eslint-disable-line @typescript-eslint/no-explicit-any
        .returning({ id: properties.id });

      return { id: inserted.id };
    }),

  update: tenantProcedure
    .input(propertyUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      await db
        .update(properties)
        .set({
          ...data,
          updatedAt: new Date(),
          areaSqft: data.areaSqft ? String(data.areaSqft) : undefined,
          price: data.price ? String(data.price) : undefined,
        } as any) // eslint-disable-line @typescript-eslint/no-explicit-any
        .where(
          and(
            eq(properties.id, id),
            ctx.role === "super_admin" && ctx.tenantId === null
              ? undefined
              : eq(properties.tenantId, ctx.tenantId!)
          )
        );

      return { id };
    }),

  delete: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Delete photos first
      await db
        .delete(propertyPhotos)
        .where(eq(propertyPhotos.propertyId, input.id));

      // Delete property
      await db
        .delete(properties)
        .where(
          and(
            eq(properties.id, input.id),
            ctx.role === "super_admin" && ctx.tenantId === null
              ? undefined
              : eq(properties.tenantId, ctx.tenantId!)
          )
        );

      return { ok: true };
    }),

  addPhotos: tenantProcedure
    .input(
      z.object({
        propertyId: z.string().uuid(),
        photos: z.array(
          z.object({
            url: z.string(),
            caption: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { propertyId, photos } = input;

      // Verify property exists and is in tenant scope
      const property = await db.query.properties.findFirst({
        where: and(
          eq(properties.id, propertyId),
          ctx.role === "super_admin" && ctx.tenantId === null
            ? undefined
            : eq(properties.tenantId, ctx.tenantId!)
        ),
      });

      if (!property) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Check if property has any existing photos
      const existingPhotos = await db.query.propertyPhotos.findMany({
        where: eq(propertyPhotos.propertyId, propertyId),
      });

      const isPrimaryForAll = existingPhotos.length === 0;

      // Insert photos
      const photoRecords = photos.map((photo, idx) => ({
        propertyId,
        url: photo.url,
        caption: photo.caption,
        isPrimary: isPrimaryForAll && idx === 0,
        sortOrder: existingPhotos.length + idx,
      }));

      await db.insert(propertyPhotos).values(photoRecords);

      return { ok: true };
    }),

  removePhoto: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Verify photo ownership
      const photo = await db.query.propertyPhotos.findFirst({
        where: eq(propertyPhotos.id, input.id),
      });

      if (!photo) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Verify property is in tenant scope
      const property = await db.query.properties.findFirst({
        where: and(
          eq(properties.id, photo.propertyId),
          ctx.role === "super_admin" && ctx.tenantId === null
            ? undefined
            : eq(properties.tenantId, ctx.tenantId!)
        ),
      });

      if (!property) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await db.delete(propertyPhotos).where(eq(propertyPhotos.id, input.id));

      return { ok: true };
    }),

  setPrimaryPhoto: tenantProcedure
    .input(
      z.object({
        propertyId: z.string().uuid(),
        photoId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { propertyId, photoId } = input;

      // Verify property is in tenant scope
      const property = await db.query.properties.findFirst({
        where: and(
          eq(properties.id, propertyId),
          ctx.role === "super_admin" && ctx.tenantId === null
            ? undefined
            : eq(properties.tenantId, ctx.tenantId!)
        ),
      });

      if (!property) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // Verify photo exists and belongs to property
      const photo = await db.query.propertyPhotos.findFirst({
        where: and(
          eq(propertyPhotos.id, photoId),
          eq(propertyPhotos.propertyId, propertyId)
        ),
      });

      if (!photo) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Set all to false
      await db
        .update(propertyPhotos)
        .set({ isPrimary: false })
        .where(eq(propertyPhotos.propertyId, propertyId));

      // Set the selected one to true
      await db
        .update(propertyPhotos)
        .set({ isPrimary: true })
        .where(eq(propertyPhotos.id, photoId));

      return { ok: true };
    }),

  selectableOwners: tenantProcedure.query(async ({ ctx }) => {
    return await db.query.owners.findMany({
      where:
        ctx.role === "super_admin" && ctx.tenantId === null
          ? undefined
          : eq(owners.tenantId, ctx.tenantId!),
      orderBy: asc(owners.name),
      columns: { id: true, name: true },
    });
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
    });
  }),
});
