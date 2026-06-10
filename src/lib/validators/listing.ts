import { z } from "zod"

export const listingCreateSchema = z.object({
  propertyId: z.string().uuid(),
  brokerId: z.string().uuid().optional().nullish(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  listingType: z.enum(["rent", "sale"]).default("rent"),
  price: z.coerce.number().optional(),
  isFeatured: z.boolean().default(false),
  featuredUntil: z.coerce.date().optional(),
  trakheesiPermit: z.string().optional(),
  permitExpiry: z.coerce.date().optional(),
  status: z.enum(["draft", "active", "paused", "expired", "sold", "rented"]).default("draft"),
  expiresAt: z.coerce.date().optional(),
})

export const listingUpdateSchema = listingCreateSchema
  .partial()
  .extend({
    id: z.string().uuid(),
  })

export const listingStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["draft", "active", "paused", "expired", "sold", "rented"]),
})

export const listingListSchema = z.object({
  page: z.coerce.number().int().gte(1).default(1),
  pageSize: z.coerce.number().int().gte(1).lte(100).default(20),
  search: z.string().optional(),
  status: z.string().optional(),
  listingType: z.string().optional(),
  sortBy: z.enum(["createdAt", "price", "publishedAt"]).default("createdAt"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
})

export type ListingCreate = z.infer<typeof listingCreateSchema>
export type ListingUpdate = z.infer<typeof listingUpdateSchema>
export type ListingStatusInput = z.infer<typeof listingStatusSchema>
export type ListingListInput = z.infer<typeof listingListSchema>
