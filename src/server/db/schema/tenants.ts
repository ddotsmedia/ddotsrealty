import { pgTable, uuid, varchar, text, timestamp, boolean, jsonb, uniqueIndex } from 'drizzle-orm/pg-core';
import { tenantTypeEnum, subscriptionTierEnum, emirateEnum } from './enums';

export const tenants = pgTable(
  'tenants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    type: tenantTypeEnum('type').notNull().default('agency'),
    tradeLicense: varchar('trade_license', { length: 100 }),
    reraOrn: varchar('rera_orn', { length: 100 }),
    phone: varchar('phone', { length: 30 }),
    email: varchar('email', { length: 255 }),
    address: text('address'),
    emirate: emirateEnum('emirate'),
    logoUrl: text('logo_url'),
    subscription: subscriptionTierEnum('subscription').default('free').notNull(),
    subscriptionExpiresAt: timestamp('subscription_expires_at'),
    isActive: boolean('is_active').default(true).notNull(),
    // Reminder automation settings
    remindersEnabled: boolean('reminders_enabled').default(true).notNull(),
    chequeReminderDays: jsonb('cheque_reminder_days').$type<number[]>().default([3, 7]).notNull(),
    contractReminderDays: jsonb('contract_reminder_days').$type<number[]>().default([7, 15, 30, 60, 90]).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('idx_tenants_slug').on(table.slug),
  ]
);
