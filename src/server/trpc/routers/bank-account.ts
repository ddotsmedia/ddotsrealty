import { TRPCError } from "@trpc/server"
import { z } from "zod"
import { eq, and, asc, desc } from "drizzle-orm"
import { createTRPCRouter, adminProcedure, tenantProcedure } from "@/server/trpc/trpc"
import { db } from "@/server/db"
import { bankAccounts } from "@/server/db/schema"
import {
  bankAccountCreateSchema,
  bankAccountUpdateSchema,
} from "@/lib/validators/bank-account"

export const bankAccountRouter = createTRPCRouter({
  list: tenantProcedure.query(async ({ ctx }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const conditions: any[] = []
    if (ctx.role !== "super_admin" || ctx.tenantId) {
      conditions.push(eq(bankAccounts.tenantId, ctx.tenantId!))
    }

    const rows = await db
      .select()
      .from(bankAccounts)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(bankAccounts.isDefault), asc(bankAccounts.bankName))

    return rows
  }),

  selectable: tenantProcedure.query(async ({ ctx }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const conditions: any[] = []
    if (ctx.role !== "super_admin" || ctx.tenantId) {
      conditions.push(eq(bankAccounts.tenantId, ctx.tenantId!))
    }

    const rows = await db
      .select({
        id: bankAccounts.id,
        bankName: bankAccounts.bankName,
        accountNumber: bankAccounts.accountNumber,
      })
      .from(bankAccounts)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(bankAccounts.isDefault), asc(bankAccounts.bankName))

    return rows.map((row) => ({
      id: row.id,
      label: `${row.bankName}${row.accountNumber ? ` — ${row.accountNumber}` : ""}`,
    }))
  }),

  create: adminProcedure
    .input(bankAccountCreateSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No tenant selected" })
      }

      // If setting as default, unset all existing defaults first
      if (input.isDefault) {
        await db
          .update(bankAccounts)
          .set({ isDefault: false, updatedAt: new Date() })
          .where(eq(bankAccounts.tenantId, ctx.tenantId))
      }

      const [inserted] = await db
        .insert(bankAccounts)
        .values({
          tenantId: ctx.tenantId,
          bankName: input.bankName,
          accountNumber: input.accountNumber ?? null,
          iban: input.iban ?? null,
          swiftCode: input.swiftCode ?? null,
          branch: input.branch ?? null,
          isDefault: input.isDefault,
        })
        .returning({ id: bankAccounts.id })

      return { id: inserted.id }
    }),

  update: adminProcedure
    .input(bankAccountUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No tenant selected" })
      }

      const { id, isDefault, ...rest } = input

      // If setting as default, unset all existing defaults first
      if (isDefault === true) {
        await db
          .update(bankAccounts)
          .set({ isDefault: false, updatedAt: new Date() })
          .where(eq(bankAccounts.tenantId, ctx.tenantId))
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: any = { updatedAt: new Date() }
      if (rest.bankName !== undefined) updateData.bankName = rest.bankName
      if (rest.accountNumber !== undefined) updateData.accountNumber = rest.accountNumber
      if (rest.iban !== undefined) updateData.iban = rest.iban
      if (rest.swiftCode !== undefined) updateData.swiftCode = rest.swiftCode
      if (rest.branch !== undefined) updateData.branch = rest.branch
      if (isDefault !== undefined) updateData.isDefault = isDefault

      await db
        .update(bankAccounts)
        .set(updateData)
        .where(
          and(
            eq(bankAccounts.id, id),
            eq(bankAccounts.tenantId, ctx.tenantId)
          )
        )

      return { ok: true }
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No tenant selected" })
      }

      await db
        .delete(bankAccounts)
        .where(
          and(
            eq(bankAccounts.id, input.id),
            eq(bankAccounts.tenantId, ctx.tenantId)
          )
        )

      return { ok: true }
    }),

  setDefault: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No tenant selected" })
      }

      // Unset all defaults for this tenant
      await db
        .update(bankAccounts)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(eq(bankAccounts.tenantId, ctx.tenantId))

      // Set the selected one as default
      await db
        .update(bankAccounts)
        .set({ isDefault: true, updatedAt: new Date() })
        .where(
          and(
            eq(bankAccounts.id, input.id),
            eq(bankAccounts.tenantId, ctx.tenantId)
          )
        )

      return { ok: true }
    }),
})
