import { pgTable, uuid, varchar, boolean, timestamp } from 'drizzle-orm/pg-core';

export const bankAccounts = pgTable('bank_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  bankName: varchar('bank_name', { length: 255 }).notNull(),
  accountNumber: varchar('account_number', { length: 50 }),
  iban: varchar('iban', { length: 50 }),
  swiftCode: varchar('swift_code', { length: 20 }),
  branch: varchar('branch', { length: 255 }),
  isDefault: boolean('is_default').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
