import { pgEnum } from 'drizzle-orm/pg-core';

export const emirateEnum = pgEnum('emirate', [
  'abu_dhabi',
  'dubai',
  'sharjah',
  'ajman',
  'umm_al_quwain',
  'ras_al_khaimah',
  'fujairah',
]);

export const tenantTypeEnum = pgEnum('tenant_type', [
  'agency',
  'landlord',
  'independent',
]);

export const subscriptionTierEnum = pgEnum('subscription_tier', [
  'free',
  'basic',
  'pro',
  'enterprise',
]);

export const userRoleEnum = pgEnum('user_role', [
  'super_admin',
  'admin',
  'manager',
  'broker',
  'accountant',
  'viewer',
]);

export const propertyTypeEnum = pgEnum('property_type', [
  'apartment',
  'villa',
  'townhouse',
  'office',
  'warehouse',
  'land',
  'building',
  'penthouse',
  'studio',
]);

export const propertyPurposeEnum = pgEnum('property_purpose', [
  'rent',
  'sale',
  'both',
]);

export const propertyStatusEnum = pgEnum('property_status', [
  'available',
  'rented',
  'sold',
  'under_maintenance',
  'off_market',
]);

export const priceFrequencyEnum = pgEnum('price_frequency', [
  'yearly',
  'monthly',
  'weekly',
  'daily',
  'total',
]);

export const contractTypeEnum = pgEnum('contract_type', [
  'new',
  'renewal',
]);

export const paymentModeEnum = pgEnum('payment_mode', [
  'cheques',
  'bank_transfer',
  'cash',
  'mixed',
]);

export const contractStatusEnum = pgEnum('contract_status', [
  'active',
  'expired',
  'terminated',
  'pending_renewal',
]);

export const chequeStatusEnum = pgEnum('cheque_status', [
  'pending',
  'deposited',
  'cleared',
  'bounced',
  'replaced',
  'cancelled',
  // Expanded lifecycle (appended to keep enum migration additive)
  'collected',
  'in_custody',
  'with_owner',
  'pending_deposit',
  'postponed',
  'returned',
  'stale',
]);

export const chequeDirectionEnum = pgEnum('cheque_direction', [
  'receivable',
  'payable',
]);

export const securityDepositStatusEnum = pgEnum('security_deposit_status', [
  'held',
  'partially_refunded',
  'fully_refunded',
  'forfeited',
]);

export const listingTypeEnum = pgEnum('listing_type', [
  'rent',
  'sale',
]);

export const listingStatusEnum = pgEnum('listing_status', [
  'draft',
  'active',
  'paused',
  'expired',
  'sold',
  'rented',
]);

export const leadSourceEnum = pgEnum('lead_source', [
  'website',
  'whatsapp',
  'phone',
  'walk_in',
  'referral',
  'portal',
  'social',
]);

export const leadStatusEnum = pgEnum('lead_status', [
  'new',
  'contacted',
  'qualified',
  'viewing',
  'negotiation',
  'won',
  'lost',
]);

export const leadActivityTypeEnum = pgEnum('lead_activity_type', [
  'call',
  'whatsapp',
  'email',
  'viewing',
  'meeting',
  'note',
]);

export const maintenanceCategoryEnum = pgEnum('maintenance_category', [
  'plumbing',
  'electrical',
  'ac',
  'painting',
  'carpentry',
  'cleaning',
  'pest_control',
  'other',
]);

export const maintenancePriorityEnum = pgEnum('maintenance_priority', [
  'low',
  'medium',
  'high',
  'urgent',
]);

export const maintenanceStatusEnum = pgEnum('maintenance_status', [
  'reported',
  'approved',
  'in_progress',
  'completed',
  'cancelled',
]);

export const transactionTypeEnum = pgEnum('transaction_type', [
  'rent_income',
  'commission',
  'maintenance_cost',
  'refund',
  'deposit',
  'other',
]);

export const transactionPaymentMethodEnum = pgEnum('transaction_payment_method', [
  'cheque',
  'bank_transfer',
  'cash',
  'card',
  'online',
]);

export const transactionStatusEnum = pgEnum('transaction_status', [
  'pending',
  'completed',
  'failed',
  'refunded',
]);

export const commissionDealTypeEnum = pgEnum('commission_deal_type', [
  'rent',
  'sale',
]);

