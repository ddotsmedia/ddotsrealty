import { z } from "zod"

export const occupantCreateSchema = z.object({
  contractId: z.string().uuid(),
  name: z.string().min(1, "Name is required"),
  emiratesId: z.string().optional().nullable(),
  relationship: z.enum(["spouse", "child", "parent", "sibling", "domestic_help", "other"]).default("other"),
  nationality: z.string().optional().nullable(),
})

export const occupantUpdateSchema = occupantCreateSchema
  .partial()
  .extend({
    id: z.string().uuid(),
  })

export const occupantListSchema = z.object({
  contractId: z.string().uuid(),
})

export type OccupantCreate = z.infer<typeof occupantCreateSchema>
export type OccupantUpdate = z.infer<typeof occupantUpdateSchema>
export type OccupantListInput = z.infer<typeof occupantListSchema>
