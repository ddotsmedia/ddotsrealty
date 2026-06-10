import { z } from "zod";

export const documentCreateSchema = z.object({
  entityType: z.enum([
    "property",
    "contract",
    "owner",
    "tenant",
    "broker",
    "company",
    "maintenance",
  ]),
  entityId: z.string().uuid(),
  docType: z.enum([
    "trade_license",
    "rera_card",
    "ejari",
    "tawtheeq",
    "title_deed",
    "passport",
    "emirates_id",
    "contract",
    "noc",
    "oqood",
    "invoice",
    "other",
  ]),
  name: z.string().min(1),
  fileUrl: z.string().min(1),
  fileSize: z.coerce.number().int().optional(),
  mimeType: z.string().optional(),
  expiryDate: z.coerce.date().optional(),
});

export type DocumentCreate = z.infer<typeof documentCreateSchema>;

export const documentListSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().default(30),
  entityType: z.enum([
    "property",
    "contract",
    "owner",
    "tenant",
    "broker",
    "company",
    "maintenance",
  ]).optional(),
  docType: z.enum([
    "trade_license",
    "rera_card",
    "ejari",
    "tawtheeq",
    "title_deed",
    "passport",
    "emirates_id",
    "contract",
    "noc",
    "oqood",
    "invoice",
    "other",
  ]).optional(),
  search: z.string().optional(),
});

export type DocumentList = z.infer<typeof documentListSchema>;
