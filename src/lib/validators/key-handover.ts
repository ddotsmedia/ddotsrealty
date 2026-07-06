import { z } from "zod"

export const keyHandoverKeySchema = z.object({
  type: z.string().min(1, "Key type is required"),
  quantity: z.coerce.number().int().min(1).default(1),
  condition: z.string().optional(),
})

export const keyHandoverBaseSchema = z.object({
  propertyId: z.string().uuid("Property is required"),
  contractId: z.string().uuid().nullish(),
  propertyTenantId: z.string().uuid().nullish(),
  type: z.enum(["handover", "return"]).default("handover"),
  handoverDate: z.coerce.date().nullish(),
  keys: z.array(keyHandoverKeySchema).default([]),
  receivedBy: z.string().optional(),
  handedBy: z.string().optional(),
  receiptSigned: z.boolean().default(false),
  notes: z.string().optional(),
})

export const keyHandoverCreateSchema = keyHandoverBaseSchema

export const keyHandoverUpdateSchema = keyHandoverBaseSchema
  .partial()
  .extend({
    id: z.string().uuid(),
  })

export const keyHandoverListSchema = z.object({
  page: z.coerce.number().int().gte(1).default(1),
  pageSize: z.coerce.number().int().gte(1).lte(100).default(20),
  type: z.string().optional(),
  propertyId: z.string().uuid().optional(),
})

export type KeyHandoverBase = z.infer<typeof keyHandoverBaseSchema>
export type KeyHandoverCreate = z.infer<typeof keyHandoverCreateSchema>
export type KeyHandoverUpdate = z.infer<typeof keyHandoverUpdateSchema>
export type KeyHandoverListInput = z.infer<typeof keyHandoverListSchema>
