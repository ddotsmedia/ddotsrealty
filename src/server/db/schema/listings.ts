import { pgTable, uuid, varchar, text, numeric, integer, timestamp, boolean } from 'drizzle-orm/pg-core';
import { listingTypeEnum, listingStatusEnum } from './enums';

export const listings = pgTable('listings', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  propertyId: uuid('property_id').notNull(),
  brokerId: uuid('broker_id'),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  listingType: listingTypeEnum('listing_type').notNull().default('rent'),
  price: numeric('price', { precision: 12, scale: 2 }),
  isFeatured: boolean('is_featured').default(false).notNull(),
  featuredUntil: timestamp('featured_until'),
  trakheesiPermit: varchar('trakheesi_permit', { length: 100 }),
  permitExpiry: timestamp('permit_expiry'),
  status: listingStatusEnum('status').notNull().default('draft'),
  viewsCount: integer('views_count').default(0).notNull(),
  enquiriesCount: integer('enquiries_count').default(0).notNull(),
  publishedAt: timestamp('published_at'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
