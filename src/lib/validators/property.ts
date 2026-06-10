import { z } from "zod"

export const propertyBaseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  type: z.enum([
    "apartment",
    "villa",
    "townhouse",
    "office",
    "warehouse",
    "land",
    "building",
    "penthouse",
    "studio",
  ]),
  purpose: z.enum(["rent", "sale", "both"]).default("rent"),
  status: z.enum([
    "available",
    "rented",
    "sold",
    "under_maintenance",
    "off_market",
  ]).default("available"),
  bedrooms: z.coerce.number().int().gte(0).nullish(),
  bathrooms: z.coerce.number().int().gte(0).nullish(),
  areaSqft: z.coerce.number().optional().nullable(),
  price: z.coerce.number().optional().nullable(),
  priceFrequency: z.enum(["yearly", "monthly", "weekly", "daily", "total"]).optional(),
  currency: z.string().default("AED"),
  address: z.string().optional().nullable(),
  buildingName: z.string().optional().nullable(),
  community: z.string().optional().nullable(),
  emirate: z.enum([
    "abu_dhabi",
    "dubai",
    "sharjah",
    "ajman",
    "umm_al_quwain",
    "ras_al_khaimah",
    "fujairah",
  ]).optional().nullable(),
  latitude: z.coerce.number().optional().nullable(),
  longitude: z.coerce.number().optional().nullable(),
  amenities: z.array(z.string()).default([]),
  ownerId: z.string().uuid().optional().nullable(),
  assignedBroker: z.string().uuid().optional().nullable(),
  referenceNo: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export const propertyCreateSchema = propertyBaseSchema

export const propertyUpdateSchema = propertyBaseSchema
  .partial()
  .extend({
    id: z.string().uuid(),
  })

export const propertyListSchema = z.object({
  page: z.coerce.number().int().gte(1).default(1),
  pageSize: z.coerce.number().int().gte(1).lte(100).default(12),
  search: z.string().optional(),
  type: z.string().optional(),
  status: z.string().optional(),
  purpose: z.string().optional(),
  community: z.string().optional(),
  emirate: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  bedrooms: z.coerce.number().int().optional(),
  sortBy: z.enum(["createdAt", "price", "title"]).default("createdAt"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
})

export type PropertyBase = z.infer<typeof propertyBaseSchema>
export type PropertyCreate = z.infer<typeof propertyCreateSchema>
export type PropertyUpdate = z.infer<typeof propertyUpdateSchema>
export type PropertyListInput = z.infer<typeof propertyListSchema>
