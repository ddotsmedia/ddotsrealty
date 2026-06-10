import { pgTable, uuid, varchar, text, numeric, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core';
import { maintenanceCategoryEnum, maintenancePriorityEnum, maintenanceStatusEnum } from './enums';

export const maintenanceRequests = pgTable('maintenance_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  propertyId: uuid('property_id').notNull(),
  propertyTenantId: uuid('property_tenant_id'),
  reportedBy: uuid('reported_by'),
  assignedTo: varchar('assigned_to', { length: 255 }),
  category: maintenanceCategoryEnum('category').notNull().default('other'),
  priority: maintenancePriorityEnum('priority').notNull().default('medium'),
  status: maintenanceStatusEnum('status').notNull().default('reported'),
  description: text('description').notNull(),
  costEstimate: numeric('cost_estimate', { precision: 12, scale: 2 }),
  costActual: numeric('cost_actual', { precision: 12, scale: 2 }),
  costApproved: boolean('cost_approved').default(false).notNull(),
  costApprovedBy: uuid('cost_approved_by'),
  beforePhotos: jsonb('before_photos').$type<string[]>().default([]),
  afterPhotos: jsonb('after_photos').$type<string[]>().default([]),
  invoiceUrl: text('invoice_url'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
