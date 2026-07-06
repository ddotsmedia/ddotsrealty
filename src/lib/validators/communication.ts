import { z } from "zod"

export const communicationCreateSchema = z.object({
  entityType: z.enum(["property_tenant", "owner", "lead", "staff"]).default("property_tenant"),
  entityId: z.string().uuid().nullish(),
  channel: z.enum(["whatsapp", "email", "phone", "sms", "portal", "in_person"]).default("whatsapp"),
  direction: z.enum(["inbound", "outbound"]).default("outbound"),
  subject: z.string().optional(),
  content: z.string().optional(),
  status: z.enum(["sent", "delivered", "read", "failed"]).default("sent"),
})

export const communicationListSchema = z.object({
  page: z.coerce.number().int().gte(1).default(1),
  pageSize: z.coerce.number().int().gte(1).lte(100).default(30),
  entityType: z.string().optional(),
  channel: z.string().optional(),
  search: z.string().optional(),
})

export type CommunicationCreate = z.infer<typeof communicationCreateSchema>
export type CommunicationListInput = z.infer<typeof communicationListSchema>
