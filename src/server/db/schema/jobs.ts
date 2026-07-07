import { pgTable, uuid, varchar, text, timestamp, index } from 'drizzle-orm/pg-core';

// Log of automated messages/jobs (reminders, alerts) for auditing + dashboard counters
export const jobLogs = pgTable(
  'job_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    jobType: varchar('job_type', { length: 50 }).notNull(), // cheque_reminder | cheque_overdue | contract_expiry | lead_followup | daily_summary
    entityType: varchar('entity_type', { length: 50 }),
    entityId: uuid('entity_id'),
    channel: varchar('channel', { length: 30 }).default('whatsapp').notNull(),
    recipient: varchar('recipient', { length: 100 }),
    status: varchar('status', { length: 20 }).default('sent').notNull(), // sent | failed | skipped
    message: text('message'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('idx_job_logs_tenant_created').on(table.tenantId, table.createdAt),
    index('idx_job_logs_type').on(table.jobType),
  ]
);
