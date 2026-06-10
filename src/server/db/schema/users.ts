import { pgTable, uuid, varchar, text, timestamp, boolean, uniqueIndex } from 'drizzle-orm/pg-core';
import { userRoleEnum } from './enums';

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    phone: varchar('phone', { length: 30 }),
    name: varchar('name', { length: 255 }).notNull(),
    passwordHash: text('password_hash'),
    role: userRoleEnum('role').notNull().default('broker'),
    reraBrn: varchar('rera_brn', { length: 100 }),
    avatarUrl: text('avatar_url'),
    isActive: boolean('is_active').default(true).notNull(),
    lastLogin: timestamp('last_login'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('idx_users_email').on(table.email),
  ]
);
