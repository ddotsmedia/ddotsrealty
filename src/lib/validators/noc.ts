import { z } from "zod"

export const nocCreateSchema = z.object({
  propertyTenantId: z.string().uuid().nullish(),
  contractId: z.string().uuid().nullish(),
  nocType: z
    .enum([
      "subletting",
      "renovation",
      "pet",
      "satellite_dish",
      "business_activity",
      "visa_sponsorship",
      "parking",
      "move_in",
      "move_out",
      "other",
    ])
    .default("other"),
  description: z.string().optional(),
})

export const nocReviewSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["under_review", "approved", "rejected"]),
  rejectionReason: z.string().optional(),
  validUntil: z.coerce.date().nullish(),
  nocDocumentUrl: z.string().optional(),
})

export const nocListSchema = z.object({
  page: z.coerce.number().int().gte(1).default(1),
  pageSize: z.coerce.number().int().gte(1).lte(100).default(20),
  status: z.string().optional(),
  nocType: z.string().optional(),
})

export type NocCreate = z.infer<typeof nocCreateSchema>
export type NocReview = z.infer<typeof nocReviewSchema>
export type NocListInput = z.infer<typeof nocListSchema>
