import { z } from "zod"

export const parkingBaseSchema = z.object({
  propertyId: z.string().uuid("Property is required"),
  slotNumber: z.string().max(50).optional(),
  floorLevel: z.string().max(50).optional(),
  type: z.enum(["covered", "uncovered", "basement", "valet"]).default("covered"),
  assignedTo: z.string().uuid().nullish(),
  contractId: z.string().uuid().nullish(),
  vehiclePlate: z.string().max(50).optional(),
  vehicleMake: z.string().max(100).optional(),
  isAvailable: z.boolean().default(true),
  notes: z.string().optional(),
})

export const parkingCreateSchema = parkingBaseSchema

export const parkingUpdateSchema = parkingBaseSchema
  .partial()
  .extend({
    id: z.string().uuid(),
  })

export const parkingAssignSchema = z.object({
  id: z.string().uuid(),
  assignedTo: z.string().uuid(),
  contractId: z.string().uuid().nullish(),
  vehiclePlate: z.string().max(50).optional(),
  vehicleMake: z.string().max(100).optional(),
})

export const parkingUnassignSchema = z.object({
  id: z.string().uuid(),
})

export const parkingListSchema = z.object({
  page: z.coerce.number().int().gte(1).default(1),
  pageSize: z.coerce.number().int().gte(1).lte(100).default(20),
  type: z.string().optional(),
  propertyId: z.string().uuid().optional(),
  isAvailable: z.boolean().optional(),
})

export type ParkingBase = z.infer<typeof parkingBaseSchema>
export type ParkingCreate = z.infer<typeof parkingCreateSchema>
export type ParkingUpdate = z.infer<typeof parkingUpdateSchema>
export type ParkingAssign = z.infer<typeof parkingAssignSchema>
export type ParkingUnassign = z.infer<typeof parkingUnassignSchema>
export type ParkingListInput = z.infer<typeof parkingListSchema>
