import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  numeric,
  jsonb,
  integer,
} from 'drizzle-orm/pg-core';
import {
  occupantRelationshipEnum,
  inspectionTypeEnum,
  inspectionConditionEnum,
  inspectionRoomEnum,
  inspectionItemConditionEnum,
  keyHandoverTypeEnum,
  utilityTypeEnum,
  utilityStatusEnum,
  parkingTypeEnum,
  communicationChannelEnum,
  communicationDirectionEnum,
  communicationStatusEnum,
  communicationEntityTypeEnum,
  announcementTargetEnum,
  nocTypeEnum,
  nocStatusEnum,
  clearanceStatusEnum,
  settlementStatusEnum,
  depositRefundMethodEnum,
} from './enums';

export const contractOccupants = pgTable('contract_occupants', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  contractId: uuid('contract_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  emiratesId: text('emirates_id'),
  relationship: occupantRelationshipEnum('relationship')
    .notNull()
    .default('other'),
  nationality: varchar('nationality', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const inspections = pgTable('inspections', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  contractId: uuid('contract_id'),
  propertyId: uuid('property_id').notNull(),
  propertyTenantId: uuid('property_tenant_id'),
  type: inspectionTypeEnum('type').notNull().default('move_in'),
  inspectionDate: timestamp('inspection_date'),
  inspectorName: varchar('inspector_name', { length: 255 }),
  inspectorRole: varchar('inspector_role', { length: 100 }),
  overallCondition: inspectionConditionEnum('overall_condition'),
  notes: text('notes'),
  tenantSigned: boolean('tenant_signed').default(false).notNull(),
  tenantSignedAt: timestamp('tenant_signed_at'),
  reportPdfUrl: text('report_pdf_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const inspectionItems = pgTable('inspection_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  inspectionId: uuid('inspection_id').notNull(),
  room: inspectionRoomEnum('room').notNull().default('other'),
  item: varchar('item', { length: 255 }).notNull(),
  condition: inspectionItemConditionEnum('condition').notNull().default('good'),
  notes: text('notes'),
  photos: jsonb('photos').$type<string[]>().default([]),
  deductionAmount: numeric('deduction_amount', { precision: 10, scale: 2 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const keyHandovers = pgTable('key_handovers', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  contractId: uuid('contract_id'),
  propertyId: uuid('property_id').notNull(),
  propertyTenantId: uuid('property_tenant_id'),
  type: keyHandoverTypeEnum('type').notNull().default('handover'),
  handoverDate: timestamp('handover_date'),
  keys: jsonb('keys')
    .$type<{ type: string; quantity: number; condition?: string }[]>()
    .default([]),
  receivedBy: varchar('received_by', { length: 255 }),
  handedBy: varchar('handed_by', { length: 255 }),
  receiptSigned: boolean('receipt_signed').default(false).notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const utilityAccounts = pgTable('utility_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  contractId: uuid('contract_id'),
  propertyId: uuid('property_id').notNull(),
  propertyTenantId: uuid('property_tenant_id'),
  utilityType: utilityTypeEnum('utility_type').notNull().default('dewa'),
  accountNumber: varchar('account_number', { length: 100 }),
  premiseNumber: varchar('premise_number', { length: 100 }),
  status: utilityStatusEnum('status').notNull().default('pending_activation'),
  activationDate: timestamp('activation_date'),
  deactivationDate: timestamp('deactivation_date'),
  securityDeposit: numeric('security_deposit', { precision: 10, scale: 2 }),
  depositRefunded: boolean('deposit_refunded').default(false).notNull(),
  clearanceCertUrl: text('clearance_cert_url'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const parkingSlots = pgTable('parking_slots', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  propertyId: uuid('property_id').notNull(),
  slotNumber: varchar('slot_number', { length: 50 }),
  floorLevel: varchar('floor_level', { length: 50 }),
  type: parkingTypeEnum('type').notNull().default('covered'),
  assignedTo: uuid('assigned_to'),
  contractId: uuid('contract_id'),
  vehiclePlate: varchar('vehicle_plate', { length: 50 }),
  vehicleMake: varchar('vehicle_make', { length: 100 }),
  isAvailable: boolean('is_available').default(true).notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const communications = pgTable('communications', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  entityType: communicationEntityTypeEnum('entity_type')
    .notNull()
    .default('property_tenant'),
  entityId: uuid('entity_id'),
  channel: communicationChannelEnum('channel').notNull().default('whatsapp'),
  direction: communicationDirectionEnum('direction')
    .notNull()
    .default('outbound'),
  subject: varchar('subject', { length: 255 }),
  content: text('content'),
  sentBy: uuid('sent_by'),
  status: communicationStatusEnum('status').notNull().default('sent'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const announcements = pgTable('announcements', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content'),
  targetType: announcementTargetEnum('target_type').notNull().default('all'),
  targetIds: jsonb('target_ids').$type<string[]>().default([]),
  sentVia: jsonb('sent_via').$type<string[]>().default([]),
  publishedAt: timestamp('published_at'),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const nocRequests = pgTable('noc_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  propertyTenantId: uuid('property_tenant_id'),
  contractId: uuid('contract_id'),
  nocType: nocTypeEnum('noc_type').notNull().default('other'),
  description: text('description'),
  status: nocStatusEnum('status').notNull().default('requested'),
  reviewedBy: uuid('reviewed_by'),
  reviewedAt: timestamp('reviewed_at'),
  rejectionReason: text('rejection_reason'),
  nocDocumentUrl: text('noc_document_url'),
  validUntil: timestamp('valid_until'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const tenantClearances = pgTable('tenant_clearances', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  contractId: uuid('contract_id'),
  propertyId: uuid('property_id'),
  propertyTenantId: uuid('property_tenant_id'),
  noticeDate: timestamp('notice_date'),
  noticePeriodDays: integer('notice_period_days'),
  plannedMoveOut: timestamp('planned_move_out'),
  actualMoveOut: timestamp('actual_move_out'),
  moveOutInspectionId: uuid('move_out_inspection_id'),
  damageDeductions: numeric('damage_deductions', { precision: 10, scale: 2 }),
  outstandingRent: numeric('outstanding_rent', { precision: 10, scale: 2 })
    .default('0')
    .notNull(),
  outstandingUtility: numeric('outstanding_utility', { precision: 10, scale: 2 })
    .default('0')
    .notNull(),
  outstandingMaintenance: numeric('outstanding_maintenance', {
    precision: 10,
    scale: 2,
  })
    .default('0')
    .notNull(),
  penaltyAmount: numeric('penalty_amount', { precision: 10, scale: 2 })
    .default('0')
    .notNull(),
  totalOutstanding: numeric('total_outstanding', { precision: 12, scale: 2 })
    .default('0')
    .notNull(),
  settlementStatus: settlementStatusEnum('settlement_status')
    .notNull()
    .default('pending'),
  depositAmount: numeric('deposit_amount', { precision: 12, scale: 2 }),
  depositDeductions: numeric('deposit_deductions', { precision: 10, scale: 2 })
    .default('0')
    .notNull(),
  depositRefundAmount: numeric('deposit_refund_amount', {
    precision: 12,
    scale: 2,
  })
    .default('0')
    .notNull(),
  depositRefundMethod: depositRefundMethodEnum('deposit_refund_method'),
  depositRefundDate: timestamp('deposit_refund_date'),
  depositRefundRef: varchar('deposit_refund_ref', { length: 100 }),
  chequesReturned: boolean('cheques_returned').default(false).notNull(),
  chequesReturnedDate: timestamp('cheques_returned_date'),
  chequesReturnReceiptUrl: text('cheques_return_receipt_url'),
  dewaCleared: boolean('dewa_cleared').default(false).notNull(),
  dewaClearanceDate: timestamp('dewa_clearance_date'),
  dewaClearanceCertUrl: text('dewa_clearance_cert_url'),
  ejariCancelled: boolean('ejari_cancelled').default(false).notNull(),
  ejariCancelDate: timestamp('ejari_cancel_date'),
  keysReturned: boolean('keys_returned').default(false).notNull(),
  keysReturnedDate: timestamp('keys_returned_date'),
  clearanceStatus: clearanceStatusEnum('clearance_status')
    .notNull()
    .default('in_progress'),
  clearanceCertUrl: text('clearance_cert_url'),
  clearedBy: uuid('cleared_by'),
  clearedAt: timestamp('cleared_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
