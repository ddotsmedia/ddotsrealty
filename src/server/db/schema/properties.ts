import { pgTable, uuid, varchar, text, integer, numeric, boolean, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { propertyTypeEnum, propertyPurposeEnum, propertyStatusEnum, priceFrequencyEnum, emirateEnum } from './enums';

export const properties = pgTable(
  'properties',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    referenceNo: varchar('reference_no', { length: 50 }),
    title: varchar('title', { length: 255 }).notNull(),
    type: propertyTypeEnum('type').notNull(),
    purpose: propertyPurposeEnum('purpose').notNull().default('rent'),
    status: propertyStatusEnum('status').notNull().default('available'),
    bedrooms: integer('bedrooms'),
    bathrooms: integer('bathrooms'),
    areaSqft: numeric('area_sqft', { precision: 10, scale: 2 }),
    price: numeric('price', { precision: 12, scale: 2 }),
    priceFrequency: priceFrequencyEnum('price_frequency').default('yearly'),
    currency: varchar('currency', { length: 3 }).default('AED').notNull(),
    address: text('address'),
    buildingName: varchar('building_name', { length: 255 }),
    community: varchar('community', { length: 255 }),
    emirate: emirateEnum('emirate'),
    latitude: numeric('latitude', { precision: 10, scale: 7 }),
    longitude: numeric('longitude', { precision: 10, scale: 7 }),
    amenities: jsonb('amenities').$type<string[]>().default([]),
    ownerId: uuid('owner_id'),
    assignedBroker: uuid('assigned_broker'),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('idx_properties_tenant_id').on(table.tenantId),
    index('idx_properties_status').on(table.status),
  ]
);

export const propertyPhotos = pgTable(
  'property_photos',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    propertyId: uuid('property_id').notNull(),
    url: text('url').notNull(),
    caption: varchar('caption', { length: 255 }),
    isPrimary: boolean('is_primary').default(false).notNull(),
    sortOrder: integer('sort_order').default(0).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  }
);
