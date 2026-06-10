import { z } from "zod"

export const staffCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional().nullable(),
  role: z.enum(["admin", "manager", "broker", "accountant", "viewer"]),
  reraBrn: z.string().optional().nullable(),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

export const staffUpdateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).optional(),
  phone: z.string().optional().nullable(),
  role: z.enum(["admin", "manager", "broker", "accountant", "viewer"]).optional(),
  reraBrn: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
})

export const staffListSchema = z.object({
  page: z.coerce.number().int().gte(1).default(1),
  pageSize: z.coerce.number().int().gte(1).lte(100).default(20),
  search: z.string().optional(),
  role: z.enum(["admin", "manager", "broker", "accountant", "viewer"]).optional(),
})

export type StaffCreate = z.infer<typeof staffCreateSchema>
export type StaffUpdate = z.infer<typeof staffUpdateSchema>
export type StaffListInput = z.infer<typeof staffListSchema>
