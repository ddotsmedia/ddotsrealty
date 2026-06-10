import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';

export const owners = pgTable('owners', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 30 }),
  email: varchar('email', { length: 255 }),
  emiratesId: text('emirates_id'),
  passportNo: text('passport_no'),
  nationality: varchar('nationality', { length: 100 }),
  address: text('address'),
  bankName: varchar('bank_name', { length: 255 }),
  bankIban: varchar('bank_iban', { length: 40 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const propertyTenants = pgTable('property_tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 30 }),
  email: varchar('email', { length: 255 }),
  emiratesId: text('emirates_id'),
  passportNo: text('passport_no'),
  nationality: varchar('nationality', { length: 100 }),
  companyName: varchar('company_name', { length: 255 }),
  emergencyContact: varchar('emergency_contact', { length: 255 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
