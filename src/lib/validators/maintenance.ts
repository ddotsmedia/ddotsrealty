import { z } from "zod"

export const maintenanceBaseSchema = z.object({
  propertyId: z.string().uuid("Property is required"),
  propertyTenantId: z.string().uuid().nullish(),
  category: z.enum([
    "plumbing",
    "electrical",
    "ac",
    "painting",
    "carpentry",
    "cleaning",
    "pest_control",
    "other",
  ]).default("other"),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  status: z.enum(["reported", "approved", "in_progress", "completed", "cancelled"]).default("reported"),
  description: z.string().min(1, "Description is required"),
  assignedTo: z.string().optional(),
  costEstimate: z.coerce.number().nonnegative().nullish(),
  beforePhotos: z.array(z.string()).default([]),
})

export const maintenanceCreateSchema = maintenanceBaseSchema

export const maintenanceUpdateSchema = maintenanceBaseSchema
  .partial()
  .extend({
    id: z.string().uuid(),
  })

export const maintenanceStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["reported", "approved", "in_progress", "completed", "cancelled"]),
  costActual: z.coerce.number().nonnegative().nullish(),
  afterPhotos: z.array(z.string()).optional(),
  invoiceUrl: z.string().optional(),
})

export const costApproveSchema = z.object({
  id: z.string().uuid(),
  costApproved: z.boolean(),
})

export const maintenanceListSchema = z.object({
  page: z.coerce.number().int().gte(1).default(1),
  pageSize: z.coerce.number().int().gte(1).lte(100).default(20),
  search: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  category: z.string().optional(),
  sortBy: z.enum(["createdAt", "priority"]).default("createdAt"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
})

export type MaintenanceBase = z.infer<typeof maintenanceBaseSchema>
export type MaintenanceCreate = z.infer<typeof maintenanceCreateSchema>
export type MaintenanceUpdate = z.infer<typeof maintenanceUpdateSchema>
export type MaintenanceStatus = z.infer<typeof maintenanceStatusSchema>
export type CostApprove = z.infer<typeof costApproveSchema>
export type MaintenanceListInput = z.infer<typeof maintenanceListSchema>
