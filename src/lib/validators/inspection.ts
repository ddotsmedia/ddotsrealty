import { z } from "zod"

export const inspectionItemSchema = z.object({
  room: z.enum([
    "living_room",
    "bedroom_master",
    "bedroom_2",
    "bedroom_3",
    "kitchen",
    "bathroom_master",
    "bathroom_2",
    "bathroom_3",
    "balcony",
    "entrance",
    "store",
    "laundry",
    "garage",
    "garden",
    "common_area",
    "other",
  ]).default("other"),
  item: z.string().min(1, "Item is required"),
  condition: z.enum(["new", "good", "fair", "damaged", "missing"]).default("good"),
  notes: z.string().optional(),
  photos: z.array(z.string()).default([]),
  deductionAmount: z.coerce.number().nonnegative().nullish(),
})

export const inspectionBaseSchema = z.object({
  propertyId: z.string().uuid("Property is required"),
  contractId: z.string().uuid().nullish(),
  propertyTenantId: z.string().uuid().nullish(),
  type: z.enum(["move_in", "move_out", "periodic", "complaint"]).default("move_in"),
  inspectionDate: z.coerce.date().nullish(),
  inspectorName: z.string().optional(),
  inspectorRole: z.string().optional(),
  overallCondition: z.enum(["excellent", "good", "fair", "poor"]).nullish(),
  notes: z.string().optional(),
  tenantSigned: z.boolean().default(false),
  items: z.array(inspectionItemSchema).default([]),
})

export const inspectionCreateSchema = inspectionBaseSchema

export const inspectionUpdateSchema = inspectionBaseSchema
  .partial()
  .extend({
    id: z.string().uuid(),
  })

export const inspectionItemCreateSchema = z.object({
  inspectionId: z.string().uuid(),
  room: z.enum([
    "living_room",
    "bedroom_master",
    "bedroom_2",
    "bedroom_3",
    "kitchen",
    "bathroom_master",
    "bathroom_2",
    "bathroom_3",
    "balcony",
    "entrance",
    "store",
    "laundry",
    "garage",
    "garden",
    "common_area",
    "other",
  ]),
  item: z.string().min(1),
  condition: z.enum(["new", "good", "fair", "damaged", "missing"]),
  notes: z.string().optional(),
  photos: z.array(z.string()).default([]),
  deductionAmount: z.coerce.number().nonnegative().nullish(),
})

export const inspectionListSchema = z.object({
  page: z.coerce.number().int().gte(1).default(1),
  pageSize: z.coerce.number().int().gte(1).lte(100).default(20),
  type: z.string().optional(),
  propertyId: z.string().uuid().optional(),
})

export type InspectionBase = z.infer<typeof inspectionBaseSchema>
export type InspectionCreate = z.infer<typeof inspectionCreateSchema>
export type InspectionUpdate = z.infer<typeof inspectionUpdateSchema>
export type InspectionItemCreate = z.infer<typeof inspectionItemCreateSchema>
export type InspectionListInput = z.infer<typeof inspectionListSchema>
