import { z } from "zod"

export const bankAccountCreateSchema = z.object({
  bankName: z.string().min(1, "Bank name is required"),
  accountNumber: z.string().optional(),
  iban: z.string().optional(),
  swiftCode: z.string().optional(),
  branch: z.string().optional(),
  isDefault: z.boolean().default(false),
})

export const bankAccountUpdateSchema = bankAccountCreateSchema.partial().extend({
  id: z.string().uuid(),
})

export type BankAccountCreateInput = z.infer<typeof bankAccountCreateSchema>
export type BankAccountUpdateInput = z.infer<typeof bankAccountUpdateSchema>
