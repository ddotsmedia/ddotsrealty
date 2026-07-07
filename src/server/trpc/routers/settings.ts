import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { createTRPCRouter, adminProcedure } from "@/server/trpc/trpc";
import { db } from "@/server/db";
import { tenants } from "@/server/db/schema";

const companySettingsSchema = z.object({
  name: z.string().min(1).optional(),
  tradeLicense: z.string().optional().nullable(),
  reraOrn: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  address: z.string().optional().nullable(),
  emirate: z.string().optional().nullable(),
  logoUrl: z.string().optional().nullable(),
});

const reminderSettingsSchema = z.object({
  remindersEnabled: z.boolean(),
  chequeReminderDays: z.array(z.coerce.number().int()),
  contractReminderDays: z.array(z.coerce.number().int()),
});

export const settingsRouter = createTRPCRouter({
  getCompany: adminProcedure.query(async ({ ctx }) => {
    if (!ctx.tenantId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "No tenant selected",
      });
    }

    const company = await db.query.tenants.findFirst({
      where: eq(tenants.id, ctx.tenantId),
    });

    if (!company) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Tenant not found" });
    }

    return company;
  }),

  updateCompany: adminProcedure
    .input(companySettingsSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No tenant selected",
        });
      }

      const updateData: any = {}; // eslint-disable-line @typescript-eslint/no-explicit-any
      if (input.name !== undefined) updateData.name = input.name;
      if (input.tradeLicense !== undefined) updateData.tradeLicense = input.tradeLicense;
      if (input.reraOrn !== undefined) updateData.reraOrn = input.reraOrn;
      if (input.phone !== undefined) updateData.phone = input.phone;
      if (input.email !== undefined) updateData.email = input.email;
      if (input.address !== undefined) updateData.address = input.address;
      if (input.emirate !== undefined) updateData.emirate = input.emirate;
      if (input.logoUrl !== undefined) updateData.logoUrl = input.logoUrl;
      updateData.updatedAt = new Date();

      await db
        .update(tenants)
        .set(updateData)
        .where(eq(tenants.id, ctx.tenantId));

      return { ok: true };
    }),

  getReminderSettings: adminProcedure.query(async ({ ctx }) => {
    if (!ctx.tenantId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "No tenant selected",
      });
    }

    const company = await db.query.tenants.findFirst({
      where: eq(tenants.id, ctx.tenantId),
    });

    if (!company) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Tenant not found" });
    }

    return {
      remindersEnabled: company.remindersEnabled ?? true,
      chequeReminderDays: (company.chequeReminderDays ?? [3, 7]) as number[],
      contractReminderDays: (company.contractReminderDays ?? [7, 15, 30, 60, 90]) as number[],
    };
  }),

  updateReminderSettings: adminProcedure
    .input(reminderSettingsSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No tenant selected",
        });
      }

      await db
        .update(tenants)
        .set({
          remindersEnabled: input.remindersEnabled,
          chequeReminderDays: input.chequeReminderDays,
          contractReminderDays: input.contractReminderDays,
          updatedAt: new Date(),
        })
        .where(eq(tenants.id, ctx.tenantId));

      return { ok: true };
    }),
});
