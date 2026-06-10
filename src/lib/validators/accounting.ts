import { z } from "zod"

export const transactionCreateSchema = z.object({
  type: z.enum(["rent_income", "commission", "maintenance_cost", "refund", "deposit", "other"]),
  amount: z.coerce.number().positive(),
  vatAmount: z.coerce.number().optional().nullable(),
  currency: z.string().default("AED"),
  referenceType: z.string().optional(),
  referenceId: z.string().uuid().optional().nullable(),
  fromEntity: z.string().optional(),
  toEntity: z.string().optional(),
  paymentMethod: z.enum(["cheque", "bank_transfer", "cash", "card", "online"]).optional().nullable(),
  status: z.enum(["pending", "completed", "failed", "refunded"]).default("completed"),
  notes: z.string().optional(),
  transactionDate: z.coerce.date().optional(),
})

export const transactionListSchema = z.object({
  page: z.coerce.number().int().gte(1).default(1),
  pageSize: z.coerce.number().int().gte(1).lte(200).default(20),
  search: z.string().optional(),
  type: z.string().optional(),
  status: z.string().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  sortBy: z.enum(["transactionDate", "amount"]).default("transactionDate"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
})

export const commissionListSchema = z.object({
  page: z.coerce.number().int().gte(1).default(1),
  pageSize: z.coerce.number().int().gte(1).lte(200).default(20),
  status: z.string().optional(),
  sortBy: z.enum(["createdAt", "commissionAmount"]).default("createdAt"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
})

export const commissionStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["pending", "approved", "paid"]),
})

export type TransactionCreate = z.infer<typeof transactionCreateSchema>
export type TransactionListInput = z.infer<typeof transactionListSchema>
export type CommissionListInput = z.infer<typeof commissionListSchema>
export type CommissionStatusInput = z.infer<typeof commissionStatusSchema>
