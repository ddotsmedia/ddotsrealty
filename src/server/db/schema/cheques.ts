import { pgTable, uuid, varchar, text, numeric, timestamp, index } from 'drizzle-orm/pg-core';
import { chequeStatusEnum } from './enums';

export const cheques = pgTable(
  'cheques',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    contractId: uuid('contract_id'),
    propertyId: uuid('property_id'),
    propertyTenantId: uuid('property_tenant_id'),
    ownerId: uuid('owner_id'),
    chequeNumber: varchar('cheque_number', { length: 50 }),
    bankName: varchar('bank_name', { length: 255 }),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    dueDate: timestamp('due_date').notNull(),
    status: chequeStatusEnum('status').notNull().default('pending'),
    depositedDate: timestamp('deposited_date'),
    clearedDate: timestamp('cleared_date'),
    bounceReason: text('bounce_reason'),
    replacementChequeId: uuid('replacement_cheque_id'),
    chequeImageUrl: text('cheque_image_url'),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('idx_cheques_due_date').on(table.dueDate),
    index('idx_cheques_tenant_status').on(table.tenantId, table.status),
  ]
);
