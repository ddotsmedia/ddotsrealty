import { pgTable, uuid, varchar, text, numeric, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { leadSourceEnum, leadStatusEnum, leadActivityTypeEnum } from './enums';

export const leads = pgTable('leads', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  listingId: uuid('listing_id'),
  assignedTo: uuid('assigned_to'),
  name: varchar('name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 30 }),
  email: varchar('email', { length: 255 }),
  source: leadSourceEnum('source').default('website').notNull(),
  status: leadStatusEnum('status').notNull().default('new'),
  budgetMin: numeric('budget_min', { precision: 12, scale: 2 }),
  budgetMax: numeric('budget_max', { precision: 12, scale: 2 }),
  requirements: jsonb('requirements').$type<Record<string, unknown>>(),
  nextFollowUp: timestamp('next_follow_up'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const leadActivities = pgTable('lead_activities', {
  id: uuid('id').primaryKey().defaultRandom(),
  leadId: uuid('lead_id').notNull(),
  userId: uuid('user_id'),
  type: leadActivityTypeEnum('type').notNull(),
  content: text('content'),
  scheduledAt: timestamp('scheduled_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
