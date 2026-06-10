import { pgTable, uuid, varchar, text, numeric, timestamp } from 'drizzle-orm/pg-core';
import { transactionTypeEnum, transactionPaymentMethodEnum, transactionStatusEnum, commissionDealTypeEnum, commissionStatusEnum } from './enums';

export const transactions = pgTable('transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  type: transactionTypeEnum('type').notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  vatAmount: numeric('vat_amount', { precision: 12, scale: 2 }),
  currency: varchar('currency', { length: 3 }).default('AED').notNull(),
  referenceType: varchar('reference_type', { length: 50 }),
  referenceId: uuid('reference_id'),
  fromEntity: varchar('from_entity', { length: 255 }),
  toEntity: varchar('to_entity', { length: 255 }),
  paymentMethod: transactionPaymentMethodEnum('payment_method'),
  status: transactionStatusEnum('status').notNull().default('pending'),
  receiptUrl: text('receipt_url'),
  notes: text('notes'),
  transactionDate: timestamp('transaction_date').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const commissions = pgTable('commissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  contractId: uuid('contract_id'),
  brokerId: uuid('broker_id'),
  listingId: uuid('listing_id'),
  dealType: commissionDealTypeEnum('deal_type').notNull(),
  dealValue: numeric('deal_value', { precision: 12, scale: 2 }),
  commissionPct: numeric('commission_pct', { precision: 5, scale: 2 }),
  commissionAmount: numeric('commission_amount', { precision: 12, scale: 2 }),
  companyShare: numeric('company_share', { precision: 12, scale: 2 }),
  brokerShare: numeric('broker_share', { precision: 12, scale: 2 }),
  status: commissionStatusEnum('status').notNull().default('pending'),
  paidDate: timestamp('paid_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
