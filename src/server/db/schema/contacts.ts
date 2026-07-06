import { pgTable, uuid, varchar, text, timestamp, boolean } from 'drizzle-orm/pg-core';
import {
  visaStatusEnum,
  salaryRangeEnum,
  screeningStatusEnum,
} from './enums';

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
  photoUrl: text('photo_url'),
  visaStatus: visaStatusEnum('visa_status'),
  visaExpiry: timestamp('visa_expiry'),
  visaUid: varchar('visa_uid', { length: 50 }),
  salaryRange: salaryRangeEnum('salary_range'),
  employerName: varchar('employer_name', { length: 255 }),
  employerPhone: varchar('employer_phone', { length: 30 }),
  previousAddress: text('previous_address'),
  previousLandlord: varchar('previous_landlord', { length: 255 }),
  previousLandlordPhone: varchar('previous_landlord_phone', { length: 30 }),
  blacklisted: boolean('blacklisted').default(false).notNull(),
  blacklistReason: text('blacklist_reason'),
  screeningStatus: screeningStatusEnum('screening_status')
    .default('pending')
    .notNull(),
  screeningDate: timestamp('screening_date'),
  screeningNotes: text('screening_notes'),
  portalLoginEnabled: boolean('portal_login_enabled').default(false).notNull(),
  portalPasswordHash: text('portal_password_hash'),
  portalLastLogin: timestamp('portal_last_login'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
