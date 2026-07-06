import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { createTRPCRouter, tenantProcedure } from "@/server/trpc/trpc";
import { db } from "@/server/db";
import { contractOccupants } from "@/server/db/schema";
import {
  occupantCreateSchema,
  occupantUpdateSchema,
  occupantListSchema,
} from "@/lib/validators/occupant";

export const occupantRouter = createTRPCRouter({
  listByContract: tenantProcedure
    .input(occupantListSchema)
    .query(async ({ ctx, input }) => {
      const { contractId } = input;

      const occupants = await db
        .select()
        .from(contractOccupants)
        .where(
          and(
            eq(contractOccupants.contractId, contractId),
            ctx.role === "super_admin" && ctx.tenantId === null
              ? undefined
              : eq(contractOccupants.tenantId, ctx.tenantId!)
          )
        );

      return occupants;
    }),

  create: tenantProcedure
    .input(occupantCreateSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No tenant selected",
        });
      }

      const [inserted] = await db
        .insert(contractOccupants)
        .values({
          ...input,
          tenantId: ctx.tenantId,
        })
        .returning({ id: contractOccupants.id });

      return { id: inserted.id };
    }),

  update: tenantProcedure
    .input(occupantUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      await db
        .update(contractOccupants)
        .set(data)
        .where(
          and(
            eq(contractOccupants.id, id),
            ctx.role === "super_admin" && ctx.tenantId === null
              ? undefined
              : eq(contractOccupants.tenantId, ctx.tenantId!)
          )
        );

      return { id };
    }),

  delete: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .delete(contractOccupants)
        .where(
          and(
            eq(contractOccupants.id, input.id),
            ctx.role === "super_admin" && ctx.tenantId === null
              ? undefined
              : eq(contractOccupants.tenantId, ctx.tenantId!)
          )
        );

      return { ok: true };
    }),
});