export const commissionStatusEnum = pgEnum('commission_status', [
  'pending',
  'approved',
  'paid',
]);

export const documentEntityTypeEnum = pgEnum('document_entity_type', [
  'property',
  'contract',
  'owner',
  'tenant',
  'broker',
  'company',
  'maintenance',
]);

export const docTypeEnum = pgEnum('doc_type', [
  'trade_license',
  'rera_card',
  'ejari',
  'tawtheeq',
  'title_deed',
  'passport',
  'emirates_id',
  'contract',
  'noc',
  'oqood',
  'invoice',
  'other',
]);

export const visaStatusEnum = pgEnum('visa_status', [
  'valid',
  'expired',
  'in_process',
  'cancelled',
]);

export const salaryRangeEnum = pgEnum('salary_range', [
  'below_5k',
  '5k_10k',
  '10k_20k',
  '20k_50k',
  'above_50k',
]);

export const screeningStatusEnum = pgEnum('screening_status', [
  'pending',
  'approved',
  'rejected',
  'waived',
]);

export const occupantRelationshipEnum = pgEnum('occupant_relationship', [
  'spouse',
  'child',
  'parent',
  'sibling',
  'domestic_help',
  'other',
]);

export const inspectionTypeEnum = pgEnum('inspection_type', [
  'move_in',
  'move_out',
  'periodic',
  'complaint',
]);

export const inspectionConditionEnum = pgEnum('inspection_condition', [
  'excellent',
  'good',
  'fair',
  'poor',
]);

export const inspectionRoomEnum = pgEnum('inspection_room', [
  'living_room',
  'bedroom_master',
  'bedroom_2',
  'bedroom_3',
  'kitchen',
  'bathroom_master',
  'bathroom_2',
  'bathroom_3',
  'balcony',
  'entrance',
  'store',
  'laundry',
  'garage',
  'garden',
  'common_area',
  'other',
]);

export const inspectionItemConditionEnum = pgEnum('inspection_item_condition', [
  'new',
  'good',
  'fair',
  'damaged',
  'missing',
]);

export const keyHandoverTypeEnum = pgEnum('key_handover_type', [
  'handover',
  'return',
]);

export const utilityTypeEnum = pgEnum('utility_type', [
  'dewa',
  'aadc',
  'sewa',
  'fewa',
  'internet',
  'gas',
  'chiller',
]);

export const utilityStatusEnum = pgEnum('utility_status', [
  'pending_activation',
  'active',
  'pending_deactivation',
  'deactivated',
  'clearance_pending',
  'cleared',
]);

export const parkingTypeEnum = pgEnum('parking_type', [
  'covered',
  'uncovered',
  'basement',
  'valet',
]);

export const communicationChannelEnum = pgEnum('communication_channel', [
  'whatsapp',
  'email',
  'phone',
  'sms',
  'portal',
  'in_person',
]);

export const communicationDirectionEnum = pgEnum('communication_direction', [
  'inbound',
  'outbound',
]);

export const communicationStatusEnum = pgEnum('communication_status', [
  'sent',
  'delivered',
  'read',
  'failed',
]);

export const communicationEntityTypeEnum = pgEnum('communication_entity_type', [
  'property_tenant',
  'owner',
  'lead',
  'staff',
]);

export const announcementTargetEnum = pgEnum('announcement_target', [
  'all',
  'building',
  'community',
  'specific_tenants',
]);

export const nocTypeEnum = pgEnum('noc_type', [
  'subletting',
  'renovation',
  'pet',
  'satellite_dish',
  'business_activity',
  'visa_sponsorship',
  'parking',
  'move_in',
  'move_out',
  'other',
]);

export const nocStatusEnum = pgEnum('noc_status', [
  'requested',
  'under_review',
  'approved',
  'rejected',
]);

export const clearanceStatusEnum = pgEnum('clearance_status', [
  'in_progress',
  'pending_payment',
  'pending_inspection',
  'pending_dewa',
  'pending_ejari',
  'completed',
]);

export const settlementStatusEnum = pgEnum('settlement_status', [
  'pending',
  'partial',
  'settled',
]);

export const depositRefundMethodEnum = pgEnum('deposit_refund_method', [
  'cheque',
  'bank_transfer',
  'cash',
]);
