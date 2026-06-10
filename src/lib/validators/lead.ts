import { z } from "zod"

export const leadCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  source: z.enum(["website", "whatsapp", "phone", "walk_in", "referral", "portal", "social"]).default("website"),
  status: z.enum(["new", "contacted", "qualified", "viewing", "negotiation", "won", "lost"]).default("new"),
  listingId: z.string().uuid().optional().nullable(),
  assignedTo: z.string().uuid().optional().nullable(),
  budgetMin: z.coerce.number().optional().nullable(),
  budgetMax: z.coerce.number().optional().nullable(),
  requirements: z.record(z.string(), z.any()).optional(),
  nextFollowUp: z.coerce.date().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export const leadUpdateSchema = leadCreateSchema
  .partial()
  .extend({
    id: z.string().uuid(),
  })

export const leadStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["new", "contacted", "qualified", "viewing", "negotiation", "won", "lost"]),
})

export const leadListSchema = z.object({
  page: z.coerce.number().int().gte(1).default(1),
  pageSize: z.coerce.number().int().gte(1).lte(100).default(20),
  search: z.string().optional(),
  status: z.string().optional(),
  source: z.string().optional(),
  assignedTo: z.string().uuid().optional(),
  sortBy: z.enum(["createdAt", "nextFollowUp"]).default("createdAt"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
})

export const leadActivitySchema = z.object({
  leadId: z.string().uuid(),
  type: z.enum(["call", "whatsapp", "email", "viewing", "meeting", "note"]),
  content: z.string().optional(),
  scheduledAt: z.coerce.date().optional().nullable(),
})

export type LeadCreate = z.infer<typeof leadCreateSchema>
export type LeadUpdate = z.infer<typeof leadUpdateSchema>
export type LeadStatus = z.infer<typeof leadStatusSchema>
export type LeadListInput = z.infer<typeof leadListSchema>
export type LeadActivity = z.infer<typeof leadActivitySchema>
