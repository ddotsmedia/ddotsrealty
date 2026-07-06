import { z } from "zod"

export const utilityBaseSchema = z.object({
  propertyId: z.string().uuid("Property is required"),
  contractId: z.string().uuid().nullish(),
  propertyTenantId: z.string().uuid().nullish(),
  utilityType: z.enum(["dewa", "aadc", "sewa", "fewa", "internet", "gas", "chiller"]).default("dewa"),
  accountNumber: z.string().max(100).optional(),
  premiseNumber: z.string().max(100).optional(),
  status: z.enum([
    "pending_activation",
    "active",
    "pending_deactivation",
    "deactivated",
    "clearance_pending",
    "cleared",
  ]).default("pending_activation"),
  activationDate: z.coerce.date().nullish(),
  deactivationDate: z.coerce.date().nullish(),
  securityDeposit: z.coerce.number().nonnegative().nullish(),
  depositRefunded: z.boolean().default(false),
  clearanceCertUrl: z.string().optional(),
  notes: z.string().optional(),
})

export const utilityCreateSchema = utilityBaseSchema

export const utilityUpdateSchema = utilityBaseSchema
  .partial()
  .extend({
    id: z.string().uuid(),
  })

export const utilityStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum([
    "pending_activation",
    "active",
    "pending_deactivation",
    "deactivated",
    "clearance_pending",
    "cleared",
  ]),
  clearanceCertUrl: z.string().optional(),
  depositRefunded: z.boolean().optional(),
})

export const utilityListSchema = z.object({
  page: z.coerce.number().int().gte(1).default(1),
  pageSize: z.coerce.number().int().gte(1).lte(100).default(20),
  utilityType: z.string().optional(),
  status: z.string().optional(),
  propertyId: z.string().uuid().optional(),
})

export type UtilityBase = z.infer<typeof utilityBaseSchema>
export type UtilityCreate = z.infer<typeof utilityCreateSchema>
export type UtilityUpdate = z.infer<typeof utilityUpdateSchema>
export type UtilityStatus = z.infer<typeof utilityStatusSchema>
export type UtilityListInput = z.infer<typeof utilityListSchema>
