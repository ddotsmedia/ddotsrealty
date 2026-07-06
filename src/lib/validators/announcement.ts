import { z } from "zod"

export const announcementCreateSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().optional(),
  targetType: z.enum(["all", "building", "community", "specific_tenants"]).default("all"),
  targetIds: z.array(z.string()).default([]),
  sentVia: z.array(z.string()).default([]),
})

export const announcementListSchema = z.object({
  page: z.coerce.number().int().gte(1).default(1),
  pageSize: z.coerce.number().int().gte(1).lte(100).default(20),
  search: z.string().optional(),
})

export type AnnouncementCreate = z.infer<typeof announcementCreateSchema>
export type AnnouncementListInput = z.infer<typeof announcementListSchema>
