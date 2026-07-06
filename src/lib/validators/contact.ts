import { z } from "zod"

export const ownerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  emiratesId: z.string().optional().nullable(),
  passportNo: z.string().optional().nullable(),
  nationality: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  bankName: z.string().optional().nullable(),
  bankIban: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export const ownerCreateSchema = ownerSchema

export const ownerUpdateSchema = ownerSchema
  .partial()
  .extend({
    id: z.string().uuid(),
  })

export const ownerListSchema = z.object({
  page: z.coerce.number().int().gte(1).default(1),
  pageSize: z.coerce.number().int().gte(1).lte(100).default(20),
  search: z.string().optional(),
  sortBy: z.enum(["createdAt", "name"]).default("createdAt"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
})

export const tenantSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  emiratesId: z.string().optional().nullable(),
  passportNo: z.string().optional().nullable(),
  nationality: z.string().optional().nullable(),
  companyName: z.string().optional().nullable(),
  emergencyContact: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  // Screening & Employment
  photoUrl: z.string().optional().nullable(),
  visaStatus: z.enum(["valid", "expired", "in_process", "cancelled"]).optional().nullable(),
  visaExpiry: z.coerce.date().optional().nullable(),
  visaUid: z.string().optional().nullable(),
  salaryRange: z.enum(["below_5k", "5k_10k", "10k_20k", "20k_50k", "above_50k"]).optional().nullable(),
  employerName: z.string().optional().nullable(),
  employerPhone: z.string().optional().nullable(),
  previousAddress: z.string().optional().nullable(),
  previousLandlord: z.string().optional().nullable(),
  previousLandlordPhone: z.string().optional().nullable(),
  blacklisted: z.boolean().default(false),
  blacklistReason: z.string().optional().nullable(),
  screeningStatus: z.enum(["pending", "approved", "rejected", "waived"]).default("pending"),
  screeningDate: z.coerce.date().optional().nullable(),
  screeningNotes: z.string().optional().nullable(),
})

export const tenantCreateSchema = tenantSchema

export const tenantUpdateSchema = tenantSchema
  .partial()
  .extend({
    id: z.string().uuid(),
  })

export const tenantListSchema = z.object({
  page: z.coerce.number().int().gte(1).default(1),
  pageSize: z.coerce.number().int().gte(1).lte(100).default(20),
  search: z.string().optional(),
  sortBy: z.enum(["createdAt", "name"]).default("createdAt"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
  blacklisted: z.boolean().optional(),
  screeningStatus: z.enum(["pending", "approved", "rejected", "waived"]).optional(),
})

export type Owner = z.infer<typeof ownerSchema>
export type OwnerCreate = z.infer<typeof ownerCreateSchema>
export type OwnerUpdate = z.infer<typeof ownerUpdateSchema>
export type OwnerListInput = z.infer<typeof ownerListSchema>

export type PropertyTenant = z.infer<typeof tenantSchema>
export type PropertyTenantCreate = z.infer<typeof tenantCreateSchema>
export type PropertyTenantUpdate = z.infer<typeof tenantUpdateSchema>
export type PropertyTenantListInput = z.infer<typeof tenantListSchema>
