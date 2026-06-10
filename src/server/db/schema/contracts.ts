import { pgTable, uuid, varchar, text, numeric, integer, timestamp, boolean } from 'drizzle-orm/pg-core';
import { contractTypeEnum, paymentModeEnum, contractStatusEnum } from './enums';

export const contracts = pgTable('contracts', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  propertyId: uuid('property_id').notNull(),
  propertyTenantId: uuid('property_tenant_id').notNull(),
  ownerId: uuid('owner_id'),
  contractType: contractTypeEnum('contract_type').notNull().default('new'),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  rentAmount: numeric('rent_amount', { precision: 12, scale: 2 }).notNull(),
  securityDeposit: numeric('security_deposit', { precision: 12, scale: 2 }),
  commissionPct: numeric('commission_pct', { precision: 5, scale: 2 }),
  paymentMode: paymentModeEnum('payment_mode').notNull().default('cheques'),
  numCheques: integer('num_cheques').default(1).notNull(),
  ejariNumber: varchar('ejari_number', { length: 100 }),
  tawtheeqNumber: varchar('tawtheeq_number', { length: 100 }),
  contractDocUrl: text('contract_doc_url'),
  status: contractStatusEnum('status').notNull().default('active'),
  renewalReminderSent: boolean('renewal_reminder_sent').default(false).notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
