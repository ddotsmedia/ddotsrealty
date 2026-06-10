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
