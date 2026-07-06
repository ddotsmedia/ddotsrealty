import { z } from "zod"

export const clearanceCreateSchema = z.object({
  contractId: z.string().uuid(),
  propertyId: z.string().uuid().nullish(),
  propertyTenantId: z.string().uuid().nullish(),
  noticeDate: z.coerce.date().nullish(),
  noticePeriodDays: z.coerce.number().nullish(),
  plannedMoveOut: z.coerce.date().nullish(),
  depositAmount: z.coerce.number().nullish(),
})

export const clearanceUpdateSchema = z
  .object({
    id: z.string().uuid(),
    noticeDate: z.coerce.date().nullish(),
    noticePeriodDays: z.coerce.number().nullish(),
    plannedMoveOut: z.coerce.date().nullish(),
    actualMoveOut: z.coerce.date().nullish(),
    depositAmount: z.coerce.number().nullish(),
    damageDeductions: z.coerce.number().nullish(),
    outstandingRent: z.coerce.number().nullish(),
    outstandingUtility: z.coerce.number().nullish(),
    outstandingMaintenance: z.coerce.number().nullish(),
    penaltyAmount: z.coerce.number().nullish(),
    settlementStatus: z.enum(["pending", "partial", "settled"]).optional(),
    depositDeductions: z.coerce.number().nullish(),
    depositRefundAmount: z.coerce.number().nullish(),
    depositRefundMethod: z
      .enum(["cheque", "bank_transfer", "cash"])
      .nullish(),
    depositRefundDate: z.coerce.date().nullish(),
    depositRefundRef: z.string().optional(),
    chequesReturned: z.boolean().optional(),
    dewaCleared: z.boolean().optional(),
    ejariCancelled: z.boolean().optional(),
    keysReturned: z.boolean().optional(),
    clearanceStatus: z
      .enum([
        "in_progress",
        "pending_payment",
        "pending_inspection",
        "pending_dewa",
        "pending_ejari",
        "completed",
      ])
      .optional(),
  })
  .partial()
  .required({ id: true })

export const clearanceListSchema = z.object({
  page: z.coerce.number().int().gte(1).default(1),
  pageSize: z.coerce.number().int().gte(1).lte(100).default(20),
  clearanceStatus: z.string().optional(),
})

export type ClearanceCreate = z.infer<typeof clearanceCreateSchema>
export type ClearanceUpdate = z.infer<typeof clearanceUpdateSchema>
export type ClearanceListInput = z.infer<typeof clearanceListSchema>
