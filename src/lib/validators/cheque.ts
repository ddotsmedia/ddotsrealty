import { z } from "zod"

export const chequeUpdateStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum([
    "pending",
    "collected",
    "in_custody",
    "with_owner",
    "pending_deposit",
    "deposited",
    "cleared",
    "bounced",
    "replaced",
    "postponed",
    "returned",
    "cancelled",
    "stale",
  ]),
  depositedDate: z.coerce.date().optional(),
  clearedDate: z.coerce.date().optional(),
  bounceReason: z.string().optional(),
  chequeImageUrl: z.string().optional(),
})

export const chequeListSchema = z.object({
  page: z.coerce.number().int().gte(1).default(1),
  pageSize: z.coerce.number().int().gte(1).lte(200).default(50),
  status: z.string().optional(),
  propertyId: z.string().uuid().optional(),
  propertyTenantId: z.string().uuid().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  sortBy: z.enum(["dueDate", "amount"]).default("dueDate"),
  sortDir: z.enum(["asc", "desc"]).default("asc"),
  direction: z.string().optional(),
  dueOn: z.coerce.date().optional(),
})

export const chequeCalendarSchema = z.object({
  year: z.coerce.number().int(),
  month: z.coerce.number().int().min(1).max(12),
})

export const manualChequeSchema = z.object({
  contractId: z.string().uuid().optional(),
  propertyId: z.string().uuid().optional(),
  propertyTenantId: z.string().uuid().optional(),
  ownerId: z.string().uuid().optional(),
  chequeNumber: z.string().optional(),
  bankName: z.string().optional(),
  amount: z.coerce.number().positive(),
  dueDate: z.coerce.date(),
})

export const chequePostponeSchema = z.object({
  id: z.string().uuid(),
  newDueDate: z.coerce.date(),
  note: z.string().optional(),
})

export const chequeDetailsSchema = z.object({
  id: z.string().uuid(),
  direction: z.enum(["receivable", "payable"]).optional(),
  bankAccountId: z.string().uuid().nullish(),
  custodyHolder: z.string().nullish(),
  custodyDate: z.coerce.date().nullish(),
  penaltyAmount: z.coerce.number().nullish(),
  receiptNumber: z.string().nullish(),
})

export type ChequeUpdateStatus = z.infer<typeof chequeUpdateStatusSchema>
export type ChequeListInput = z.infer<typeof chequeListSchema>
export type ChequeCalendarInput = z.infer<typeof chequeCalendarSchema>
export type ManualChequeInput = z.infer<typeof manualChequeSchema>
export type ChequePostponeInput = z.infer<typeof chequePostponeSchema>
export type ChequeDetailsInput = z.infer<typeof chequeDetailsSchema>
