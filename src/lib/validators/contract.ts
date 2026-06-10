import { z } from "zod"

export const contractCreateSchema = z.object({
  propertyId: z.string().uuid(),
  propertyTenantId: z.string().uuid(),
  ownerId: z.string().uuid().optional().nullish(),
  contractType: z.enum(["new", "renewal"]).default("new"),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  rentAmount: z.coerce.number().positive(),
  securityDeposit: z.coerce.number().optional(),
  commissionPct: z.coerce.number().optional(),
  paymentMode: z.enum(["cheques", "bank_transfer", "cash", "mixed"]).default("cheques"),
  numCheques: z.coerce.number().int().min(1).max(12).default(1),
  ejariNumber: z.string().optional(),
  tawtheeqNumber: z.string().optional(),
  contractDocUrl: z.string().optional(),
  notes: z.string().optional(),
})

export const contractUpdateSchema = contractCreateSchema
  .partial()
  .extend({
    id: z.string().uuid(),
  })

export const contractListSchema = z.object({
  page: z.coerce.number().int().gte(1).default(1),
  pageSize: z.coerce.number().int().gte(1).lte(100).default(20),
  search: z.string().optional(),
  status: z.string().optional(),
  sortBy: z.enum(["createdAt", "endDate", "rentAmount"]).default("createdAt"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
})

export type ContractCreate = z.infer<typeof contractCreateSchema>
export type ContractUpdate = z.infer<typeof contractUpdateSchema>
export type ContractListInput = z.infer<typeof contractListSchema>
